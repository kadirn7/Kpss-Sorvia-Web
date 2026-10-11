import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorState } from '../components/ui/error-state';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import type { UserProfile } from '../types';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userProfile = await userService.fetchUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setDisplayName(userProfile.displayName || '');
        setPhotoURL(userProfile.photoURL || '');
      } else {
        // Firebase auth'dan varsayılan değerler
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || '');
      }
    } catch (err) {
      console.error('Profil yükleme hatası:', err);
      setError('Profil yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      // Sadece dolu değerleri gönder
      const updateData: { displayName?: string; photoURL?: string } = {};
      if (displayName.trim()) {
        updateData.displayName = displayName.trim();
      }
      if (photoURL.trim()) {
        updateData.photoURL = photoURL.trim();
      }

      await userService.updateUserProfile(updateData);

      // Profil sayfasını yenile
      await loadProfile();

      alert('Profil güncellendi');
    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Ana Sayfa</span>
              </Link>
              <h1 className="text-lg font-semibold text-text-primary">Profil</h1>
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState message={error} onRetry={loadProfile} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Ana Sayfa</span>
            </Link>
            <h1 className="text-lg font-semibold text-text-primary">Profil</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Profil</h2>
          <p className="text-text-secondary">Profil bilgilerinizi yönetin</p>
        </div>

        {/* Profil Kartı */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {photoURL ? (
                  <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Avatar URL</p>
                <Input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full max-w-md"
                />
              </div>
            </div>

            {/* Görünür Ad */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Görünür Ad
              </label>
              <Input
                type="text"
                placeholder="Adınız"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            {/* E-posta (Sadece okuma) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                E-posta
              </label>
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                E-posta değiştirmek için Firebase Authentication ayarlarını kullanın
              </p>
            </div>

            {/* Kayıt Tarihi (Sadece okuma) */}
            {profile?.createdAt && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Kayıt Tarihi
                </label>
                <p className="text-text-secondary">
                  {new Date(profile.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kaydet Butonu */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </main>
    </div>
  );
}
