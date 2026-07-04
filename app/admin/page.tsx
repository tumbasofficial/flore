"use client";

import { useCallback, useEffect, useState } from "react";

type Stats = { totalStories: number; totalChapters: number; unusedCodes: number };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  // Menambahkan cover_url ke dalam state form
  const [storyForm, setStoryForm] = useState({ title: "", genre: "Horor", synopsis: "", cover_url: "" });
  
  const [chapterForm, setChapterForm] = useState({
    story_id: "", chapter_number: "", content: "", fase: "1",
    clue_question: "", option_a: "", option_b: "", correct_option: "A",
  });
  const [bulkCodes, setBulkCodes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // PERBAIKAN 1: Membungkus session dengan setTimeout
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = sessionStorage.getItem("flore_admin_pw");
      if (saved) {
        setPassword(saved);
        setAuthed(true);
      }
      setCheckingSession(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) setStats(await res.json());
  }, [password]);

  // PERBAIKAN 2: Membungkus loadStats dengan setTimeout
  useEffect(() => {
    if (authed) {
      const timer = setTimeout(() => {
        loadStats();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [authed, loadStats]);

  async function handleLogin() {
    const res = await fetch("/api/admin/stats", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      sessionStorage.setItem("flore_admin_pw", password);
      setAuthed(true);
    } else {
      setMsg("Password salah.");
    }
  }

  async function submitStory() {
    setMsg(null);
    const res = await fetch("/api/admin/add-story", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify(storyForm),
    });
    setMsg(res.ok ? "Cerita ditambahkan." : "Gagal menambah cerita.");
    if (res.ok) {
      setStoryForm({ title: "", genre: "Horor", synopsis: "", cover_url: "" });
      loadStats();
    }
  }

  async function submitChapter() {
    setMsg(null);
    const res = await fetch("/api/admin/add-chapter", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({
        ...chapterForm,
        story_id: Number(chapterForm.story_id),
        chapter_number: Number(chapterForm.chapter_number),
        fase: Number(chapterForm.fase),
      }),
    });
    setMsg(res.ok ? "Chapter ditambahkan." : "Gagal menambah chapter.");
    if (res.ok) loadStats();
  }

  async function submitCodes() {
    setMsg(null);
    const codes = bulkCodes.split("\n").map((c) => c.trim()).filter(Boolean);
    const res = await fetch("/api/admin/add-vip-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ codes }),
    });
    setMsg(res.ok ? `${codes.length} kode VIP ditambahkan.` : "Gagal menambah kode.");
    if (res.ok) {
      setBulkCodes("");
      loadStats();
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-ui text-flore-mocha">Memuat...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="bg-flore-peach p-6 rounded-2xl border border-flore-gold-light w-80">
          <h1 className="font-display text-2xl text-flore-espresso mb-4">Admin FLORE</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password admin"
            className="w-full font-ui text-sm px-3 py-2 rounded-full border border-flore-gold-light mb-3"
          />
          <button
            onClick={handleLogin}
            className="w-full font-ui text-sm py-2 rounded-full bg-flore-gold text-white"
          >
            Masuk
          </button>
          {msg ? <p className="font-ui text-xs text-flore-mocha mt-2">{msg}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-flore-espresso mb-6">Dashboard Admin</h1>

      {stats ? (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-flore-peach rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-flore-espresso">{stats.totalStories}</p>
            <p className="font-ui text-xs text-flore-mocha">Judul</p>
          </div>
          <div className="bg-flore-peach rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-flore-espresso">{stats.totalChapters}</p>
            <p className="font-ui text-xs text-flore-mocha">Chapter</p>
          </div>
          <div className="bg-flore-peach rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-flore-espresso">{stats.unusedCodes}</p>
            <p className="font-ui text-xs text-flore-mocha">Stok Kode VIP</p>
          </div>
        </div>
      ) : null}

      {msg ? <p className="font-ui text-sm text-flore-mocha mb-4">{msg}</p> : null}

      <section className="mb-8">
        <h2 className="font-display text-xl text-flore-espresso mb-3">Tambah Cerita Baru</h2>
        <div className="grid gap-2">
          <input
            placeholder="Judul cerita"
            value={storyForm.title}
            onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <select
            value={storyForm.genre}
            onChange={(e) => setStoryForm({ ...storyForm, genre: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          >
            {["Horor", "Romance", "Misteri", "Komedi", "Petualangan"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <textarea
            placeholder="Sinopsis singkat"
            value={storyForm.synopsis}
            onChange={(e) => setStoryForm({ ...storyForm, synopsis: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <input
            placeholder="Link gambar cover (URL opsional)"
            value={storyForm.cover_url}
            onChange={(e) => setStoryForm({ ...storyForm, cover_url: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <button onClick={submitStory} className="font-ui text-sm py-2 rounded-full bg-flore-gold text-white">
            Simpan Cerita
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl text-flore-espresso mb-3">Tambah Chapter</h2>
        <div className="grid gap-2">
          <input
            placeholder="Story ID (lihat di database)"
            value={chapterForm.story_id}
            onChange={(e) => setChapterForm({ ...chapterForm, story_id: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <input
            placeholder="Nomor bab"
            value={chapterForm.chapter_number}
            onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <select
            value={chapterForm.fase}
            onChange={(e) => setChapterForm({ ...chapterForm, fase: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          >
            <option value="1">Fase 1 (Bab 1-5)</option>
            <option value="2">Fase 2 (Bab 6-15)</option>
            <option value="3">Fase 3 (Bab 16-25)</option>
            <option value="4">Fase 4 (Bab 26-Tamat)</option>
          </select>
          <textarea
            placeholder="Isi naskah cerita"
            value={chapterForm.content}
            onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
            rows={6}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <input
            placeholder="Pertanyaan tebakan (opsional)"
            value={chapterForm.clue_question}
            onChange={(e) => setChapterForm({ ...chapterForm, clue_question: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <input
            placeholder="Pilihan A"
            value={chapterForm.option_a}
            onChange={(e) => setChapterForm({ ...chapterForm, option_a: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <input
            placeholder="Pilihan B"
            value={chapterForm.option_b}
            onChange={(e) => setChapterForm({ ...chapterForm, option_b: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          />
          <select
            value={chapterForm.correct_option}
            onChange={(e) => setChapterForm({ ...chapterForm, correct_option: e.target.value })}
            className="font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light"
          >
            <option value="A">Jawaban benar: A</option>
            <option value="B">Jawaban benar: B</option>
          </select>
          <button onClick={submitChapter} className="font-ui text-sm py-2 rounded-full bg-flore-gold text-white">
            Simpan Chapter
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-flore-espresso mb-3">Upload Stok Kode VIP</h2>
        <textarea
          placeholder={"Satu kode per baris, contoh:\nFLORE-A1B2\nFLORE-C3D4"}
          value={bulkCodes}
          onChange={(e) => setBulkCodes(e.target.value)}
          rows={5}
          className="w-full font-ui text-sm px-3 py-2 rounded-lg border border-flore-gold-light mb-2"
        />
        <button onClick={submitCodes} className="font-ui text-sm py-2 px-5 rounded-full bg-flore-espresso text-white">
          Upload Kode
        </button>
      </section>
    </main>
  );
}