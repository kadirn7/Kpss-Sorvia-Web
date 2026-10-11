import { collection, deleteDoc, doc, getDoc, getDocs, increment, query, runTransaction, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { DAILY_QUESTION_TARGET, WEAK_TOPIC_MIN_ATTEMPTS, WEEKLY_QUESTION_TARGET } from '../constants';
import { collections, firestore, firebaseAuth } from '../firebase';
import { fetchLessons } from './lessonService';
import { fetchTopicsByLesson } from './topicService';
import type {
  DailyStats,
  LessonStats,
  StreakData,
  TopicStats,
  WeakTopic,
  WeeklyStats,
} from '../types';

/**
 * Statistics Service
 *
 * Kullanıcı istatistiklerini takip eder:
 * - Topic bazlı başarı oranı
 * - Lesson bazlı başarı oranı
 * - Günlük istatistikler
 * - Haftalık istatistikler
 * - Streak takibi
 */

class StatisticsService {
  /**
   * Auth kontrolü - Firebase auth hazır mı?
   */
  private isAuthReady(): boolean {
    return firebaseAuth.currentUser != null;
  }

  /**
   * Topic bazlı istatistikleri getir
   */
  async getTopicStats(userId: string, lessonId: string): Promise<{ stats: TopicStats[]; unknownCount: number }> {
    try {
      // Tüm progress verilerini getir
      const snapshot = await getDocs(
        query(
          collection(firestore, collections.userQuestionProgress),
          where('userId', '==', userId),
          where('lessonId', '==', lessonId)
        )
      );

      // Topicleri getir
      const topics = await fetchTopicsByLesson(lessonId);
      const topicMap = new Map(topics.map(t => [t.id, t.name]));

      // Topic bazlı grupla
      const topicData = new Map<string, { attempts: number; correct: number; wrong: number; lastAttempt: any }>();
      let unknownTopicCount = 0;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const topicId = data.topicId || 'unknown';

        if (topicId === 'unknown') {
          unknownTopicCount++;
        }

        if (!topicData.has(topicId)) {
          topicData.set(topicId, { attempts: 0, correct: 0, wrong: 0, lastAttempt: null });
        }

        const stats = topicData.get(topicId)!;
        stats.attempts += (data.attemptCount || 0);
        stats.correct += (data.correctCount || 0);
        stats.wrong += (data.wrongCount || 0);

        if (data.lastAttemptAt && (!stats.lastAttempt || data.lastAttemptAt > stats.lastAttempt)) {
          stats.lastAttempt = data.lastAttemptAt;
        }
      });

      const unknownCount = unknownTopicCount;

      if (unknownTopicCount > 0) {
        console.warn(`⚠️ ${unknownTopicCount} sorunun topicId'si eksik`);
      }

      // Sonuçları formatla (bilinmeyen konuları hariç tut)
      const results: TopicStats[] = [];
      topicData.forEach((stats, topicId) => {
        // Konu adı bilinmiyorsa atla
        if (!topicMap.has(topicId)) {
          return;
        }

        const successRate = stats.attempts > 0 ? (stats.correct / stats.attempts) * 100 : 0;
        const wrongRate = stats.attempts > 0 ? (stats.wrong / stats.attempts) * 100 : 0;
        results.push({
          topicId,
          topicName: topicMap.get(topicId)!,
          lessonId,
          totalAttempts: stats.attempts,
          correctCount: stats.correct,
          wrongCount: stats.wrong,
          successRate: Math.round(successRate),
          wrongRate: Math.round(wrongRate),
          lastAttemptAt: stats.lastAttempt ? this.formatTimestamp(stats.lastAttempt) : null
        });
      });

      return {
        stats: results.sort((a, b) => a.topicName.localeCompare(b.topicName)),
        unknownCount
      };
    } catch (error) {
      console.error('❌ Topic stats hatası:', error);
      return { stats: [], unknownCount: 0 };
    }
  }

  /**
   * Lesson bazlı istatistikleri getir
   */
  async getLessonStats(userId: string, lessonId: string): Promise<LessonStats> {
    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, collections.userQuestionProgress),
          where('userId', '==', userId),
          where('lessonId', '==', lessonId)
        )
      );

      let totalAttempts = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let lastAttempt: any = null;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        totalAttempts += (data.attemptCount || 0);
        correctCount += (data.correctCount || 0);
        wrongCount += (data.wrongCount || 0);

        if (data.lastAttemptAt && (!lastAttempt || data.lastAttemptAt > lastAttempt)) {
          lastAttempt = data.lastAttemptAt;
        }
      });

      // Toplam kontrolü: doğru + yanlış = toplam deneme (sadece veri varsa)
      const calculatedTotal = correctCount + wrongCount;
      if (totalAttempts > 0 && calculatedTotal !== totalAttempts) {
        console.warn(`⚠️ LessonStats tutarsızlık: doğru+yanlış=${calculatedTotal}, toplam=${totalAttempts}`);
      }

      const successRate = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
      const wrongRate = totalAttempts > 0 ? (wrongCount / totalAttempts) * 100 : 0;

      // Oran kontrolü: başarı + yanlış ≈ 100% (sadece veri varsa)
      const rateSum = successRate + wrongRate;
      if (totalAttempts > 0 && Math.abs(rateSum - 100) > 1) {
        console.warn(`⚠️ LessonStats oran tutarsızlığı: başarı=${successRate}%, yanlış=${wrongRate}%, toplam=${rateSum}%`);
      }

      const lessons = await fetchLessons();
      const lessonName = lessons.find((item) => item.id === lessonId)?.name ?? 'Tarih';

      return {
        lessonId,
        lessonName,
        totalAttempts,
        correctCount,
        wrongCount,
        successRate: Math.round(successRate),
        wrongRate: Math.round(wrongRate),
        lastAttemptAt: lastAttempt ? this.formatTimestamp(lastAttempt) : null,
        loadError: false
      };
    } catch (error) {
      console.error('❌ Lesson stats hatası:', error);
      const lessons = await fetchLessons();
      const lessonName = lessons.find((item) => item.id === lessonId)?.name ?? lessonId;
      return {
        lessonId,
        lessonName,
        totalAttempts: 0,
        correctCount: 0,
        wrongCount: 0,
        successRate: 0,
        wrongRate: 0,
        lastAttemptAt: null as string | null,
        loadError: true // Hata durumunu işaretle
      };
    }
  }

  /**
   * Günlük istatistikleri getir/güncelle
   */
  async getDailyStats(userId: string, date: string): Promise<DailyStats> {
    try {
      const docId = `${userId}_${date}`;
      const ref = doc(firestore, collections.userDailyStats, docId);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          userId,
          date,
          totalQuestions: data.totalQuestions || 0,
          correctCount: data.correctCount || 0,
          wrongCount: data.wrongCount || 0,
          successRate: data.successRate || 0,
          timeSpentMinutes: data.timeSpentMinutes || 0,
          target: data.target || DAILY_QUESTION_TARGET,
          targetReached: data.targetReached || false,
          loadError: false
        };
      }

      // Yeni gün için varsayılan değerler
      return {
        userId,
        date,
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        successRate: 0,
        timeSpentMinutes: 0,
        target: DAILY_QUESTION_TARGET,
        targetReached: false,
        loadError: false
      } as DailyStats;
    } catch (error) {
      console.error('❌ Daily stats hatası:', error);
      return {
        userId,
        date,
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        successRate: 0,
        timeSpentMinutes: 0,
        target: DAILY_QUESTION_TARGET,
        targetReached: false,
        loadError: true // Hata durumunu işaretle
      } as DailyStats;
    }
  }

  /**
   * Günlük istatistikleri güncelle
   */
  async updateDailyStats(
    userId: string,
    correct: boolean,
    timeSpentMinutes: number = 0,
    target?: number
  ): Promise<void> {
    // Auth kontrolü
    if (!this.isAuthReady()) {
      console.warn('⚠️  Firebase auth hazır değil, daily stats güncellenemiyor');
      return;
    }

    try {
      const today = this.getTodayDateString();
      const docId = `${userId}_${today}`;
      const ref = doc(firestore, collections.userDailyStats, docId);
      const snapshot = await getDoc(ref);
      const data = snapshot.exists() ? snapshot.data() : {};

      const effectiveTarget = target ?? data.target ?? DAILY_QUESTION_TARGET;

      // Atomic increment kullanarak race condition önle
      await setDoc(ref, {
        userId,
        date: today,
        totalQuestions: increment(1),
        correctCount: increment(correct ? 1 : 0),
        wrongCount: increment(correct ? 0 : 1),
        timeSpentMinutes: increment(timeSpentMinutes),
        target: effectiveTarget,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Başarı oranını güncelle (ikinci bir işlem gerekiyor çünkü increment sonrası değer bilinmiyor)
      const updatedSnapshot = await getDoc(ref);
      const updatedData = updatedSnapshot.data();
      if (updatedData) {
        const totalQuestions = updatedData.totalQuestions || 0;
        const correctCount = updatedData.correctCount || 0;
        const successRate = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const targetReached = totalQuestions >= effectiveTarget;

        await setDoc(ref, {
          successRate: Math.round(successRate),
          targetReached
        }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Daily stats güncelleme hatası:', error);
    }
  }

  /**
   * Haftalık istatistikleri getir
   */
  async getWeeklyStats(userId: string): Promise<WeeklyStats> {
    try {
      const { weekStart, weekEnd } = this.getCurrentWeekRange();
      const docId = `${userId}_${weekStart}`;
      const ref = doc(firestore, collections.userWeeklyStats, docId);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          userId,
          weekStart,
          weekEnd,
          totalQuestions: data.totalQuestions || 0,
          correctCount: data.correctCount || 0,
          wrongCount: data.wrongCount || 0,
          successRate: data.successRate || 0,
          averageDailyQuestions: data.averageDailyQuestions || 0,
          target: data.target || WEEKLY_QUESTION_TARGET,
          targetReached: data.targetReached || false,
          loadError: false
        };
      }

      return {
        userId,
        weekStart,
        weekEnd,
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        successRate: 0,
        averageDailyQuestions: 0,
        target: WEEKLY_QUESTION_TARGET,
        targetReached: false,
        loadError: false
      } as WeeklyStats;
    } catch (error) {
      console.error('❌ Weekly stats hatası:', error);
      const { weekStart, weekEnd } = this.getCurrentWeekRange();
      return {
        userId,
        weekStart,
        weekEnd,
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        successRate: 0,
        averageDailyQuestions: 0,
        target: WEEKLY_QUESTION_TARGET,
        targetReached: false,
        loadError: true // Hata durumunu işaretle
      } as WeeklyStats;
    }
  }

  /**
   * Haftalık istatistikleri güncelle
   */
  async updateWeeklyStats(userId: string, correct: boolean): Promise<void> {
    // Auth kontrolü
    if (!this.isAuthReady()) {
      console.warn('⚠️  Firebase auth hazır değil, weekly stats güncellenemiyor');
      return;
    }

    try {
      const { weekStart, weekEnd } = this.getCurrentWeekRange();
      const docId = `${userId}_${weekStart}`;
      const ref = doc(firestore, collections.userWeeklyStats, docId);
      const snapshot = await getDoc(ref);
      const data = snapshot.exists() ? snapshot.data() : {};

      const target = data.target || WEEKLY_QUESTION_TARGET;

      // Atomic increment kullanarak race condition önle
      await setDoc(ref, {
        userId,
        weekStart,
        weekEnd,
        totalQuestions: increment(1),
        correctCount: increment(correct ? 1 : 0),
        wrongCount: increment(correct ? 0 : 1),
        target,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Başarı oranını ve diğer hesaplanan değerleri güncelle
      const updatedSnapshot = await getDoc(ref);
      const updatedData = updatedSnapshot.data();
      if (updatedData) {
        const totalQuestions = updatedData.totalQuestions || 0;
        const correctCount = updatedData.correctCount || 0;
        const successRate = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const targetReached = totalQuestions >= target;
        const averageDailyQuestions = Math.round(totalQuestions / 7);

        await setDoc(ref, {
          successRate: Math.round(successRate),
          averageDailyQuestions,
          targetReached
        }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Weekly stats güncelleme hatası:', error);
    }
  }

  /**
   * Streak verilerini getir
   */
  async getStreakData(userId: string): Promise<StreakData> {
    try {
      const ref = doc(firestore, collections.userStreak, userId);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastStudyDate: data.lastStudyDate || null,
          loadError: false
        };
      }

      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        loadError: false
      };
    } catch (error) {
      console.error('❌ Streak data hatası:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        loadError: true // Hata durumunu işaretle
      };
    }
  }

  /**
   * Streak'i güncelle
   */
  async updateStreak(userId: string): Promise<void> {
    // Auth kontrolü
    if (!this.isAuthReady()) {
      console.warn('⚠️  Firebase auth hazır değil, streak güncellenemiyor');
      return;
    }

    try {
      const ref = doc(firestore, collections.userStreak, userId);
      const today = this.getTodayDateString();
      const yesterday = this.getYesterdayDateString();

      // Transaction kullanarak race condition önle
      await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(ref);
        const data = snapshot.exists() ? snapshot.data() : {};

        const lastStudyDate = data.lastStudyDate || null;
        const currentStreak = data.currentStreak || 0;
        const longestStreak = data.longestStreak || 0;

        let newCurrentStreak = currentStreak;
        let newLongestStreak = longestStreak;

        if (lastStudyDate === today) {
          // Aynı gün, streak değişmez
          return;
        }

        if (lastStudyDate === yesterday) {
          // Dün çalışmış, streak artır
          newCurrentStreak = currentStreak + 1;
        } else if (lastStudyDate !== today) {
          // Dün çalışmamış, streak sıfırla
          newCurrentStreak = 1;
        }

        // En uzun streak'i güncelle
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }

        transaction.set(ref, {
          userId,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastStudyDate: today,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
    } catch (error) {
      console.error('❌ Streak güncelleme hatası:', error);
    }
  }

  /**
   * Zayıf konuları analiz et
   */
  async getWeakTopics(userId: string, lessonId: string, minAttempts: number = WEAK_TOPIC_MIN_ATTEMPTS): Promise<WeakTopic[]> {
    try {
      const topicResult = await this.getTopicStats(userId, lessonId);
      const topicStats = topicResult.stats;

      // Minimum deneme sayısına göre filtrele
      const filteredTopics = topicStats.filter(
        (topic: TopicStats) => topic.totalAttempts >= minAttempts
      );

      // Yanlış oranına göre sırala (yüksekten düşüğe)
      const sortedTopics = filteredTopics.sort(
        (a: TopicStats, b: TopicStats) => b.wrongRate - a.wrongRate
      );

      // Priority ve öneri belirle
      const weakTopics: WeakTopic[] = sortedTopics.map((topic: TopicStats) => {
        let priority: 'high' | 'medium' | 'low';
        let suggestion: string;

        if (topic.wrongRate >= 70) {
          priority = 'high';
          suggestion = 'Bu konuyu tekrar et ve ardından yeni sorular çöz.';
        } else if (topic.wrongRate >= 50) {
          priority = 'high';
          suggestion = 'Konu tekrarına ve yanlış yaptığın soru tiplerine odaklan.';
        } else if (topic.wrongRate >= 30) {
          priority = 'medium';
          suggestion = 'Bu konuda biraz daha pratik yapmalısın.';
        } else {
          priority = 'low';
          suggestion = 'Konuyu gözden geçirerek eksiklerini tamamla.';
        }

        return {
          topicId: topic.topicId,
          topicName: topic.topicName,
          lessonId: topic.lessonId,
          successRate: topic.successRate,
          wrongRate: topic.wrongRate,
          totalAttempts: topic.totalAttempts,
          correctCount: topic.correctCount,
          wrongCount: topic.wrongCount,
          priority,
          suggestion
        };
      });

      // Sadece düşük ve orta öncelikli olanları döndür
      return weakTopics.filter(topic => topic.priority !== 'low');
    } catch (error) {
      console.error('❌ Weak topics hatası:', error);
      return [];
    }
  }

  /**
   * Kullanıcı istatistiklerini özetle
   */
  async getUserSummary(userId: string, lessonId: string): Promise<{
    lessonStats: LessonStats;
    streak: StreakData;
    dailyStats: DailyStats;
    weeklyStats: WeeklyStats;
    weakTopics: WeakTopic[];
  }> {
    const [lessonStats, streak, dailyStats, weeklyStats, weakTopics] = await Promise.all([
      this.getLessonStats(userId, lessonId),
      this.getStreakData(userId),
      this.getDailyStats(userId, this.getTodayDateString()),
      this.getWeeklyStats(userId),
      this.getWeakTopics(userId, lessonId)
    ]);

    return {
      lessonStats,
      streak,
      dailyStats,
      weeklyStats,
      weakTopics
    };
  }

  // Yardımcı fonksiyonlar
  private toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTodayDateString(): string {
    return this.toLocalDateString(new Date());
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.toLocalDateString(yesterday);
  }

  private getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      weekStart: this.toLocalDateString(monday),
      weekEnd: this.toLocalDateString(sunday),
    };
  }

  private formatTimestamp(timestamp: any): string | null {
    if (!timestamp) return null;

    // Firebase timestamp objesi ise
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }

    // String ise
    if (typeof timestamp === 'string') {
      return timestamp;
    }

    // Sayı ise (Unix timestamp)
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toISOString();
    }

    return null;
  }

  /**
   * Kullanıcının tüm istatistiklerini temizle
   * - userQuestionProgress
   * - userDailyStats
   * - userWeeklyStats
   * - userStreak
   */
  async clearAllUserStats(userId: string): Promise<void> {
    if (!this.isAuthReady()) {
      throw new Error('Firebase auth hazır değil');
    }

    try {
      // 1. userQuestionProgress - tüm kayıtları sil
      const progressSnapshot = await getDocs(
        query(collection(firestore, collections.userQuestionProgress), where('userId', '==', userId))
      );

      const progressBatch = writeBatch(firestore);
      progressSnapshot.docs.forEach((docSnap) => {
        progressBatch.delete(docSnap.ref);
      });
      if (progressSnapshot.docs.length > 0) {
        await progressBatch.commit();
      }

      // 2. userDailyStats - tüm kayıtları sil
      const dailySnapshot = await getDocs(
        query(collection(firestore, collections.userDailyStats), where('userId', '==', userId))
      );

      const dailyBatch = writeBatch(firestore);
      dailySnapshot.docs.forEach((docSnap) => {
        dailyBatch.delete(docSnap.ref);
      });
      if (dailySnapshot.docs.length > 0) {
        await dailyBatch.commit();
      }

      // 3. userWeeklyStats - tüm kayıtları sil
      const weeklySnapshot = await getDocs(
        query(collection(firestore, collections.userWeeklyStats), where('userId', '==', userId))
      );

      const weeklyBatch = writeBatch(firestore);
      weeklySnapshot.docs.forEach((docSnap) => {
        weeklyBatch.delete(docSnap.ref);
      });
      if (weeklySnapshot.docs.length > 0) {
        await weeklyBatch.commit();
      }

      // 4. userStreak - sıfırla
      const streakRef = doc(firestore, collections.userStreak, userId);
      await deleteDoc(streakRef);
    } catch (error) {
      console.error('İstatistik temizleme hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
const statisticsService = new StatisticsService();

export default statisticsService;
