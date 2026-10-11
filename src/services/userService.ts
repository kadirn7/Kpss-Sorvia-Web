import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { collections, firestore, firebaseAuth } from '../firebase';
import type { UserProfile, UserSettings } from '../types';

/**
 * User Service
 *
 * Kullanıcı profilini ve ayarlarını yönetir
 */
class UserService {
  /**
   * Auth kontrolü - Firebase auth hazır mı?
   */
  private isAuthReady(): boolean {
    return firebaseAuth.currentUser != null;
  }

  /**
   * Kullanıcı profilini getir
   */
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const ref = doc(firestore, collections.users, userId);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          id: data.id || userId,
          username: data.username || '',
          email: data.email || '',
          createdAt: data.createdAt || '',
          displayName: data.displayName || undefined,
          photoURL: data.photoURL || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ User profile fetch hatası:', error);
      return null;
    }
  }

  /**
   * Kullanıcı profilini güncelle
   */
  async updateUserProfile(data: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    // Auth kontrolü
    if (!this.isAuthReady()) {
      throw new Error('Firebase auth hazır değil');
    }

    const userId = firebaseAuth.currentUser!.uid;
    const ref = doc(firestore, collections.users, userId);

    try {
      await setDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('❌ User profile update hatası:', error);
      throw error;
    }
  }

  /**
   * Kullanıcı ayarlarını getir
   */
  async fetchUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const ref = doc(firestore, collections.users, userId);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          userId,
          dailyTarget: data.dailyTarget || 20,
          weeklyTarget: data.weeklyTarget || 140,
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          theme: data.theme || 'system',
          updatedAt: data.updatedAt || '',
        };
      }

      // Kayıt yoksa varsayılan ayarlar
      return {
        userId,
        dailyTarget: 20,
        weeklyTarget: 140,
        emailNotifications: true,
        pushNotifications: true,
        theme: 'system',
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ User settings fetch hatası:', error);
      return null;
    }
  }

  /**
   * Kullanıcı ayarlarını güncelle
   */
  async updateUserSettings(settings: {
    dailyTarget?: number;
    weeklyTarget?: number;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
  }): Promise<void> {
    // Auth kontrolü
    if (!this.isAuthReady()) {
      throw new Error('Firebase auth hazır değil');
    }

    const userId = firebaseAuth.currentUser!.uid;
    const ref = doc(firestore, collections.users, userId);

    try {
      await setDoc(ref, {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('❌ User settings update hatası:', error);
      throw error;
    }
  }
}

// Singleton instance
const userService = new UserService();

export default userService;
