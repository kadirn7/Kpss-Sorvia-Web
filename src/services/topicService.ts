import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Topic } from '../types';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';

export async function fetchTopicsByLesson(lessonId: string): Promise<Topic[]> {
  const snapshot = await getDocs(
    query(collection(firestore, collections.topics), where('lessonId', '==', lessonId))
  );

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        lessonId: typeof data.lessonId === 'string' ? data.lessonId : lessonId,
        name: typeof data.name === 'string' ? data.name : '',
        parentId: typeof data.parentId === 'string' ? data.parentId : null,
        order: typeof data.order === 'number' ? data.order : 0,
      };
    })
    .filter((topic) => topic.name.length > 0)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'tr'));
}
