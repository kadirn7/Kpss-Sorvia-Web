import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorState } from '../components/ui/error-state';
import { EmptyState } from '../components/ui/empty-state';
import { fetchLessons } from '../services/lessonService';
import type { Lesson } from '../types';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLessons() {
      try {
        const data = await fetchLessons();
        setLessons(data);
      } catch (err) {
        setError('Dersler yüklenemedi. Tekrar dene.');
        console.error('Error loading lessons:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLessons();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Ana Sayfa</span>
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold text-text-primary">Sorvia</span>
              </div>
              <div className="w-16" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Henüz ders eklenmemiş"
            description="Dersler eklendiğinde burada görünecek"
            action={
              <Link to="/">
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium">
                  Ana Sayfaya Dön
                </button>
              </Link>
            }
          />
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
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-text-primary">Sorvia</span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Dersler</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lessons.map((lesson) => (
            <Link key={lesson.id} to={`/lessons/${lesson.id}/topics`}>
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="font-semibold text-text-primary mb-2 text-lg">{lesson.name}</h3>
                  <p className="text-sm text-text-secondary">Konuları görüntüle</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
