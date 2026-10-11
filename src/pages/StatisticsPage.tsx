import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Target, Calendar, AlertCircle, RefreshCw, Lightbulb, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { ACTIVE_LESSON, WEAK_TOPIC_MIN_ATTEMPTS } from '../constants';
import { fetchLessons } from '../services/lessonService';
import statisticsService from '../services/statisticsService';
import type {
  DailyStats,
  LessonStats,
  StreakData,
  TopicStats,
  WeakTopic,
  WeeklyStats,
} from '../types';

function priorityLabel(priority: WeakTopic['priority']): string {
  if (priority === 'high') {
    return 'Öncelikli';
  }
  if (priority === 'medium') {
    return 'Geliştir';
  }
  return 'İyi';
}

function priorityBadgeVariant(priority: WeakTopic['priority']): 'error' | 'warning' | 'default' {
  if (priority === 'high') {
    return 'error';
  }
  if (priority === 'medium') {
    return 'warning';
  }
  return 'default';
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonStats, setLessonStats] = useState<LessonStats | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [daily, setDaily] = useState<DailyStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [unknownTopicCount, setUnknownTopicCount] = useState(0);

  const load = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const lessons = await fetchLessons();
      const lesson = lessons.find((item) => item.name === ACTIVE_LESSON) ?? lessons[0];
      if (!lesson) {
        setError('Ders bulunamadı');
        return;
      }

      const [summary, topicResult] = await Promise.all([
        statisticsService.getUserSummary(user.uid, lesson.id),
        statisticsService.getTopicStats(user.uid, lesson.id),
      ]);

      setLessonStats(summary.lessonStats);
      setStreak(summary.streak);
      setDaily(summary.dailyStats);
      setWeekly(summary.weeklyStats);
      setWeakTopics(summary.weakTopics);
      setTopicStats(topicResult.stats);
      setUnknownTopicCount(topicResult.unknownCount);
    } catch (err) {
      console.error('İstatistik yükleme hatası:', err);
      setError('İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClearStats = async () => {
    if (!user) return;
    if (!confirm('TÜM İSTATİSTİKLERİNİZ SİLİNECEK. Emin misiniz?')) return;

    try {
      await (statisticsService as any).clearAllUserStats(user.uid);
      alert('İstatistikler temizlendi. Sayfa yenileniyor...');
      await load();
    } catch (err) {
      console.error('Temizleme hatası:', err);
      alert('Temizleme hatası: ' + (err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">İstatistikler yükleniyor...</p>
        </div>
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
              <h1 className="text-lg font-semibold text-text-primary">İstatistikler</h1>
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-error/50">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-error flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">Hata</h3>
                <p className="text-sm text-text-secondary mb-4">{error}</p>
                <Button onClick={load} variant="outline" size="sm">
                  Tekrar Dene
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Genel çalışma önerisi
  const getGeneralSuggestion = () => {
    if (weakTopics.length === 0) {
      return topicStats.length === 0
        ? 'Henüz soru çözülmedi. Çalışmaya başlamak için bir konu seç.'
        : 'İyi gidiyorsun! Devam et ve zayıf olduğun konuları pekiştir.';
    }

    const topWeakTopics = weakTopics.slice(0, 2).map(t => t.topicName).join(' ile ');
    return `En çok yanlış yaptığın konular ${topWeakTopics}. Bugünkü çalışmana bu konularla başlayabilirsin.`;
  };

  // İstatistik yüklenemedi mi kontrol et
  const hasLoadError = lessonStats?.loadError || streak?.loadError || daily?.loadError || weekly?.loadError;


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
            <h1 className="text-lg font-semibold text-text-primary">İstatistikler</h1>
            <Button
              onClick={handleClearStats}
              variant="outline"
              size="sm"
              className="text-error border-error hover:bg-error/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Temizle
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-1">İstatistik</h2>
          <p className="text-text-secondary">{ACTIVE_LESSON} performansın</p>
        </div>

        {/* Genel Öneri */}
        <Card className="bg-primary/10 border-primary/30 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary">{getGeneralSuggestion()}</p>
          </CardContent>
        </Card>

        {/* Yükleme Hatası Uyarısı */}
        {hasLoadError && (
          <Card className="border-warning/50 bg-warning/10 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-text-primary font-medium">İstatistikler yüklenemedi</p>
                <p className="text-xs text-text-secondary mt-1">Bazı istatistikler bağlantı hatası nedeniyle yüklenemedi. Lütfen tekrar dene.</p>
              </div>
              <Button onClick={load} variant="outline" size="sm">
                Tekrar Dene
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Streak Card */}
        <Card className="bg-primary text-white mb-6 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold mb-1">{streak?.currentStreak ?? 0} gün</p>
                <p className="text-white/90 font-medium">Mevcut seri</p>
                <p className="text-white/70 text-sm mt-1">En uzun: {streak?.longestStreak ?? 0} gün</p>
              </div>
              <Calendar className="w-12 h-12 text-white/30" />
            </div>
          </CardContent>
        </Card>

        {/* Daily & Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm text-text-secondary font-medium uppercase">Bugün</span>
              </div>
              <p className="text-3xl font-bold text-text-primary mb-1">{daily?.totalQuestions ?? 0} / {daily?.target ?? 20}</p>
              <p className="text-sm text-text-secondary">
                {daily?.correctCount ?? 0} doğru · {daily?.wrongCount ?? 0} yanlış
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm text-text-secondary font-medium uppercase">Bu Hafta</span>
              </div>
              <p className="text-3xl font-bold text-text-primary mb-1">{weekly?.totalQuestions ?? 0} soru</p>
              <p className="text-sm text-text-secondary">
                {weekly?.correctCount ?? 0} doğru · {weekly?.wrongCount ?? 0} yanlış
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lesson Stats */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="text-sm text-text-secondary font-medium uppercase">{lessonStats?.lessonName ?? ACTIVE_LESSON}</span>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{lessonStats?.totalAttempts ?? 0} soru çözüldü</p>
            <p className="text-sm text-text-secondary mb-3">
              {lessonStats?.correctCount ?? 0} doğru · {lessonStats?.wrongCount ?? 0} yanlış
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Başarı oranı: </span>
                <span className="font-semibold text-success">%{lessonStats?.successRate ?? 0}</span>
              </div>
              <div>
                <span className="text-text-secondary">Yanlış oranı: </span>
                <span className="font-semibold text-error">%{lessonStats?.wrongRate ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weak Topics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Zayıf Konular</h3>
          <p className="text-sm text-text-secondary mb-4">
            En az {WEAK_TOPIC_MIN_ATTEMPTS} soru çözülmüş konular. Yanlış oranına göre sıralı.
          </p>
          {weakTopics.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-text-secondary">
                  {topicStats.length === 0
                    ? 'Henüz soru çözülmedi. Çalışmaya başlamak için bir konu seç.'
                    : 'Henüz yeterince soru çözülmemiş veya zayıf konu görünmüyor.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {weakTopics.map((topic) => (
                <Link
                  key={topic.topicId}
                  to={`/quiz?lessonId=${topic.lessonId}&topicId=${topic.topicId}`}
                  className="block"
                >
                  <Card className="hover:bg-error/5 transition-colors cursor-pointer border-error/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-text-primary mb-1">{topic.topicName}</p>
                          <p className="text-sm text-text-secondary mb-2">
                            {topic.totalAttempts} soru · {topic.correctCount} doğru · {topic.wrongCount} yanlış
                          </p>
                          <p className="text-sm text-text-secondary italic">{topic.suggestion}</p>
                        </div>
                        <Badge variant={priorityBadgeVariant(topic.priority)}>
                          {priorityLabel(topic.priority)}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm mt-3">
                        <div>
                          <span className="text-text-secondary">Doğru: </span>
                          <span className="font-semibold text-success">%{topic.successRate}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Yanlış: </span>
                          <span className="font-semibold text-error">%{topic.wrongRate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Topic Stats */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Konu Başarıları</h3>

          {/* topicId Eksik Uyarısı */}
          {unknownTopicCount > 0 && (
            <Card className="border-warning/50 bg-warning/10 mb-4">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-text-primary font-medium">
                    {unknownTopicCount} sorunun konu bilgisi eksik
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Bu sorular konu bazlı istatistiklerde görünmüyor. Bu sorular muhtemelen mobil uygulamadan çözüldü.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {topicStats.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-text-secondary">
                  Soru çözdükçe konu istatistikleri burada görünür.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topicStats.map((topic) => (
                <Card key={topic.topicId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-text-primary mb-1">{topic.topicName}</p>
                        <p className="text-sm text-text-secondary mb-2">
                          {topic.totalAttempts} soru çözüldü · {topic.correctCount} doğru · {topic.wrongCount} yanlış
                        </p>
                      </div>
                      <Badge variant={topic.successRate > 50 ? 'success' : 'default'}>
                        %{topic.successRate}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Doğru oranı: </span>
                        <span className="font-semibold text-success">%{topic.successRate}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Yanlış oranı: </span>
                        <span className="font-semibold text-error">%{topic.wrongRate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
