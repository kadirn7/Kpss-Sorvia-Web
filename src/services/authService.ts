import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserProfile } from '../types';
import { firebaseAuth, firestore } from '../firebase/app';
import { collections } from '../firebase/collections';

export function mapAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kayıtlı.';
    case 'auth/invalid-email':
      return 'Geçerli bir e-posta adresi gir.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Biraz sonra tekrar dene.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısını kontrol et.';
    case 'permission-denied':
      return 'Profil kaydedilemedi. Firestore kurallarının yayınlandığından emin ol.';
    default:
      return 'İşlem tamamlanamadı. Tekrar dene.';
  }
}

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const username = input.username.trim();
  const email = input.email.trim();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, input.password);

  await setDoc(doc(firestore, collections.users, credential.user.uid), {
    username,
    email,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return credential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(firebaseAuth);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(firestore, collections.users, uid));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    username: typeof data.username === 'string' ? data.username : '',
    email: typeof data.email === 'string' ? data.email : '',
    createdAt: data.createdAt?.toISOString() || '',
  };
}
