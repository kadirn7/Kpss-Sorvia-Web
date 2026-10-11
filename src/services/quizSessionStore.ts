const prefix = 'quiz:last-ids:';

export function getLastQuizIds(topicId: string): string[] {
  const raw = localStorage.getItem(`${prefix}${topicId}`);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveLastQuizIds(topicId: string, ids: string[]): void {
  localStorage.setItem(`${prefix}${topicId}`, JSON.stringify(ids));
}
