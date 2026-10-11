import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Play } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorState } from '../components/ui/error-state';
import { EmptyState } from '../components/ui/empty-state';
import { fetchTopicsByLesson } from '../services/topicService';
import { fetchLessons } from '../services/lessonService';
import type { Lesson, Topic } from '../types';

// Kronolojik sıralama map'i (ders ID'lerine göre konu sıralaması)
const CHRONOLOGICAL_ORDER: Record<string, string[]> = {
  'lesson-tarih': [
    'topic-tarih-islam-oncesi-turk-tarihi',
    'topic-tarih-ilk-turk-islam-devletleri',
    'topic-tarih-beylikler-ve-turkiye-selcuklu-devleti',
    'topic-tarih-osmanli-devleti-kurulus-donemi',
    'topic-tarih-osmanli-devleti-yukselme-donemi',
    'topic-tarih-osmanli-devleti-kultur-medeniyet',
    'topic-tarih-osmanli-devleti-duraklama-donemi',
    'topic-tarih-osmanli-devleti-gerileme-donemi',
    'topic-tarih-osmanli-devleti-dagilma-donemi',
    'topic-tarih-xx-yy-baslarinda-osmanli-devleti',
    'topic-tarih-milli-mucadele-hazirlik-donemi',
    'topic-tarih-milli-mucadele-cepheler-ve-diplomasi',
    'topic-tarih-ataturk-donemi-ic-politika',
    'topic-tarih-ataturk-ilkeleri',
    'topic-tarih-ataturk-donemi-dis-politika',
    'topic-tarih-iki-savas-arasi-donem-ve-2-dunya-savasi',
    'topic-tarih-ii-dunya-savasi-sonrasi-turkiye',
    'topic-tarih-soguk-savas-ve-yumusama-donemi',
    'topic-tarih-kuresellesen-dunya',
  ],
};

export default function TopicsPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!lessonId) return;

      try {
        const [lessonsData, topicsData] = await Promise.all([
          fetchLessons(),
          fetchTopicsByLesson(lessonId),
        ]);

        const currentLesson = lessonsData.find((l) => l.id === lessonId);
        setLesson(currentLesson || null);

        // Kronolojik sıralama varsa map'e göre sırala, yoksa order'a göre
        const orderMap = CHRONOLOGICAL_ORDER[lessonId];
        if (orderMap) {
          const topicMap = new Map(topicsData.map((t) => [t.id, t]));
          const sortedTopics = orderMap
            .map((id) => topicMap.get(id))
            .filter((t): t is Topic => t !== undefined);
          setTopics(sortedTopics);
        } else {
          setTopics(topicsData);
        }
      } catch (err) {
        setError('Konular yüklenemedi. Tekrar dene.');
        console.error('Error loading topics:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [lessonId]);

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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/lessons" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Dersler</span>
              </Link>
              <div className="w-16" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Ders bulunamadı"
            description="İstediğiniz ders mevcut değil"
            action={
              <Link to="/lessons">
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium">
                  Derslere Dön
                </button>
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/lessons" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Dersler</span>
              </Link>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-text-primary">{lesson.name}</h1>
              </div>
              <div className="w-16" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Henüz konu eklenmemiş"
            description="Bu derse konular eklendiğinde burada görünecek"
            action={
              <Link to="/lessons">
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium">
                  Derslere Dön
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
            <Link to="/lessons" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Dersler</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-text-primary">{lesson.name}</h1>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-2">{lesson.name}</h2>
          <p className="text-text-secondary">
            {topics.length} konu
          </p>
        </div>

        <div className="space-y-3">
          {topics.map((topic, index) => (
            <Link key={topic.id} to={`/quiz?topicId=${topic.id}&lessonId=${lessonId}`}>
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-text-primary">{topic.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
