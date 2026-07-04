import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const dateStr = wib.toISOString().split("T")[0]; // YYYY-MM-DD
  return NextResponse.json({ date: dateStr });
}