import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';

const WRONG_CLEARS_AFTER = 3; // 3 kere üst üste doğru yapınca wrong queue'dan çıkar

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

export async function recordQuestionAttempt(input: {
  userId: string;
  questionId: string;
  lessonId: string;
  topicId: string;
  correct: boolean;
}): Promise<void> {
  const id = progressId(input.userId, input.questionId);
  const ref = doc(firestore, collections.userQuestionProgress, id);

  // Transaction kullanarak race condition önle
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.exists() ? snapshot.data() : {};

    const attemptCount = (typeof data.attemptCount === 'number' ? data.attemptCount : 0) + 1;
    const correctCount =
      (typeof data.correctCount === 'number' ? data.correctCount : 0) + (input.correct ? 1 : 0);
    const wrongCount =
      (typeof data.wrongCount === 'number' ? data.wrongCount : 0) + (input.correct ? 0 : 1);

    let inWrongQueue = data.inWrongQueue === true;
    let consecutiveCorrectInQueue =
      typeof data.consecutiveCorrectInQueue === 'number' ? data.consecutiveCorrectInQueue : 0;

    if (!input.correct) {
      inWrongQueue = true;
      consecutiveCorrectInQueue = 0;
    } else if (inWrongQueue) {
      consecutiveCorrectInQueue += 1;
      if (consecutiveCorrectInQueue >= WRONG_CLEARS_AFTER) {
        inWrongQueue = false;
        consecutiveCorrectInQueue = 0;
      }
    }

    transaction.set(ref, {
      userId: input.userId,
      questionId: input.questionId,
      lessonId: input.lessonId,
      topicId: input.topicId,
      attemptCount,
      correctCount,
      wrongCount,
      lastAttemptAt: serverTimestamp(),
      inWrongQueue,
      consecutiveCorrectInQueue,
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
      return data.inWrongQueue === true && data.lessonId === lessonId;
    })
    .map((docSnap) => {
      const data = docSnap.data();
      return typeof data.questionId === 'string' ? data.questionId : '';
    })
    .filter((id) => id.length > 0);
}
