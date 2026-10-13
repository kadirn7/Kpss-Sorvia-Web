/**
 * quiz-engine.ts — Soru seçimi + şık karıştırma + "Yanlışlarım" havuzu
 * Bağımlılık yok (Node, React Native, tarayıcı, Deno, Bun).
 *
 *   startTest()           havuzdan N soru (ya da hepsi) seçer, şıkları karıştırır
 *   toPublic() / grade()  istemciye cevapsız gönder, kontrolü sunucuda yap
 *   submitAnswers()       sonuçları kaydeder, yanlışlar havuzunu günceller
 *   startMistakeReview()  "Yanlışlarım" ekranı için test üretir
 *
 * Konu filtresini kendi DB sorgunda yap; motor yalnızca aday havuzunu (pool) alır.
 */

// ───────────────────────── Tipler ─────────────────────────

export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';
export type Kind = 'mistake' | 'new' | 'seen'; // ekranda "🔁 Tekrar" rozeti için
export type Rng = () => number;

const KEYS: readonly OptionKey[] = ['A', 'B', 'C', 'D', 'E'];
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

/** Veritabanındaki ham soru — senin JSON formatın. */
export interface RawQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctOption: OptionKey;
  solution?: string;
  source?: string;
  /** true → şıklar asla karıştırılmaz. Boşsa "Hepsi", "I ve II" gibi şıklar otomatik tespit edilir. */
  fixedOrder?: boolean;
}

/**
 * Kullanıcı × soru başına TEK satır. "Yanlışlarım" ayrı tablo değil, bu satırdaki bir bayrak.
 * SQL: user_question_stats(user_id, question_id, seen_count, last_seen_at, correct_count, wrong_count,
 *                          in_mistake_pool, streak, next_due_at, mastered_at)  PK(user_id, question_id)
 */
export interface QuestionStat {
  questionId: string;
  seenCount: number;
  lastSeenAt: number; // epoch ms
  correctCount: number;
  wrongCount: number;
  inMistakePool: boolean;
  streak: number; // havuzdayken aralıklı doğru sayısı
  nextDueAt: number; // havuzdayken: bu andan sonra "tekrar zamanı geldi" sayılır
  masteredAt: number | null;
}

export interface EngineConfig {
  /** Bir testte, vakti gelmiş yanlışlara ayrılan en yüksek pay (0.25 = %25). */
  mistakeRatio: number;
  /**
   * Yanlışlar merdiveni (ms). UZUNLUK = havuzdan çıkmak için gereken doğru sayısı.
   * [10 dk, 1 gün, 3 gün] → yanlıştan 10 dk sonra doğru → 1 gün sonra doğru → 3 gün sonra doğru → ÇIKAR.
   */
  reviewLadder: number[];
  /** Vakti gelmeden verilen doğru seriye sayılsın mı? (Yanlış cevap her zaman seriyi sıfırlar.) */
  countEarlyCorrect: boolean;
  /** 0 = sıkı "en eski önce", 1 = neredeyse tam rastgele. */
  staleJitter: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  mistakeRatio: 0.25,
  reviewLadder: [10 * MIN, 1 * DAY, 3 * DAY],
  countEarlyCorrect: false,
  staleJitter: 0.3,
};

export interface TestQuestion {
  id: string;
  questionText: string;
  options: { key: OptionKey; text: string }[]; // key = EKRANDA görünen harf
  correctKey: OptionKey; // istemciye gönderme → toPublic()
  solution?: string; // cevabı açık eder → cevaptan sonra göster
  source?: string;
  kind: Kind;
}

export interface BuiltTest {
  questions: TestQuestion[];
  requested: number;
  delivered: number;
  shortfall: boolean; // true → havuz istenenden küçük; kullanıcıya "N soru bulundu" de, soru tekrarlama
  mix: Record<Kind, number>;
}

export interface StatsStore {
  /** Gerçek DB'de WHERE user_id = ? ile hepsini çekip bellekte süzmek, uzun IN (...) listelerinden güvenlidir. */
  load(userId: string, questionIds: string[]): Promise<Map<string, QuestionStat>>;
  listMistakes(userId: string): Promise<QuestionStat[]>; // inMistakePool === true olanlar
  saveMany(userId: string, stats: QuestionStat[]): Promise<void>;
}

// ───────────────────────── Yardımcılar ─────────────────────────

