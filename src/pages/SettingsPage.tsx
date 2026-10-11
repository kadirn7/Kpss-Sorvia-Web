import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Bell, Moon, Sun, Monitor, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorState } from '../components/ui/error-state';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import type { UserSettings } from '../types';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const loadSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userSettings = await userService.fetchUserSettings(user.uid);
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (err) {
      console.error('Ayarlar yükleme hatası:', err);
      setError('Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !settings) return;

    try {
      setSaving(true);
      setError(null);

      await userService.updateUserSettings({
        dailyTarget: settings.dailyTarget,
        weeklyTarget: settings.weeklyTarget,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        theme: settings.theme,
      });

      alert('Ayarlar güncellendi');
    } catch (err) {
      console.error('Ayarlar güncelleme hatası:', err);
      setError('Ayarlar güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
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
              <h1 className="text-lg font-semibold text-text-primary">Ayarlar</h1>
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState message={error} onRetry={loadSettings} />
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
            <h1 className="text-lg font-semibold text-text-primary">Ayarlar</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Ayarlar</h2>
          <p className="text-text-secondary">Uygulama ayarlarınızı yönetin</p>
        </div>

        {/* Hedefler */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Hedefler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Günlük Hedef */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Günlük Hedef (Soru Sayısı)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={settings?.dailyTarget || 20}
                onChange={(e) =>
                  setSettings(
                    (prev) =>
                      prev ? { ...prev, dailyTarget: parseInt(e.target.value) || 20 } : null
                  )
                }
              />
              <p className="text-xs text-text-secondary mt-1">
                Günlük çözmeyi hedeflediğiniz soru sayısı
              </p>
            </div>

            {/* Haftalık Hedef */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Haftalık Hedef (Soru Sayısı)
              </label>
              <Input
                type="number"
                min="1"
                max="700"
                value={settings?.weeklyTarget || 140}
                onChange={(e) =>
                  setSettings(
                    (prev) =>
                      prev ? { ...prev, weeklyTarget: parseInt(e.target.value) || 140 } : null
                  )
                }
              />
              <p className="text-xs text-text-secondary mt-1">
                Haftalık çözmeyi hedeflediğiniz soru sayısı
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bildirimler */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Bildirimler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* E-posta Bildirimleri */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">E-posta Bildirimleri</p>
                <p className="text-sm text-text-secondary">
                  Haftalık özet ve hedef hatırlatmaları
                </p>
              </div>
              <Checkbox
                checked={settings?.emailNotifications ?? true}
                onChange={(e) =>
                  setSettings(
                    (prev) =>
                      prev ? { ...prev, emailNotifications: e.target.checked } : null
                  )
                }
              />
            </div>

            {/* Push Bildirimleri */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Push Bildirimleri</p>
                <p className="text-sm text-text-secondary">
                  Tarayıcı bildirimleri
                </p>
              </div>
              <Checkbox
                checked={settings?.pushNotifications ?? true}
                onChange={(e) =>
                  setSettings(
                    (prev) =>
                      prev ? { ...prev, pushNotifications: e.target.checked } : null
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Tema */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Tema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {/* Light */}
              <button
                onClick={() =>
                  setSettings((prev) => (prev ? { ...prev, theme: 'light' } : null))
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings?.theme === 'light'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-surface'
                }`}
              >
                <Sun className="w-6 h-6 mx-auto mb-2 text-text-primary" />
                <p className="text-sm font-medium text-text-primary">Açık</p>
              </button>

              {/* Dark */}
              <button
                onClick={() =>
                  setSettings((prev) => (prev ? { ...prev, theme: 'dark' } : null))
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings?.theme === 'dark'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-surface'
                }`}
              >
                <Moon className="w-6 h-6 mx-auto mb-2 text-text-primary" />
                <p className="text-sm font-medium text-text-primary">Koyu</p>
              </button>

              {/* System */}
              <button
                onClick={() =>
                  setSettings((prev) => (prev ? { ...prev, theme: 'system' } : null))
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings?.theme === 'system'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-surface'
                }`}
              >
                <Monitor className="w-6 h-6 mx-auto mb-2 text-text-primary" />
                <p className="text-sm font-medium text-text-primary">Sistem</p>
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-3">
              Sistem seçeneği işletim sistemi ayarlarını kullanır
            </p>
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
