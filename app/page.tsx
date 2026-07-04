"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

const GENRES = ["Horor", "Romance", "Misteri", "Komedi", "Petualangan"];

type Story = {
  id: number;
  title: string;
  genre: string;
  synopsis: string | null;
};

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>(GENRES[0]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Intro & Session Check
  const [showIntro, setShowIntro] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Cek apakah user sudah pernah buka pintu di sesi ini (Bebas Error ESLint)
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
      if (!hasSeenIntro) {
        setShowIntro(true); 
      }
      setIsCheckingSession(false); 
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Mengambil data cerita
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("stories")
        .select("id, title, genre, synopsis")
        .eq("status", "Active")
        .eq("genre", activeGenre);
      setStories(data ?? []);
      setLoading(false);
    }
    load();
  }, [activeGenre]);

  // Fungsi saat tombol Buka Pintu diklik
  const handleEnter = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem("hasSeenIntro", "true");
    }, 1000);
  };

  // Mencegah kedip / flash konten saat sistem sedang mengecek session
  if (isCheckingSession) {
    return <div className="min-h-screen bg-[#F4EAE0]" />;
  }

  return (
    <>
      {/* LAYAR SAMBUTAN (SPLASH SCREEN) */}
      {showIntro && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out ${
            isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="absolute inset-0 w-full h-full">
            <Image
              src="/bg-flore.jpg" 
              alt="FLORE Background"
              fill
              className="object-cover" 
              priority
            />
          </div>
            
          <div className="absolute bottom-16 md:bottom-24 z-10">
            <button
              onClick={handleEnter}
              className="px-8 py-3 bg-transparent border border-[#5A4634] text-[#5A4634] font-ui text-sm md:text-base uppercase tracking-widest hover:bg-[#5A4634] hover:text-[#F4EAE0] transition duration-500 rounded-sm"
            >
              Buka Pintu
            </button>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-flore-espresso mb-1">FLORE</h1>
        <p className="font-ui text-flore-mocha text-sm mb-8">
          every story, blooms here.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`font-ui text-sm px-4 py-2 rounded-full border transition ${
                activeGenre === g
                  ? "bg-flore-gold text-white border-flore-gold"
                  : "bg-flore-peach text-flore-mocha border-flore-gold-light"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {loading && (
          <p className="font-ui text-flore-mocha text-sm animate-pulse">
            Menyibak lembaran cerita...
          </p>
        )}

        {!loading && stories.length === 0 && (
          <p className="font-ui text-flore-mocha text-sm">
            Belum ada cerita aktif untuk genre ini.
          </p>
        )}

        <div className="grid gap-4">
          {stories.map((s) => (
            <Link
              key={s.id}
              href={`/story/${s.id}`}
              className="block bg-flore-peach rounded-2xl p-5 border border-flore-gold-light hover:border-flore-gold transition group"
            >
              <h2 className="font-display text-2xl text-flore-espresso group-hover:text-flore-gold transition-colors">
                {s.title}
              </h2>
              {s.synopsis && (
                <p className="font-body text-flore-mocha text-sm mt-1 line-clamp-2">
                  {s.synopsis}
                </p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}