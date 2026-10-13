import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';
import { applyAnswer, type EngineConfig } from '../utils/quiz-engine';

/**
 * İstatistik Metriği Tanımı:
 * - attemptCount: Toplam ÇÖZÜM SAYISI (tekrar edilen sorular dahil)
 *   - Aynı soruyu 3 kez çözen kullanıcı → attemptCount = 3
 *   - Her doğru/yanlış sayısı ayrı ayrı tutuluyor (correctCount, wrongCount)
 * - Günlük/haftalık istatistikler: Her cevap 1 sayılır (çözüm sayısı)
 * - Konu/ders istatistikleri: Σ attemptCount (toplam çözüm sayısı)
 *
 * Bu sayede kullanıcı ne kadar pratik yaptığını takip edebilir.
 */

function progressId(userId: string, questionId: string): string {
  return `${userId}_${questionId}`;
}

const REVIEW_LADDER = [10 * 60 * 1000, 24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000]; // 10 dk, 1 gün, 3 gün

const ENGINE_CONFIG: EngineConfig = {
  mistakeRatio: 0.25,
  reviewLadder: REVIEW_LADDER,
  countEarlyCorrect: false,
  staleJitter: 0.3,
};

export async function recordQuestionAttempt(input: {
  userId: string;
  questionId: string;
  lessonId: string;
  topicId: string;
  correct: boolean;
}): Promise<void> {
  const id = progressId(input.userId, input.questionId);
  const ref = doc(firestore, collections.userQuestionProgress, id);
  const now = Date.now();

  // Transaction kullanarak race condition önle
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.exists() ? snapshot.data() : {};

    // Mevcut değerleri oku
    const attemptCount = (typeof data.attemptCount === 'number' ? data.attemptCount : 0);
    const correctCount = typeof data.correctCount === 'number' ? data.correctCount : 0;
    const wrongCount = typeof data.wrongCount === 'number' ? data.wrongCount : 0;
    const inMistakePool = data.inMistakePool === true;
    const streak = typeof data.streak === 'number' ? data.streak : 0;
    const nextDueAt = typeof data.nextDueAt === 'number' ? data.nextDueAt : 0;
    const masteredAt = data.masteredAt || null;

    // Quiz-engine mantığı ile hesapla
    const prevStat = {
      questionId: input.questionId,
      seenCount: attemptCount,
      lastSeenAt: data.lastAttemptAt ? new Date(data.lastAttemptAt).getTime() : 0,
      correctCount,
      wrongCount,
      inMistakePool,
      streak,
      nextDueAt,
      masteredAt,
    };

    const newStat = applyAnswer(prevStat, input.questionId, input.correct, now, ENGINE_CONFIG);

    // Firestore'a kaydet
    transaction.set(ref, {
      userId: input.userId,
      questionId: input.questionId,
      lessonId: input.lessonId,
      topicId: input.topicId,
      attemptCount: newStat.seenCount,
      correctCount: newStat.correctCount,
      wrongCount: newStat.wrongCount,
      lastAttemptAt: serverTimestamp(),
      inMistakePool: newStat.inMistakePool,
      streak: newStat.streak,
      nextDueAt: newStat.nextDueAt,
      masteredAt: newStat.masteredAt ? new Date(newStat.masteredAt).toISOString() : null,
    }, { merge: true });
  });
}

export async function fetchWrongQuestionIds(userId: string, lessonId: string): Promise<string[]> {
  const snapshot = await getDocs(
    query(collection(firestore, collections.userQuestionProgress), where('userId', '==', userId))
  );

  return snapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data();
      return data.inMistakePool === true && data.lessonId === lessonId;
    })
    .map((docSnap) => {
      const data = docSnap.data();
      return typeof data.questionId === 'string' ? data.questionId : '';
    })
    .filter((id) => id.length > 0);
}

export async function fetchMistakePoolQuestionIds(userId: string): Promise<string[]> {
  const snapshot = await getDocs(
    query(collection(firestore, collections.userQuestionProgress), where('userId', '==', userId))
  );

  const now = Date.now();
  return snapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data();
      // Sadece vakti gelmiş yanlışlar
      return data.inMistakePool === true && 
             typeof data.nextDueAt === 'number' && 
             data.nextDueAt <= now;
    })
    .map((docSnap) => {
      const data = docSnap.data();
      return typeof data.questionId === 'string' ? data.questionId : '';
    })
    .filter((id) => id.length > 0);
}
