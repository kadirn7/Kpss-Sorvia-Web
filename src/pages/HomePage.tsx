import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ListTodo, BarChart3, History, Target, CheckCircle2, LogOut, User, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { fetchLessons } from '../services/lessonService';
import type { Lesson } from '../types';

export default function HomePage() {
  const { user, profile, logout, isAuthenticated } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    async function loadLessons() {
      try {
        const data = await fetchLessons();
        setLessons(data);
      } catch (err) {
        console.error('Error loading lessons:', err);
      }
    }

    if (isAuthenticated) {
      loadLessons();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-text-primary">Sorvia</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/lessons" className="text-text-secondary hover:text-text-primary text-sm font-medium">
                Dersler
              </Link>
              <Link to="/playlists" className="text-text-secondary hover:text-text-primary text-sm font-medium">
                Listeler
              </Link>
              <Link to="/statistics" className="text-text-secondary hover:text-text-primary text-sm font-medium">
                İstatistikler
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/profile" className="text-text-secondary hover:text-text-primary text-sm font-medium">
                    <User className="w-4 h-4 inline mr-1" />
                    Profil
                  </Link>
                  <Link to="/settings" className="text-text-secondary hover:text-text-primary text-sm font-medium">
                    <Settings className="w-4 h-4 inline mr-1" />
                    Ayarlar
                  </Link>
                  <span className="text-sm text-text-secondary">
                    {profile?.username || user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            KPSS çalışma alanın
          </h1>
          <p className="text-text-secondary">
            10 Ekim Cumartesi · Çalışma alanın
          </p>
        </div>

        {/* Daily Goal Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Bugün hedeflerine ulaşalım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary mb-4">
              Kaldığın yerden devam et, eksiklerini tamamla.
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <p className="text-2xl font-bold text-text-primary">0</p>
                  <p className="text-xs text-text-secondary">Doğru cevap</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-text-primary">0</p>
                  <p className="text-xs text-text-secondary">Seri gün</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {lessons.length > 0 && (
            <Link to={`/lessons/${lessons[0].id}/topics`}>
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">{lessons[0].name}</h3>
                      <p className="text-sm text-text-secondary">
                        Çalışmaya devam et
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link to="/lessons">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-1">Tüm Dersler</h3>
                    <p className="text-sm text-text-secondary">
                      Dersleri görüntüle
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Access */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">Hızlı erişim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/playlists">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ListTodo className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-medium text-text-primary">Listelerim</h3>
                    <p className="text-sm text-text-secondary">
                      Kendine özel soru koleksiyonları
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/statistics">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-medium text-text-primary">İstatistikler</h3>
                    <p className="text-sm text-text-secondary">
                      İlerlemeni ve eksiklerini gör
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/mock-exams">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-medium text-text-primary">Denemeler</h3>
                    <p className="text-sm text-text-secondary">
                      Gerçek sınav simülasyonu
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Lessons Overview */}
        <h2 className="text-lg font-semibold text-text-primary mb-4 mt-8">Dersler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lessons.map((lesson) => (
            <Link key={lesson.id} to={`/lessons/${lesson.id}/topics`}>
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">📚</div>
                  <h3 className="font-semibold text-text-primary mb-2">{lesson.name}</h3>
                  <p className="text-sm text-text-secondary">Konuları görüntüle</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border md:hidden">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center gap-1 p-2 text-primary">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">Ana Sayfa</span>
          </Link>
          <Link to="/lessons" className="flex flex-col items-center gap-1 p-2 text-text-secondary">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">Dersler</span>
          </Link>
          <Link to="/playlists" className="flex flex-col items-center gap-1 p-2 text-text-secondary">
            <ListTodo className="w-5 h-5" />
            <span className="text-xs">Listeler</span>
          </Link>
          <Link to="/statistics" className="flex flex-col items-center gap-1 p-2 text-text-secondary">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">İstatistik</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-1 p-2 text-text-secondary">
            <User className="w-5 h-5" />
            <span className="text-xs">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
