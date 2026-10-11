import { collection, getDoc, getDocs, query, where, addDoc, updateDoc, doc, orderBy, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';
import type { MockExam, MockExamQuestion, MockExamResult, CorrectOption } from '../types';

const OPTIONS: CorrectOption[] = ['A', 'B', 'C', 'D', 'E'];

function asCorrectOption(value: unknown): CorrectOption {
  return OPTIONS.includes(value as CorrectOption) ? (value as CorrectOption) : 'A';
}

function mapMockExam(docSnap: QueryDocumentSnapshot<DocumentData>): MockExam {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: typeof data.title === 'string' ? data.title : '',
    lessonId: typeof data.lessonId === 'string' ? data.lessonId : '',
    lessonName: typeof data.lessonName === 'string' ? data.lessonName : '',
    durationMinutes: typeof data.durationMinutes === 'number' ? data.durationMinutes : null,
    questionCount: typeof data.questionCount === 'number' ? data.questionCount : 0,
    order: typeof data.order === 'number' ? data.order : 0,
    published: typeof data.published === 'boolean' ? data.published : false,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
  };
}

function mapMockExamQuestion(docSnap: QueryDocumentSnapshot<DocumentData>): MockExamQuestion {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    order: typeof data.order === 'number' ? data.order : 0,
    questionText: typeof data.questionText === 'string' ? data.questionText : '',
    optionA: typeof data.optionA === 'string' ? data.optionA : '',
    optionB: typeof data.optionB === 'string' ? data.optionB : '',
    optionC: typeof data.optionC === 'string' ? data.optionC : '',
    optionD: typeof data.optionD === 'string' ? data.optionD : '',
    optionE: typeof data.optionE === 'string' ? data.optionE : '',
    correctOption: asCorrectOption(data.correctOption),
    solution: typeof data.solution === 'string' ? data.solution : null,
    source: typeof data.source === 'string' ? data.source : null,
  };
}

function mapMockExamResult(docSnap: QueryDocumentSnapshot<DocumentData>): MockExamResult {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    examId: typeof data.examId === 'string' ? data.examId : '',
    examTitle: typeof data.examTitle === 'string' ? data.examTitle : '',
    lessonId: typeof data.lessonId === 'string' ? data.lessonId : '',
    lessonName: typeof data.lessonName === 'string' ? data.lessonName : '',
    correctCount: typeof data.correctCount === 'number' ? data.correctCount : 0,
    wrongCount: typeof data.wrongCount === 'number' ? data.wrongCount : 0,
    emptyCount: typeof data.emptyCount === 'number' ? data.emptyCount : 0,
    totalQuestions: typeof data.totalQuestions === 'number' ? data.totalQuestions : 0,
    percentage: typeof data.percentage === 'number' ? data.percentage : 0,
    durationMinutes: typeof data.durationMinutes === 'number' ? data.durationMinutes : null,
    startedAt: typeof data.startedAt === 'string' ? data.startedAt : '',
    completedAt: typeof data.completedAt === 'string' ? data.completedAt : null,
    answers: Array.isArray(data.answers) ? data.answers : [],
  };
}

/**
 * Yayınlanmış denemeleri getir
 */
export async function fetchMockExams(): Promise<MockExam[]> {
  try {
    const snapshot = await getDocs(
      query(collection(firestore, collections.mockExams), where('published', '==', true))
    );

    return snapshot.docs.map(mapMockExam);
  } catch (error) {
    console.error('Denemeler getirilemedi:', error);
    throw error;
  }
}

/**
 * Belirli bir deneme getir
 */
export async function fetchMockExam(examId: string): Promise<MockExam | null> {
  try {
    const docSnap = await getDoc(doc(firestore, collections.mockExams, examId));

    if (!docSnap.exists()) return null;

    return mapMockExam(docSnap);
  } catch (error) {
    console.error('Deneme getirilemedi:', error);
    throw error;
  }
}

/**
 * Deneme sorularını getir
 */
export async function fetchMockExamQuestions(examId: string): Promise<MockExamQuestion[]> {
  try {
    const snapshot = await getDocs(
      query(collection(firestore, collections.mockExams, examId, 'questions'), orderBy('order', 'asc'))
    );

    return snapshot.docs.map(mapMockExamQuestion);
  } catch (error) {
    console.error('Deneme soruları getirilemedi:', error);
    throw error;
  }
}

/**
 * Deneme sonucu oluştur
 */
export async function createMockExamResult(result: Omit<MockExamResult, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(firestore, collections.mockExamResults), result);
    return docRef.id;
  } catch (error) {
    console.error('Deneme sonucu oluşturulamadı:', error);
    throw error;
  }
}

/**
 * Deneme sonucunu güncelle
 */
export async function updateMockExamResult(resultId: string, updates: Partial<MockExamResult>): Promise<void> {
  try {
    await updateDoc(doc(firestore, collections.mockExamResults, resultId), updates);
  } catch (error) {
    console.error('Deneme sonucu güncellenemedi:', error);
    throw error;
  }
}

/**
 * Kullanıcının deneme sonuçlarını getir
 */
export async function fetchUserMockExamResults(userId: string): Promise<MockExamResult[]> {
  try {
    const snapshot = await getDocs(
      query(collection(firestore, collections.mockExamResults), where('userId', '==', userId), orderBy('startedAt', 'desc'))
    );

    return snapshot.docs.map(mapMockExamResult);
  } catch (error) {
    console.error('Deneme sonuçları getirilemedi:', error);
    throw error;
  }
}

/**
 * Belirli bir deneme sonucunu getir
 */
export async function fetchMockExamResult(resultId: string): Promise<MockExamResult | null> {
  try {
    const docSnap = await getDoc(doc(firestore, collections.mockExamResults, resultId));

    if (!docSnap.exists()) return null;

    return mapMockExamResult(docSnap);
  } catch (error) {
    console.error('Deneme sonucu getirilemedi:', error);
    throw error;
  }
}
