import { collection, getDocs, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { CorrectOption, Question } from '../types';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';
import { timestampToIso } from '../utils/timestamps';
import { fetchPlaylistQuestionIds } from './playlistService';

const OPTIONS: CorrectOption[] = ['A', 'B', 'C', 'D', 'E'];

function asCorrectOption(value: unknown): CorrectOption {
  return OPTIONS.includes(value as CorrectOption) ? (value as CorrectOption) : 'A';
}

function mapQuestion(docSnap: QueryDocumentSnapshot<DocumentData>): Question {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    lessonId: typeof data.lessonId === 'string' ? data.lessonId : '',
    topicId: typeof data.topicId === 'string' ? data.topicId : '',
    questionText: typeof data.questionText === 'string' ? data.questionText : '',
    optionA: typeof data.optionA === 'string' ? data.optionA : '',
    optionB: typeof data.optionB === 'string' ? data.optionB : '',
    optionC: typeof data.optionC === 'string' ? data.optionC : '',
    optionD: typeof data.optionD === 'string' ? data.optionD : '',
    optionE: typeof data.optionE === 'string' ? data.optionE : '',
    correctOption: asCorrectOption(data.correctOption),
    solution: typeof data.solution === 'string' ? data.solution : null,
    source: typeof data.source === 'string' ? data.source : null,
    status: (data.status === 'published' || data.status === 'draft' || data.status === 'archived') ? data.status : 'published',
    version: typeof data.version === 'number' ? data.version : 1,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    order: typeof data.order === 'number' ? data.order : 0,
  };
}

export async function fetchQuestionsByTopic(topicId: string): Promise<Question[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore, collections.questions),
      where('topicId', '==', topicId),
      where('status', '==', 'published')
    )
  );

  return snapshot.docs
    .map((docSnap) => mapQuestion(docSnap))
    .filter((question) => question.questionText.length > 0)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchQuestionsByLesson(lessonId: string): Promise<Question[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore, collections.questions),
      where('lessonId', '==', lessonId),
      where('status', '==', 'published')
    )
  );

  return snapshot.docs
    .map((docSnap) => mapQuestion(docSnap))
    .filter((question) => question.questionText.length > 0)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function optionText(question: Question, option: CorrectOption): string {
  switch (option) {
    case 'A':
      return question.optionA;
    case 'B':
      return question.optionB;
    case 'C':
      return question.optionC;
    case 'D':
      return question.optionD;
    case 'E':
      return question.optionE;
  }
}

export async function fetchQuestionsByPlaylist(playlistId: string): Promise<Question[]> {
  const questionIds = await fetchPlaylistQuestionIds(playlistId);

  if (questionIds.length === 0) {
    return [];
  }

  // Firestore'da ID ile sorgu - maksimum 10 ID bir anda
  const chunks: string[][] = [];
  for (let i = 0; i < questionIds.length; i += 10) {
    chunks.push(questionIds.slice(i, i + 10));
  }

  const allQuestions: Question[] = [];

  for (const chunk of chunks) {
    const snapshot = await getDocs(
      query(collection(firestore, collections.questions), where('__name__', 'in', chunk))
    );

    allQuestions.push(
      ...snapshot.docs
        .map((docSnap) => mapQuestion(docSnap))
        .filter((question) => question.questionText.length > 0)
    );
  }

  return allQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
}
