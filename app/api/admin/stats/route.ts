import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAuthorized } from "../_verify";

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ count: totalStories }, { count: totalChapters }, { count: unusedCodes }] = await Promise.all([
    supabaseAdmin.from("stories").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("chapters").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("vip_codes").select("*", { count: "exact", head: true }).eq("is_used", false),
  ]);

  return NextResponse.json({ totalStories, totalChapters, unusedCodes });
}