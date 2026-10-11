import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import type { Playlist, PlaylistKind } from '../types';
import { timestampToIso } from '../utils/timestamps';
import { firestore } from '../firebase/app';
import { collections } from '../firebase/collections';

const HARD_PLAYLIST_NAME = 'Zor Sorular';
const RETRY_PLAYLIST_NAME = 'Tekrar Et';

function asKind(value: unknown): PlaylistKind {
  if (value === 'hard' || value === 'retry') {
    return value;
  }
  return 'user';
}

function mapPlaylist(id: string, data: Record<string, unknown>, questionCount = 0): Playlist {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    name: typeof data.name === 'string' ? data.name : '',
    kind: asKind(data.kind),
    questionCount,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

const KIND_ORDER: Record<PlaylistKind, number> = {
  retry: 0,
  hard: 1,
  user: 2,
};

export async function fetchUserPlaylists(userId: string): Promise<Playlist[]> {
  const snapshot = await getDocs(
    query(collection(firestore, collections.playlists), where('userId', '==', userId))
  );

  const playlists = snapshot.docs.map((docSnap) => mapPlaylist(docSnap.id, docSnap.data()));
  const counts = await Promise.all(playlists.map((playlist) => countPlaylistQuestions(playlist.id)));

  return playlists
    .map((playlist, index) => ({ ...playlist, questionCount: counts[index] }))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.name.localeCompare(b.name, 'tr'));
}

async function ensureNamedPlaylist(
  userId: string,
  name: string,
  kind: 'hard' | 'retry'
): Promise<Playlist> {
  const existing = await fetchUserPlaylists(userId);
  const found = existing.find((item) => item.kind === kind);
  if (found) {
    return found;
  }

  const ref = await addDoc(collection(firestore, collections.playlists), {
    userId,
    name,
    kind,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    userId,
    name,
    kind,
    questionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function ensureDefaultPlaylists(userId: string): Promise<void> {
  await ensureNamedPlaylist(userId, RETRY_PLAYLIST_NAME, 'retry');
  await ensureNamedPlaylist(userId, HARD_PLAYLIST_NAME, 'hard');
}

export async function createUserPlaylist(userId: string, name: string): Promise<Playlist> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Liste adı boş olamaz.');
  }

  const existing = await fetchUserPlaylists(userId);
  const duplicate = existing.some(
    (item) => item.name.localeCompare(trimmed, 'tr', { sensitivity: 'accent' }) === 0
  );
  if (duplicate) {
    throw new Error('Bu isimde bir listen var.');
  }

  const ref = await addDoc(collection(firestore, collections.playlists), {
    userId,
    name: trimmed,
    kind: 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    userId,
    name: trimmed,
    kind: 'user',
    questionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await deleteDoc(doc(firestore, collections.playlists, playlistId));
}

async function countPlaylistQuestions(playlistId: string): Promise<number> {
  const snapshot = await getDocs(
    query(collection(firestore, collections.playlistQuestions), where('playlistId', '==', playlistId))
  );
  return snapshot.size;
}

export async function fetchPlaylistQuestionIds(playlistId: string): Promise<string[]> {
  const snapshot = await getDocs(
    query(collection(firestore, collections.playlistQuestions), where('playlistId', '==', playlistId))
  );
  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
      return typeof data.questionId === 'string' ? data.questionId : '';
    })
    .filter((id) => id.length > 0);
}

export async function fetchPlaylistIdsForQuestion(userId: string, questionId: string): Promise<string[]> {
  const playlists = await fetchUserPlaylists(userId);
  const matches = await Promise.all(
    playlists.map(async (playlist) => {
      const ids = await fetchPlaylistQuestionIds(playlist.id);
      return ids.includes(questionId) ? playlist.id : null;
    })
  );
  return matches.filter((id): id is string => id != null);
}

export async function addQuestionToPlaylist(
  playlistId: string,
  questionId: string
): Promise<void> {
  const itemId = `${playlistId}_${questionId}`;
  await setDoc(doc(firestore, collections.playlistQuestions, itemId), {
    playlistId,
    questionId,
    addedAt: serverTimestamp(),
  });
}

export async function removeQuestionFromPlaylist(
  playlistId: string,
  questionId: string
): Promise<void> {
  const itemId = `${playlistId}_${questionId}`;
  await deleteDoc(doc(firestore, collections.playlistQuestions, itemId));
}

export async function saveQuestionToPlaylists(
  userId: string,
  questionId: string,
  selectedPlaylistIds: string[]
): Promise<void> {
  const playlists = await fetchUserPlaylists(userId);
  const selected = new Set(selectedPlaylistIds);

  await Promise.all(
    playlists.map(async (playlist) => {
      const itemId = `${playlist.id}_${questionId}`;
      if (selected.has(playlist.id)) {
        await setDoc(doc(firestore, collections.playlistQuestions, itemId), {
          playlistId: playlist.id,
          questionId,
          addedAt: serverTimestamp(),
        });
        return;
      }
      await deleteDoc(doc(firestore, collections.playlistQuestions, itemId));
    })
  );
}
