const QUOTA_KEY = "flore_quota";
const DEVICE_KEY = "flore_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function dailyLimitForFase(fase: number): number {
  if (fase === 1) return 3;
  if (fase === 2) return 2;
  return 1; // fase 3 & 4
}

type QuotaState = { date: string; used: number; vipBonus: number };

function getRawQuota(): QuotaState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(QUOTA_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveQuota(state: QuotaState) {
  localStorage.setItem(QUOTA_KEY, JSON.stringify(state));
}

export async function getTodayQuota(): Promise<QuotaState> {
  const res = await fetch("/api/server-time");
  const { date } = await res.json();

  const existing = getRawQuota();
  if (existing && existing.date === date) return existing;

  const fresh: QuotaState = { date, used: 0, vipBonus: 0 };
  saveQuota(fresh);
  return fresh;
}

export async function canReadNextChapter(fase: number): Promise<boolean> {
  const state = await getTodayQuota();
  const limit = dailyLimitForFase(fase) + state.vipBonus;
  return state.used < limit;
}

export async function consumeQuota() {
  const state = await getTodayQuota();
  state.used += 1;
  saveQuota(state);
}

export async function addVipBonus(amount: number) {
  const state = await getTodayQuota();
  state.vipBonus += amount;
  saveQuota(state);
}

// Progres baca per cerita (chapter tertinggi yang sudah terbuka)
export function getUnlockedUpTo(storyId: number): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(`flore_progress_${storyId}`);
  return raw ? JSON.parse(raw).unlockedUpTo : 1;
}

export function setUnlockedUpTo(storyId: number, chapterNumber: number) {
  localStorage.setItem(
    `flore_progress_${storyId}`,
    JSON.stringify({ unlockedUpTo: chapterNumber })
  );
}

// Skor tebakan insting
export function getScore(storyId: number): { correct: number; total: number } {
  if (typeof window === "undefined") return { correct: 0, total: 0 };
  const raw = localStorage.getItem(`flore_score_${storyId}`);
  return raw ? JSON.parse(raw) : { correct: 0, total: 0 };
}

function saveScore(storyId: number, score: { correct: number; total: number }) {
  localStorage.setItem(`flore_score_${storyId}`, JSON.stringify(score));
}

// Daftar nomor bab yang tebakannya sudah pernah dijawab (anti dobel-hitung)
function getAnsweredChapters(storyId: number): number[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(`flore_answered_${storyId}`);
  return raw ? JSON.parse(raw) : [];
}

function saveAnsweredChapters(storyId: number, chapters: number[]) {
  localStorage.setItem(`flore_answered_${storyId}`, JSON.stringify(chapters));
}

export function isChapterAnswered(storyId: number, chapterNumber: number): boolean {
  return getAnsweredChapters(storyId).includes(chapterNumber);
}

// Catat jawaban untuk sebuah bab. Kalau bab ini sudah pernah dijawab
// sebelumnya, tidak akan menghitung ulang skor (mencegah dobel-hitung
// saat user maju-mundur antar bab).
export function recordAnswer(
  storyId: number,
  chapterNumber: number,
  isCorrect: boolean
): void {
  if (isChapterAnswered(storyId, chapterNumber)) return;

  const current = getScore(storyId);
  saveScore(storyId, {
    correct: current.correct + (isCorrect ? 1 : 0),
    total: current.total + 1,
  });

  const answered = getAnsweredChapters(storyId);
  answered.push(chapterNumber);
  saveAnsweredChapters(storyId, answered);
}