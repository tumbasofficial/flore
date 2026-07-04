import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const { code, deviceId } = await req.json();

  if (!code) {
    return NextResponse.json({ error: "Kode kosong." }, { status: 400 });
  }

  const { data: found, error } = await supabaseAdmin
    .from("vip_codes")
    .select("id, is_used")
    .eq("code", code)
    .single();

  if (error || !found) {
    return NextResponse.json({ error: "Kode tidak ditemukan." }, { status: 404 });
  }

  if (found.is_used) {
    return NextResponse.json({ error: "Kode sudah pernah dipakai." }, { status: 409 });
  }

  await supabaseAdmin
    .from("vip_codes")
    .update({ is_used: true, used_at: new Date().toISOString(), used_by_device: deviceId })
    .eq("id", found.id);

  return NextResponse.json({ success: true });
}