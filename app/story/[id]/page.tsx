"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getUnlockedUpTo, getScore } from "@/lib/quota";

type Story = {
  id: number;
  title: string;
  genre: string;
  synopsis: string | null;
};

type Chapter = {
  id: number;
  chapter_number: number;
  fase: number;
};

const FASE_LABEL: Record<number, string> = {
  1: "Pengenalan",
  2: "Konflik",
  3: "Klimaks",
  4: "Ending",
};

export default function StoryDetailPage() {
  const params = useParams();
  const storyId = Number(params.id);

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [unlockedUpTo, setUnlockedUpToState] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: storyData } = await supabase
        .from("stories")
        .select("id, title, genre, synopsis")
        .eq("id", storyId)
        .single();
      setStory(storyData ?? null);

      const { data: chapterData } = await supabase
        .from("chapters")
        .select("id, chapter_number, fase")
        .eq("story_id", storyId)
        .order("chapter_number", { ascending: true });
      setChapters(chapterData ?? []);

      setUnlockedUpToState(getUnlockedUpTo(storyId));
      setLoading(false);
    }
    if (storyId) load();
  }, [storyId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-ui text-flore-mocha">Memuat cerita...</p>
      </main>
    );
  }

  if (!story) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-ui text-flore-mocha">Cerita tidak ditemukan.</p>
      </main>
    );
  }

  const score = getScore(storyId);
  const hasStarted = unlockedUpTo > 1 || score.total > 0;

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <Link href="/" className="font-ui text-sm text-flore-mocha mb-6 inline-block">
        ← Kembali ke Menu Utama
      </Link>

      <p className="font-ui text-xs text-flore-mocha uppercase tracking-wide mb-1">
        {story.genre}
      </p>
      <h1 className="font-display text-4xl text-flore-espresso mb-3">
        {story.title}
      </h1>
      {story.synopsis ? (
        <p className="font-body text-flore-mocha mb-6">{story.synopsis}</p>
      ) : null}

      <div className="bg-flore-peach rounded-2xl p-5 border border-flore-gold-light mb-8">
        <p className="font-ui text-sm text-flore-espresso mb-1">
          Total {chapters.length} bab tersedia.
        </p>
        <p className="font-ui text-xs text-flore-mocha">
          {hasStarted
            ? `Kamu sudah membaca sampai Bab ${unlockedUpTo}.`
            : "Kamu belum mulai membaca cerita ini."}
        </p>
        <Link
          href={`/story/${storyId}/read${
            hasStarted ? `?chapter=${unlockedUpTo}` : ""
          }`}
          className="inline-block mt-4 font-ui text-sm px-6 py-3 rounded-full bg-flore-gold text-white"
        >
          {hasStarted ? "Lanjutkan Membaca" : "Mulai Membaca"}
        </Link>
      </div>

      <h2 className="font-display text-xl text-flore-espresso mb-3">
        Daftar Bab
      </h2>
      <div className="grid gap-2">
        {chapters.map((c) => {
          const isUnlocked = c.chapter_number <= unlockedUpTo;
          return isUnlocked ? (
            <Link
              key={c.id}
              href={`/story/${storyId}/read?chapter=${c.chapter_number}`}
              className="flex items-center justify-between bg-flore-peach rounded-xl px-4 py-3 border border-flore-gold-light hover:border-flore-gold transition"
            >
              <span className="font-ui text-sm text-flore-espresso">
                Bab {c.chapter_number}
              </span>
              <span className="font-ui text-xs text-flore-mocha">
                {FASE_LABEL[c.fase] ?? ""}
              </span>
            </Link>
          ) : (
            <div
              key={c.id}
              className="flex items-center justify-between bg-flore-cream rounded-xl px-4 py-3 border border-flore-gold-light opacity-50"
            >
              <span className="font-ui text-sm text-flore-mocha">
                🔒 Bab {c.chapter_number}
              </span>
              <span className="font-ui text-xs text-flore-mocha">
                {FASE_LABEL[c.fase] ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}