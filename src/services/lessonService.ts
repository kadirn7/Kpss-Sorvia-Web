import { collection, getDocs } from 'firebase/firestore';
import type { Lesson } from '../types';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';

export async function fetchLessons(): Promise<Lesson[]> {
  const snapshot = await getDocs(collection(firestore, collections.lessons));
  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: typeof data.name === 'string' ? data.name : '',
      };
    })
    .filter((lesson) => lesson.name.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}
