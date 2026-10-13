import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, BookOpen, Lightbulb, Bookmark, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import type { Question, CorrectOption, Playlist } from '../types';
import { fetchQuestionsByTopic, fetchQuestionsByPlaylist } from '../services/questionService';
import { recordQuestionAttempt } from '../services/progressService';
import { getLastQuizIds, saveLastQuizIds } from '../services/quizSessionStore';
import { pickQuizQuestions } from '../utils/quizPicker';
import { useAuth } from '../context/AuthContext';
import { fetchUserPlaylists, createUserPlaylist, addQuestionToPlaylist, removeQuestionFromPlaylist, fetchPlaylistIdsForQuestion } from '../services/playlistService';
import statisticsService from '../services/statisticsService';
import { shuffle } from '../utils/quiz-engine';

// Kronolojik sıralama map'i - BU SIRALAMA DEĞİŞTİRİLMEMELİ
export const CHRONOLOGICAL_ORDER: Record<string, string[]> = {
  'lesson-tarih': [
    'topic-tarih-islam-oncesi-turk-tarihi',
    'topic-tarih-ilk-turk-islam-devletleri',
    'topic-tarih-beylikler-ve-turkiye-selcuklu-devleti',
    'topic-tarih-osmanli-devleti-kurulus-donemi',
    'topic-tarih-osmanli-devleti-yukselme-donemi',
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

const OPTIONS: CorrectOption[] = ['A', 'B', 'C', 'D', 'E'];

interface QuizAnswer {
  questionId: string;
  correct: boolean;
  userAnswer: CorrectOption;
}

interface ShuffledQuestion {
  question: Question;
  shuffledOptions: { key: CorrectOption; text: string }[];
  correctKey: CorrectOption;
}

// Şık karıştırma fonksiyonu
function shuffleOptions(question: Question): ShuffledQuestion {
  const originals: { orig: CorrectOption; text: string }[] = [
    { orig: 'A', text: question.optionA },
    { orig: 'B', text: question.optionB },
    { orig: 'C', text: question.optionC },
    { orig: 'D', text: question.optionD },
    { orig: 'E', text: question.optionE },
  ].filter((opt) => opt.text) as { orig: CorrectOption; text: string }[]; // Boş şıkları atla

  // "Hepsi", "I ve II" gibi bağımlı şıkları tespit et
  const looksDependent = (text: string): boolean => {
    const t = text.replace(/[İIı]/g, 'i').toLowerCase().trim();
    if (/hepsi|hiçbiri|hicbiri|yukaridaki|ikisi de/.test(t)) return true;
    const words = t.split(/[\s,;.]+/).filter(Boolean);
    const isRef = (w: string) => /^[ivx]+$/.test(w) || /^[a-e]$/.test(w);
    const glue = ['ve', 'ile', 'yalniz', 'yalnizca'];
    return words.length > 1 && words.some(isRef) && words.every((w) => isRef(w) || glue.includes(w));
  };

  const locked = originals.some((o) => looksDependent(o.text));
  const ordered = locked ? originals : shuffle(originals);

  const correctIndex = ordered.findIndex((o) => o.orig === question.correctOption);
  const correctKey = OPTIONS[correctIndex];

  return {
    question,
    shuffledOptions: ordered.map((o, i) => ({ key: OPTIONS[i], text: o.text })),
    correctKey,
  };
}

export default function QuizPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId') || '';
  const topicId = searchParams.get('topicId') || '';
  const playlistId = searchParams.get('playlistId') || '';
  const source = searchParams.get('source') || 'topic';

  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<CorrectOption | null>(null);
  const [results, setResults] = useState<QuizAnswer[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [isSavingToPlaylist, setIsSavingToPlaylist] = useState(false);
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answered = selected !== null;

  useEffect(() => {
    async function loadQuestions() {
      if (!user) {
        setError('Giriş yapmalısınız.');
        setIsLoading(false);
        return;
      }

      try {
        let allQuestions: Question[] = [];
        let quizKey = '';

        if (source === 'playlist' && playlistId) {
          // Playlist'ten soru çek
          allQuestions = await fetchQuestionsByPlaylist(playlistId);
          quizKey = playlistId;
          if (allQuestions.length === 0) {
            setError('Bu listede henüz soru yok.');
            setIsLoading(false);
            return;
          }
        } else if (topicId) {
          // Topic'ten soru çek
          allQuestions = await fetchQuestionsByTopic(topicId);
          quizKey = topicId;
          if (allQuestions.length === 0) {
            setError('Bu konuda henüz soru eklenmemiş.');
            setIsLoading(false);
            return;
          }
        } else {
          setError('Konu veya liste seçilmemiş.');
          setIsLoading(false);
          return;
        }

        // Son quiz'de çıkan soruları al
        const lastIds = getLastQuizIds(quizKey);

        // Soruları seç (smart picker)
        const selectedQuestions = pickQuizQuestions(allQuestions, allQuestions.length, lastIds, false);

        // Şıkları karıştır
        const shuffledQuestions = selectedQuestions.map((q) => shuffleOptions(q));
        setQuestions(shuffledQuestions);
      } catch (err) {
        setError('Sorular yüklenemedi. Tekrar dene.');
        console.error('Error loading questions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [topicId, playlistId, source, user]);

  const handleSelect = async (option: CorrectOption) => {
    if (answered) return;
    setSelected(option);
    setShowSolution(true);

    const isCorrect = option === currentQuestion.correctKey;

    // Progress kaydet
    if (user) {
      try {
        await recordQuestionAttempt({
          userId: user.uid,
          questionId: currentQuestion.question.id,
          lessonId: currentQuestion.question.lessonId,
          topicId: currentQuestion.question.topicId,
          correct: isCorrect,
        });

        // İstatistikleri güncelle
        await statisticsService.updateDailyStats(user.uid, isCorrect);
        await statisticsService.updateWeeklyStats(user.uid, isCorrect);
        await statisticsService.updateStreak(user.uid);
      } catch (err) {
        console.error('Error recording progress:', err);
      }
    }

    setResults((prev) => [
      ...prev,
      {
        questionId: currentQuestion.question.id,
        correct: isCorrect,
        userAnswer: option,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setShowSolution(false);
    } else {
      // Quiz bittiğinde son soruları kaydet
      const questionIds = questions.map((sq) => sq.question.id);
      const quizKey = source === 'playlist' ? playlistId : topicId;
      saveLastQuizIds(quizKey, questionIds);
      setFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelected(null);
      setShowSolution(false);
    }
  };

  const correctCount = results.filter((r) => r.correct).length;

  // Playlist modal'ını aç
  const handleOpenPlaylistModal = async () => {
    if (!user) return;

    try {
      const userPlaylists = await fetchUserPlaylists(user.uid);
      setPlaylists(userPlaylists);

      // Sorunun hangi listelerde olduğunu kontrol et
      const currentPlaylistIds = await fetchPlaylistIdsForQuestion(user.uid, currentQuestion.question.id);
      setSelectedPlaylists(new Set(currentPlaylistIds));

      setShowPlaylistModal(true);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  // Yeni liste oluştur
  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    setIsCreatingPlaylist(true);
    try {
      const newPlaylist = await createUserPlaylist(user.uid, newPlaylistName.trim());
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setShowNewPlaylistInput(false);
      // Yeni oluşturulan listeyi otomatik seç
      setSelectedPlaylists(new Set([...selectedPlaylists, newPlaylist.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste oluşturulamadı.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // Soruyu listelere kaydet
  const handleSaveToPlaylists = async () => {
    if (!user) return;

    setIsSavingToPlaylist(true);
    try {
      const currentPlaylistIds = await fetchPlaylistIdsForQuestion(user.uid, currentQuestion.question.id);
      const currentSet = new Set(currentPlaylistIds);

      // Yeni eklenenler
      for (const playlistId of selectedPlaylists) {
        if (!currentSet.has(playlistId)) {
          await addQuestionToPlaylist(playlistId, currentQuestion.question.id);
        }
      }

      // Kaldırılanlar
      for (const playlistId of currentSet) {
        if (!selectedPlaylists.has(playlistId)) {
          await removeQuestionFromPlaylist(playlistId, currentQuestion.question.id);
        }
      }

      setShowPlaylistModal(false);
    } catch (err) {
      console.error('Error saving to playlists:', err);
    } finally {
      setIsSavingToPlaylist(false);
    }
  };

  const togglePlaylist = (playlistId: string) => {
    const newSet = new Set(selectedPlaylists);
    if (newSet.has(playlistId)) {
      newSet.delete(playlistId);
    } else {
      newSet.add(playlistId);
    }
    setSelectedPlaylists(newSet);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4058D8] mx-auto"></div>
          <p className="mt-4 text-[#68758B]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#D64550] mb-4">{error}</p>
          <Link
            to={source === 'playlist' ? '/playlists' : lessonId ? `/lessons/${lessonId}/topics` : '/lessons'}
            className="text-[#4058D8] hover:text-[#3347B7] font-medium"
          >
            {source === 'playlist' ? 'Listelere Dön' : lessonId ? 'Konulara Dön' : 'Derslere Dön'}
          </Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to={`/lessons/${lessonId}/topics`} className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Konulara Dön</span>
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold text-text-primary">Sorvia</span>
              </div>
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Quiz Tamamlandı!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-text-primary mb-2">{percentage}%</p>
                <p className="text-text-secondary">Başarı Oranı</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">{correctCount}</p>
                  <p className="text-sm text-text-secondary">Doğru</p>
                </div>
                <div className="text-center p-4 bg-error/10 rounded-lg">
                  <p className="text-2xl font-bold text-error">{questions.length - correctCount}</p>
                  <p className="text-sm text-text-secondary">Yanlış</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  to={source === 'playlist' ? '/playlists' : lessonId ? `/lessons/${lessonId}/topics` : '/lessons'}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    {source === 'playlist' ? 'Listelere Dön' : lessonId ? 'Konulara Dön' : 'Derslere Dön'}
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setCurrentIndex(0);
                    setSelected(null);
                    setResults([]);
                    setShowSolution(false);
                    setFinished(false);
                  }}
                  className="flex-1"
                >
                  Tekrar Çöz
                </Button>
              </div>
            </CardContent>
          </Card>
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
            <Link
              to={source === 'playlist' ? '/playlists' : lessonId ? `/lessons/${lessonId}/topics` : '/lessons'}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">
                {source === 'playlist' ? 'Listelere Dön' : lessonId ? 'Konulara Dön' : 'Derslere Dön'}
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant="default">
                {currentIndex + 1} / {questions.length}
              </Badge>
              <Badge variant={correctCount > 0 ? 'success' : 'default'}>
                Doğru: {correctCount}
              </Badge>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            {/* Question */}
            <div className="mb-8">
              <p className="text-lg leading-relaxed text-text-primary whitespace-pre-line">
                {currentQuestion.question.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.shuffledOptions.map((opt) => {
                const isSelected = selected === opt.key;
                const isCorrectOption = opt.key === currentQuestion.correctKey;
                const showCorrect = answered && isCorrectOption;
                const showWrong = answered && isSelected && !isCorrectOption;

                let className = 'w-full text-left p-4 rounded-lg border-2 transition-all';
                if (showCorrect) {
                  className += ' border-success bg-success/10';
                } else if (showWrong) {
                  className += ' border-error bg-error/10';
                } else if (isSelected) {
                  className += ' border-primary bg-primary/10';
                } else {
                  className += ' border-border hover:border-primary/50 bg-surface';
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelect(opt.key)}
                    disabled={answered}
                    className={className}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-text-primary">{opt.key})</span>
                      <span className="text-text-primary flex-1">{opt.text}</span>
                      {showCorrect && <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />}
                      {showWrong && <XCircle className="w-5 h-5 text-error flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Solution */}
            {showSolution && currentQuestion.question.solution && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-success mb-1">Çözüm:</p>
                    <p className="text-text-primary text-sm">{currentQuestion.question.solution}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Source */}
            {currentQuestion.question.source && (
              <div className="mb-6">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.question.source}
                </Badge>
              </div>
            )}

            {/* Save to Playlist Button */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPlaylistModal}
                className="mb-6"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Listeye Ekle
              </Button>
            )}

            {/* Navigation */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1"
              >
                Önceki
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answered}
                className="flex-1"
              >
                {currentIndex === questions.length - 1 ? 'Bitir' : 'Sonraki'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Listeye Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {playlists.map((playlist) => (
                  <label
                    key={playlist.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlaylists.has(playlist.id)}
                      onChange={() => togglePlaylist(playlist.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{playlist.name}</p>
                      <p className="text-sm text-text-secondary">{playlist.questionCount} soru</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Yeni Liste Oluşturma */}
              {!showNewPlaylistInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewPlaylistInput(true)}
                  className="w-full mb-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Liste Oluştur
                </Button>
              ) : (
                <div className="mb-4 p-3 bg-surface rounded-lg border border-border">
                  <input
                    type="text"
                    placeholder="Liste adı..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreatePlaylist}
                      disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                      className="flex-1"
                    >
                      {isCreatingPlaylist ? 'Oluşturuluyor...' : 'Oluştur'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewPlaylistInput(false);
                        setNewPlaylistName('');
                      }}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToPlaylists}
                  disabled={isSavingToPlaylist}
                  className="flex-1"
                >
                  {isSavingToPlaylist ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPlaylistModal(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
