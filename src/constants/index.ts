export const APP_NAME = 'KPSS Sorvia';

export const ACTIVE_LESSON = 'Tarih';

export const QUIZ_COUNTS = [10, 20, 50] as const;
export type QuizCount = (typeof QUIZ_COUNTS)[number];

export const HARD_PLAYLIST_NAME = 'Zor Sorular';
export const RETRY_PLAYLIST_NAME = 'Tekrar Çöz';
export const WRONG_CLEARS_AFTER = 2;

export const DAILY_QUESTION_TARGET = 20;
export const WEEKLY_QUESTION_TARGET = 140;
export const WEAK_TOPIC_MIN_ATTEMPTS = 5;
