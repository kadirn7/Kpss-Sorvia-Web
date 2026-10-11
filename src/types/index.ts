/**
 * Domain tipleri — Firestore ile kullanılan tipler
 * Şifre burada tutulmaz; Firebase Authentication yönetir
 */

export type CorrectOption = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Lesson {
  id: string;
  name: string;
  icon?: string;
  progress?: number;
  questionCount?: number;
}

export interface Topic {
  id: string;
  lessonId: string;
  name: string;
  parentId: string | null;
  order?: number;
  progress?: number;
  questionCount?: number;
}

export interface Question {
  id: string;
  lessonId: string;
  topicId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  /** Doğru şık harfi (A, B, C, D, E) - Backend'de şıklar karıştırıldıktan sonra güncellenir */
  correctOption: CorrectOption;
  solution: string | null;
  source: string | null; // ÖSYM 2014 lisans sorusu benzeri gibi etiketler
  /** Soru durumu: published = yayınlanmış, draft = taslak, archived = arşivlenmiş */
  status: 'draft' | 'published' | 'archived';
  /** İçerik sürümü - soru güncellendiğinde artar */
  version: number;
  createdAt: string;
  updatedAt: string;
  order?: number;
}

export type PlaylistKind = 'user' | 'hard' | 'retry';

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  kind: PlaylistKind;
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  displayName?: string;
  photoURL?: string;
}

export interface UserSettings {
  userId: string;
  dailyTarget: number;
  weeklyTarget: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  updatedAt: string;
}

export interface UserQuestionProgress {
  userId: string;
  questionId: string;
  lessonId: string;
  topicId: string | null; // Mobil uygulama null gönderebilir
  attemptCount: number; // Toplam çözüm sayısı (tekrar dahil)
  correctCount: number;
  wrongCount: number;
  lastAttemptAt: string | null;
  inWrongQueue: boolean;
  consecutiveCorrectInQueue: number;
}

export interface MockExam {
  id: string;
  title: string;
  lessonId: string;
  lessonName: string;
  durationMinutes: number | null;
  questionCount: number;
  order?: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockExamQuestion {
  id: string;
  order: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: CorrectOption;
  solution: string | null;
  source: string | null;
}

export interface MockExamResult {
  id: string;
  userId: string;
  examId: string;
  examTitle: string;
  lessonId: string;
  lessonName: string;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  totalQuestions: number;
  percentage: number;
  durationMinutes: number | null;
  startedAt: string;
  completedAt: string | null;
  answers: MockExamAnswer[];
}

export interface MockExamAnswer {
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  userAnswer: CorrectOption | null;
  correctAnswer: CorrectOption;
  isCorrect: boolean;
  isEmpty: boolean;
  solution: string | null;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  percentage: number;
}

export interface TopicStats {
  topicId: string;
  topicName: string;
  lessonId: string;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  successRate: number;
  wrongRate: number;
  lastAttemptAt: string | null;
}

export interface LessonStats {
  lessonId: string;
  lessonName: string;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  successRate: number;
  wrongRate: number;
  lastAttemptAt: string | null;
  loadError?: boolean; // İstatistik yüklenemedi mi?
}

export interface DailyStats {
  userId: string;
  date: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  successRate: number;
  timeSpentMinutes: number;
  target: number;
  targetReached: boolean;
  loadError?: boolean; // İstatistik yüklenemedi mi?
}

export interface WeeklyStats {
  userId: string;
  weekStart: string;
  weekEnd: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  successRate: number;
  averageDailyQuestions: number;
  target: number;
  targetReached: boolean;
  loadError?: boolean; // İstatistik yüklenemedi mi?
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  loadError?: boolean; // İstatistik yüklenemedi mi?
}

export interface WeakTopic {
  topicId: string;
  topicName: string;
  lessonId: string;
  successRate: number;
  wrongRate: number;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}
