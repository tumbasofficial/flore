"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl text-flore-espresso mb-1">FLORE</h1>
      <p className="font-ui text-flore-mocha text-sm mb-8">
        Pilih dunia, tentukan alurmu.
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
        <p className="font-ui text-flore-mocha text-sm">Memuat cerita...</p>
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
            className="block bg-flore-peach rounded-2xl p-5 border border-flore-gold-light hover:border-flore-gold transition"
          >
            <h2 className="font-display text-2xl text-flore-espresso">
              {s.title}
            </h2>
            {s.synopsis && (
              <p className="font-body text-flore-mocha text-sm mt-1">
                {s.synopsis}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}