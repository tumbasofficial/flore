"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  canReadNextChapter,
  consumeQuota,
  getUnlockedUpTo,
  setUnlockedUpTo,
  recordAnswer,
  isChapterAnswered,
  getScore,
  addVipBonus,
  getDeviceId,
} from "@/lib/quota";

type Chapter = {
  id: number;
  chapter_number: number;
  content: string;
  fase: number;
  clue_question: string | null;
  option_a: string | null;
  option_b: string | null;
  correct_option: string | null;
};

export default function StoryReadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storyId = Number(params.id);
  const requestedChapter = searchParams.get("chapter");

  const [storyTitle, setStoryTitle] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [unlockedUpTo, setUnlockedUpToState] = useState(1);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [vipCode, setVipCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: story } = await supabase
        .from("stories")
        .select("title")
        .eq("id", storyId)
        .single();
      setStoryTitle(story?.title ?? "");

      const { data: chapterList } = await supabase
        .from("chapters")
        .select("*")
        .eq("story_id", storyId)
        .order("chapter_number", { ascending: true });

      const list = chapterList ?? [];
      setChapters(list);

      const savedUnlockedUpTo = getUnlockedUpTo(storyId);
      setUnlockedUpToState(savedUnlockedUpTo);

      const targetChapter = requestedChapter
        ? Number(requestedChapter)
        : savedUnlockedUpTo;

      const startIndex = list.findIndex(
        (c) => c.chapter_number === targetChapter
      );
      const resolvedIndex = startIndex >= 0 ? startIndex : 0;
      setCurrentIndex(resolvedIndex);

      const resolvedChapterNumber = list[resolvedIndex]?.chapter_number ?? 1;
      setAnswered(isChapterAnswered(storyId, resolvedChapterNumber));

      setLoading(false);
    }
    if (storyId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  const current = chapters[currentIndex];
  const isFirstChapter = currentIndex === 0;
  const isLastChapter = currentIndex === chapters.length - 1;

  function handleAnswer(choice: "A" | "B") {
    if (!current) return;
    const isCorrect = choice === current.correct_option;
    recordAnswer(storyId, current.chapter_number, isCorrect);
    setFeedback(
      isCorrect ? "Gimana instingmu?" : "Gimana instingmu?"
    );
    setAnswered(true);
  }

  function goToPreviousChapter() {
    if (isFirstChapter) return;
    const prev = chapters[currentIndex - 1];
    setCurrentIndex(currentIndex - 1);
    setAnswered(isChapterAnswered(storyId, prev.chapter_number));
    setFeedback(null);
    setBlocked(false);
  }

  async function goToNextChapter() {
    if (isLastChapter) return;
    const next = chapters[currentIndex + 1];

    // Kalau bab berikutnya sudah pernah dibuka sebelumnya, tidak perlu potong kuota lagi
    if (next.chapter_number <= unlockedUpTo) {
      setCurrentIndex(currentIndex + 1);
      setAnswered(isChapterAnswered(storyId, next.chapter_number));
      setFeedback(null);
      setBlocked(false);
      return;
    }

    const allowed = await canReadNextChapter(next.fase);
    if (!allowed) {
      setBlocked(true);
      return;
    }

    await consumeQuota();
    setUnlockedUpTo(storyId, next.chapter_number);
    setUnlockedUpToState(next.chapter_number);
    setCurrentIndex(currentIndex + 1);
    setAnswered(false);
    setFeedback(null);
    setBlocked(false);
  }

  async function handleRedeem() {
    setRedeemMsg(null);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: vipCode.trim(), deviceId: getDeviceId() }),
    });
    const data = await res.json();

    if (!res.ok) {
      setRedeemMsg(data.error ?? "Kode tidak valid.");
      return;
    }

    await addVipBonus(5);
    setRedeemMsg("Kode berhasil dipakai! 5 chapter tambahan terbuka.");
    setBlocked(false);
    setVipCode("");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-ui text-flore-mocha">Memuat cerita...</p>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-ui text-flore-mocha">Cerita belum tersedia.</p>
      </main>
    );
  }

  const score = getScore(storyId);

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/story/${storyId}`}
          className="font-ui text-sm text-flore-mocha"
        >
          ← Daftar Bab
        </Link>
        <Link href="/" className="font-ui text-sm text-flore-mocha">
          Menu Utama
        </Link>
      </div>

      <p className="font-ui text-xs text-flore-mocha uppercase tracking-wide mb-1">
        {storyTitle}
      </p>

      <h1 className="font-display text-3xl text-flore-espresso mb-6">
        Bab {current.chapter_number}
      </h1>

      <div className="font-body text-flore-espresso leading-relaxed whitespace-pre-line mb-8">
        {current.content}
      </div>

      {current.clue_question && !answered ? (
        <div className="bg-flore-peach rounded-2xl p-5 border border-flore-gold-light mb-6">
          <p className="font-ui text-sm text-flore-espresso mb-3">
            {current.clue_question}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer("A")}
              className="flex-1 font-ui text-sm py-2 rounded-full bg-flore-gold text-white"
            >
              {current.option_a}
            </button>
            <button
              onClick={() => handleAnswer("B")}
              className="flex-1 font-ui text-sm py-2 rounded-full bg-flore-gold text-white"
            >
              {current.option_b}
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p className="font-ui text-sm text-flore-mocha mb-4">{feedback}</p>
      ) : null}

      <div className="flex gap-3">
        {!isFirstChapter ? (
          <button
            onClick={goToPreviousChapter}
            className="font-ui text-sm px-6 py-3 rounded-full border border-flore-gold text-flore-espresso"
          >
            ← Bab Sebelumnya
          </button>
        ) : null}

        {(answered || !current.clue_question) && !isLastChapter && !blocked ? (
          <button
            onClick={goToNextChapter}
            className="font-ui text-sm px-6 py-3 rounded-full bg-flore-espresso text-white"
          >
            Lanjut ke Bab Berikutnya
          </button>
        ) : null}
      </div>

      {isLastChapter ? (
        <div className="bg-flore-peach rounded-2xl p-5 border border-flore-gold-light mt-6">
          <p className="font-display text-xl text-flore-espresso mb-1">
            Cerita Tamat
          </p>
          <p className="font-ui text-sm text-flore-mocha">
            Tebakan benar: {score.correct} dari {score.total}
          </p>
        </div>
      ) : null}

      {blocked ? (
        <div className="bg-flore-peach rounded-2xl p-5 border border-flore-gold mt-4">
          <p className="font-ui text-sm text-flore-espresso mb-3">
            Kuota baca gratis hari ini sudah habis. Buka 5 chapter tambahan lewat Trakteer.
          </p>

          <a
            href={process.env.NEXT_PUBLIC_TRAKTEER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-ui text-sm px-5 py-2 rounded-full bg-flore-gold text-white mb-4"
          >
            Buka 5 Chapter VIP via Trakteer
          </a>

          <div className="flex gap-2">
            <input
              value={vipCode}
              onChange={(e) => setVipCode(e.target.value)}
              placeholder="Masukkan kode VIP"
              className="flex-1 font-ui text-sm px-3 py-2 rounded-full border border-flore-gold-light bg-white"
            />
            <button
              onClick={handleRedeem}
              className="font-ui text-sm px-4 py-2 rounded-full bg-flore-espresso text-white"
            >
              Pakai
            </button>
          </div>

          {redeemMsg ? (
            <p className="font-ui text-xs text-flore-mocha mt-2">{redeemMsg}</p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}