/** Fisher–Yates. Orijinal diziyi bozmaz. */
export function shuffle<T>(items: readonly T[], rnd: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Aynı tohum → aynı karıştırma. Sunucu oturum kaydı tutmadan şık düzenini yeniden üretebilir:
 *   buildQuestion(q, kind, seededRng(`${oturumId}:${q.id}`))
 * (xmur3 + mulberry32 — kriptografik değil, yalnızca tekrarlanabilirlik için.)
 */
export function seededRng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  let a = (h ^ (h >>> 16)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────── 1) Şık karıştırma ─────────────────────

const norm = (s: string) => s.replace(/[İIı]/g, 'i').toLowerCase().trim();

/** "Hepsi", "Yukarıdakilerin hiçbiri", "I ve II", "Yalnız III", "A ve B" gibi başka ifadelere bağlı şıkları yakalar. */
function looksDependent(text: string): boolean {
  const t = norm(text);
  if (/hepsi|hiçbiri|hicbiri|yukaridaki|ikisi de/.test(t)) return true;
  const words = t.split(/[\s,;.]+/).filter(Boolean);
  const isRef = (w: string) => /^[ivx]+$/.test(w) || /^[a-e]$/.test(w); // I, II, IV… ya da A, B…
  const glue = ['ve', 'ile', 'yalniz', 'yalnizca'];
  return words.length > 1 && words.some(isRef) && words.every((w) => isRef(w) || glue.includes(w));
}

/**
 * Şıkları karıştırır ve doğru cevabın YENİ harfini hesaplar.
 * Doğru cevap harfle değil, karıştırmadan önce işaretlenen şıkla takip edilir.
 */
export function buildQuestion(q: RawQuestion, kind: Kind, rnd: Rng = Math.random): TestQuestion {
  const raw: [OptionKey, string | undefined][] = [
    ['A', q.optionA], ['B', q.optionB], ['C', q.optionC], ['D', q.optionD], ['E', q.optionE],
  ];
  const originals: { orig: OptionKey; text: string }[] = [];
  for (const [orig, text] of raw) if (text) originals.push({ orig, text }); // boş şıkları (4 şıklı sorular) atla

  const locked = q.fixedOrder ?? originals.some((o) => looksDependent(o.text));
  const ordered = locked ? originals : shuffle(originals, rnd);

  const ci = ordered.findIndex((o) => o.orig === q.correctOption);
  if (ci < 0) throw new Error(`Soru ${q.id}: correctOption (${q.correctOption}) şıklar arasında yok`);

  return {
    id: q.id,
    questionText: q.questionText,
    options: ordered.map((o, i) => ({ key: KEYS[i], text: o.text })),
    correctKey: KEYS[ci],
    solution: q.solution,
    source: q.source,
    kind,
  };
}

// ───────────────────── 2) Soru seçimi ─────────────────────

interface Chosen {
  q: RawQuestion;
  kind: Kind;
}

/** En uzun süredir görülmeyen önce — ama sıkı sıra değil: her soruya "jitter" kadar rastgele puan eklenir. */
function oldestFirstWithJitter(
  list: RawQuestion[],
  stats: ReadonlyMap<string, QuestionStat>,
  jitter: number,
  rnd: Rng,
): RawQuestion[] {
  const n = list.length;
  if (n < 2) return list.slice();
  const byAge = shuffle(list, rnd) // aynı zamanlı kayıtlarda sıra rastgele olsun
    .sort((a, b) => stats.get(a.id)!.lastSeenAt - stats.get(b.id)!.lastSeenAt); // eski → yeni
  return byAge
    .map((q, i) => ({ q, score: (n - 1 - i) / (n - 1) + rnd() * jitter })) // en eski = en yüksek puan
    .sort((a, b) => b.score - a.score)
    .map((x) => x.q);
}

/**
 * Öncelik sırası:
 *  1) vakti gelmiş yanlışlar (en fazla mistakeRatio kadar, en çok gecikenler önce)
 *  2) hiç görülmemişler
 *  3) hâlâ yer varsa kalan vakti gelmiş yanlışlar
 *  4) en uzun süredir görülmeyenler (jitter'lı)
 * Aynı testte bir soru iki kez gelmez. Havuz küçükse eldeki kadarı döner.
 */
export function selectQuestions(
  pool: readonly RawQuestion[],
  stats: ReadonlyMap<string, QuestionStat>,
  count: number | 'all',
  now: number,
  cfg: EngineConfig = DEFAULT_CONFIG,
  rnd: Rng = Math.random,
): Chosen[] {
  const unseen: RawQuestion[] = [];
  const due: RawQuestion[] = []; // vakti gelmiş yanlışlar
  const seen: RawQuestion[] = []; // diğer görülmüşler (vakti gelmemiş yanlışlar dahil)
  for (const q of pool) {
    const s = stats.get(q.id);
    if (!s || s.seenCount === 0) unseen.push(q);
    else if (s.inMistakePool && s.nextDueAt <= now) due.push(q);
    else seen.push(q);
  }

  if (count === 'all') {
    const all: Chosen[] = [
      ...due.map((q): Chosen => ({ q, kind: 'mistake' })),
      ...unseen.map((q): Chosen => ({ q, kind: 'new' })),
      ...seen.map((q): Chosen => ({ q, kind: 'seen' })),
    ];
    return shuffle(all, rnd);
  }

  const total = Math.min(Math.max(0, Math.floor(count)), pool.length);
  const picked: Chosen[] = [];
  const take = (list: RawQuestion[], kind: Kind) => {
    for (const q of list) {
      if (picked.length >= total) break;
      picked.push({ q, kind });
    }
  };

  const dueSorted = shuffle(due, rnd).sort((a, b) => stats.get(a.id)!.nextDueAt - stats.get(b.id)!.nextDueAt);
  const quota = Math.min(dueSorted.length, Math.ceil(total * cfg.mistakeRatio));

  take(dueSorted.slice(0, quota), 'mistake');
  take(shuffle(unseen, rnd), 'new');
  take(dueSorted.slice(quota), 'mistake');
  take(oldestFirstWithJitter(seen, stats, cfg.staleJitter, rnd), 'seen');

  return shuffle(picked, rnd); // tekrar soruları başa yığılmasın
}

// ───────────────────── 3) Yanlışlarım havuzu ─────────────────────

/**
 * Bir cevabı işler ve soru istatistiğinin yeni halini döndürür (saf fonksiyon, DB'ye dokunmaz).
 *  - Yanlış             → havuza gir (zaten içindeyse seri sıfırlanır), 1. tekrar için bekleme başlar
 *  - Doğru + vakti geldi → seri +1, bekleme süresi merdivende bir basamak uzar
 *  - Seri == merdiven uzunluğu → havuzdan çık
 *  - Doğru + vakti gelmedi → seriye sayılmaz (ceza da yok)
 */
export function applyAnswer(
  prev: QuestionStat | undefined,
  questionId: string,
  correct: boolean,
  now: number,
  cfg: EngineConfig = DEFAULT_CONFIG,
): QuestionStat {
  const s: QuestionStat = prev
    ? { ...prev }
    : {
        questionId, seenCount: 0, lastSeenAt: 0, correctCount: 0, wrongCount: 0,
        inMistakePool: false, streak: 0, nextDueAt: 0, masteredAt: null,
      };

  s.seenCount++;
  s.lastSeenAt = now;

  if (!correct) {
    s.wrongCount++;
    s.inMistakePool = true;
    s.streak = 0;
    s.nextDueAt = now + cfg.reviewLadder[0];
    s.masteredAt = null;
    return s;
  }

  s.correctCount++;
  if (!s.inMistakePool) return s; // normal soru: yalnızca istatistik
  if (now < s.nextDueAt && !cfg.countEarlyCorrect) return s; // erken doğru: sayılmaz

  s.streak++;
  if (s.streak >= cfg.reviewLadder.length) {
    s.inMistakePool = false; // yeterince aralıklı doğru → havuzdan çık
    s.streak = 0;
    s.masteredAt = now;
  } else {
    s.nextDueAt = now + cfg.reviewLadder[s.streak];
  }
  return s;
}

// ───────────────────── 4) Üst seviye API ─────────────────────

function assemble(chosen: Chosen[], requested: number, rnd: Rng, optionRng?: (q: RawQuestion) => Rng): BuiltTest {
  const mix: Record<Kind, number> = { mistake: 0, new: 0, seen: 0 };
  const questions = chosen.map((c) => {
    mix[c.kind]++;
    return buildQuestion(c.q, c.kind, optionRng ? optionRng(c.q) : rnd);
  });
  return { questions, requested, delivered: questions.length, shortfall: questions.length < requested, mix };
}

export interface StartTestOptions {
  store: StatsStore;
  userId: string;
  pool: readonly RawQuestion[]; // konuya göre süzdüğün aday sorular
  count: number | 'all'; // 10, 20 ya da 'all'
  now?: number;
  cfg?: EngineConfig;
  rnd?: Rng;
  /** Stateless doğrulama için: q => seededRng(`${oturumId}:${q.id}`) */
  optionRng?: (q: RawQuestion) => Rng;
}

export async function startTest(o: StartTestOptions): Promise<BuiltTest> {
  const now = o.now ?? Date.now();
  const rnd = o.rnd ?? Math.random;
  const stats = await o.store.load(o.userId, o.pool.map((q) => q.id));
  const chosen = selectQuestions(o.pool, stats, o.count, now, o.cfg ?? DEFAULT_CONFIG, rnd);
  return assemble(chosen, o.count === 'all' ? o.pool.length : o.count, rnd, o.optionRng);
}

/** Cevapları kaydeder. Her cevapta tek tek çağırabilirsin (yarım bırakılan testte görülmeyen sorular "görüldü" sayılmaz). */
export async function submitAnswers(
  store: StatsStore,
  userId: string,
  results: { questionId: string; correct: boolean }[],
  now: number = Date.now(),
  cfg: EngineConfig = DEFAULT_CONFIG,
): Promise<QuestionStat[]> {
  const prev = await store.load(userId, results.map((r) => r.questionId));
  const next = results.map((r) => applyAnswer(prev.get(r.questionId), r.questionId, r.correct, now, cfg));
  await store.saveMany(userId, next);
  return next;
}

/** "Yanlışlarım" ekranı: dueOnly=true → yalnızca vakti gelenler (önerilen); false → hepsi (erken doğrular seriye sayılmaz). */
export async function startMistakeReview(o: {
  store: StatsStore;
  userId: string;
  loadQuestions: (ids: string[]) => Promise<RawQuestion[]>; // id listesiyle DB'den ham soruları getir
  count: number;
  dueOnly?: boolean;
  now?: number;
  rnd?: Rng;
}): Promise<BuiltTest> {
  const now = o.now ?? Date.now();
  const rnd = o.rnd ?? Math.random;
  const stats = (await o.store.listMistakes(o.userId))
    .filter((s) => !(o.dueOnly ?? true) || s.nextDueAt <= now)
    .sort((a, b) => a.nextDueAt - b.nextDueAt) // en çok gecikenler önce
    .slice(0, Math.max(0, Math.floor(o.count)));
  const byId = new Map<string, RawQuestion>();
  for (const q of await o.loadQuestions(stats.map((s) => s.questionId))) byId.set(q.id, q);
  const chosen: Chosen[] = [];
  for (const s of stats) {
    const q = byId.get(s.questionId);
    if (q) chosen.push({ q, kind: 'mistake' });
  }
  return assemble(shuffle(chosen, rnd), o.count, rnd);
}

/** İstemciye giden hal: doğru cevap ve çözüm YOK. */
export type PublicQuestion = Omit<TestQuestion, 'correctKey' | 'solution'>;
export const toPublic = ({ correctKey, solution, ...rest }: TestQuestion): PublicQuestion => rest;

/** Cevap kontrolü (sunucuda): doğru mu + doğru harf + çözüm. */
export const grade = (q: TestQuestion, chosen: OptionKey) => ({
  correct: q.correctKey === chosen,
  correctKey: q.correctKey,
  solution: q.solution,
});

// ───────────────────── 5) Bellek içi store (demo/test) ─────────────────────
// Gerçekte: SQLite / Firestore / Supabase / AsyncStorage ile aynı 3 metodu yaz.

export class MemoryStatsStore implements StatsStore {
  private rows = new Map<string, QuestionStat>();
  private key = (userId: string, questionId: string) => `${userId}\u0000${questionId}`;

  async load(userId: string, ids: string[]) {
    const out = new Map<string, QuestionStat>();
    for (const id of ids) {
      const r = this.rows.get(this.key(userId, id));
      if (r) out.set(id, r);
    }
    return out;
  }

  async listMistakes(userId: string) {
    const out: QuestionStat[] = [];
    this.rows.forEach((r, k) => {
      if (k.startsWith(userId + '\u0000') && r.inMistakePool) out.push(r);
    });
    return out;
  }

  async saveMany(userId: string, stats: QuestionStat[]) {
    for (const s of stats) this.rows.set(this.key(userId, s.questionId), { ...s });
  }
}
