import type { Question } from '../types';

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) {
    return 0;
  }
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint32Array(1);
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/** Fisher–Yates; her çağrıda farklı sıra. */
export function shuffleInPlace<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapWith = randomInt(index + 1);
    const current = items[index];
    items[index] = items[swapWith];
    items[swapWith] = current;
  }
  return items;
}

export function shuffleCopy<T>(items: T[]): T[] {
  return shuffleInPlace([...items]);
}

/**
 * Üst konudan karışık çözerken alt konulardan mümkün olduğunca dengeli örnekler.
 * Önce her alt havuz kendi içinde karışır, sonra round-robin alınır, seçilen liste tekrar karışır.
 * lastIds: bir önceki oturumda çıkan sorular; mümkünse tekrar etmez.
 */
export function pickQuizQuestions(
  questions: Question[],
  count: number,
  lastIds: string[] = [],
  isRandom: boolean = false
): Question[] {
  if (questions.length === 0 || count <= 0) {
    return [];
  }

  const lastSet = new Set(lastIds);
  const take = Math.min(count, questions.length);

  // Random mode: tüm soruları karıştır ve seç
  if (isRandom) {
    const shuffled = shuffleCopy(questions);
    const fresh = shuffled.filter((item) => !lastSet.has(item.id));
    const recent = shuffled.filter((item) => lastSet.has(item.id));
    const combined = [...fresh, ...recent];
    return combined.slice(0, take);
  }

  const grouped = new Map<string, Question[]>();
  for (const question of questions) {
    const list = grouped.get(question.topicId) ?? [];
    list.push(question);
    grouped.set(question.topicId, list);
  }

  const pools = [...grouped.values()].map((group) => {
    const shuffled = shuffleCopy(group);
    const fresh = shuffled.filter((item) => !lastSet.has(item.id));
    const recent = shuffled.filter((item) => lastSet.has(item.id));
    return [...fresh, ...recent];
  });

  shuffleInPlace(pools);

  const picked: Question[] = [];
  const pickedIds = new Set<string>();

  while (picked.length < take) {
    let progressed = false;
    for (const pool of pools) {
      if (picked.length >= take) {
        break;
      }
      const next = pool.find((item) => !pickedIds.has(item.id));
      if (!next) {
        continue;
      }
      picked.push(next);
      pickedIds.add(next.id);
      progressed = true;
    }
    if (!progressed) {
      break;
    }
  }

  return shuffleCopy(picked);
}
