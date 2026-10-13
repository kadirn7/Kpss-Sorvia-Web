import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';
import type { StatsStore, QuestionStat } from './quiz-engine';

/**
 * Firestore backed StatsStore implementation
 * quiz-engine için gerekli metodları sağlar
 */
export class FirestoreStatsStore implements StatsStore {
  /**
   * Belirli soruların istatistiklerini getir
   */
  async load(userId: string, questionIds: string[]): Promise<Map<string, QuestionStat>> {
    const result = new Map<string, QuestionStat>();

    // Firestore IN sorgusu maksimum 10 element destekler, chunk by chunk çek
    const chunks: string[][] = [];
    for (let i = 0; i < questionIds.length; i += 10) {
      chunks.push(questionIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snapshot = await getDocs(
        query(
          collection(firestore, collections.userQuestionProgress),
          where('userId', '==', userId),
          where('__name__', 'in', chunk)
        )
      );

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const questionId = data.questionId;

        result.set(questionId, {
          questionId,
          seenCount: typeof data.attemptCount === 'number' ? data.attemptCount : 0,
          lastSeenAt: data.lastAttemptAt ? new Date(data.lastAttemptAt).getTime() : 0,
          correctCount: typeof data.correctCount === 'number' ? data.correctCount : 0,
          wrongCount: typeof data.wrongCount === 'number' ? data.wrongCount : 0,
          inMistakePool: data.inMistakePool === true,
          streak: typeof data.streak === 'number' ? data.streak : 0,
          nextDueAt: typeof data.nextDueAt === 'number' ? data.nextDueAt : 0,
          masteredAt: data.masteredAt ? new Date(data.masteredAt).getTime() : null,
        });
      });
    }

    return result;
  }

  /**
   * Kullanıcının yanlış havuzundaki tüm soruları getir
   */
  async listMistakes(userId: string): Promise<QuestionStat[]> {
    const snapshot = await getDocs(
      query(
        collection(firestore, collections.userQuestionProgress),
        where('userId', '==', userId),
        where('inMistakePool', '==', true)
      )
    );

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        questionId: data.questionId,
        seenCount: typeof data.attemptCount === 'number' ? data.attemptCount : 0,
        lastSeenAt: data.lastAttemptAt ? new Date(data.lastAttemptAt).getTime() : 0,
        correctCount: typeof data.correctCount === 'number' ? data.correctCount : 0,
        wrongCount: typeof data.wrongCount === 'number' ? data.wrongCount : 0,
        inMistakePool: true,
        streak: typeof data.streak === 'number' ? data.streak : 0,
        nextDueAt: typeof data.nextDueAt === 'number' ? data.nextDueAt : 0,
        masteredAt: data.masteredAt ? new Date(data.masteredAt).getTime() : null,
      };
    });
  }

  /**
   * İstatistikleri kaydet (batch)
   */
  async saveMany(userId: string, stats: QuestionStat[]): Promise<void> {
    const batch = [];

    for (const stat of stats) {
      const id = `${userId}_${stat.questionId}`;
      const ref = doc(firestore, collections.userQuestionProgress, id);

      const data = {
        userId,
        questionId: stat.questionId,
        lessonId: '', // Bu bilgi progress kaydında yok, başka yerden gelmeli
        topicId: null,
        attemptCount: stat.seenCount,
        correctCount: stat.correctCount,
        wrongCount: stat.wrongCount,
        lastAttemptAt: new Date(stat.lastSeenAt).toISOString(),
        inMistakePool: stat.inMistakePool,
        streak: stat.streak,
        nextDueAt: stat.nextDueAt,
        masteredAt: stat.masteredAt ? new Date(stat.masteredAt).toISOString() : null,
      };

      batch.push(
        setDoc(ref, data, { merge: true }).catch((err) => {
          console.error(`Error saving progress for ${stat.questionId}:`, err);
        })
      );
    }

    await Promise.all(batch);
  }
}
