import { Cormorant_Garamond, Literata, Work_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
});
const body = Literata({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-literata",
});
const ui = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-worksans",
});

export const metadata = {
  title: "FLORE — Cerita Interaktif",
  description: "Pilih dunia, tentukan alurmu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${ui.variable}`}>
      <body className="bg-flore-cream text-flore-espresso font-body">{children}</body>
    </html>
  );
}