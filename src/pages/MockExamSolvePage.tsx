import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import type { MockExam, MockExamQuestion, CorrectOption } from '../types';
import { fetchMockExam, fetchMockExamQuestions, createMockExamResult, updateMockExamResult } from '../services/mockExamService';
import { useAuth } from '../context/AuthContext';

const OPTIONS: CorrectOption[] = ['A', 'B', 'C', 'D', 'E'];

function optionText(question: MockExamQuestion, option: CorrectOption): string {
  switch (option) {
    case 'A':
      return question.optionA;
    case 'B':
      return question.optionB;
    case 'C':
      return question.optionC;
    case 'D':
      return question.optionD;
    case 'E':
      return question.optionE;
  }
}

export default function MockExamSolvePage() {
  const { user } = useAuth();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<MockExam | null>(null);
  const [questions, setQuestions] = useState<MockExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Map<string, CorrectOption>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultId, setResultId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];
  const selected = answers.get(currentQuestion?.id || '');

  useEffect(() => {
    async function loadExam() {
      if (!examId || !user) {
        setError('Deneme veya kullanıcı bulunamadı.');
        setIsLoading(false);
        return;
      }

      try {
        const examData = await fetchMockExam(examId);
        if (!examData) {
          setError('Deneme bulunamadı.');
          setIsLoading(false);
          return;
        }

        setExam(examData);
        setTimeLeft((examData.durationMinutes || 60) * 60); // saniye cinsinden

        const questionsData = await fetchMockExamQuestions(examId);
        setQuestions(questionsData);

        // Deneme sonucunu oluştur
        const resultId = await createMockExamResult({
          userId: user.uid,
          examId: examId,
          examTitle: examData.title,
          lessonId: examData.lessonId,
          lessonName: examData.lessonName,
          correctCount: 0,
          wrongCount: 0,
          emptyCount: questionsData.length,
          totalQuestions: questionsData.length,
          percentage: 0,
          durationMinutes: examData.durationMinutes,
          startedAt: new Date().toISOString(),
          completedAt: null,
          answers: [],
        });
        setResultId(resultId);
      } catch (err) {
        setError('Deneme yüklenemedi. Tekrar dene.');
        console.error('Error loading exam:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadExam();
  }, [examId, user]);

  // Sayaç
  useEffect(() => {
    if (timeLeft <= 0 || !isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading]);

  const handleSelect = (option: CorrectOption) => {
    if (!currentQuestion) return;

    setAnswers((prev) => new Map(prev).set(currentQuestion.id, option));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!exam || !resultId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Sonuçları hesapla
      let correctCount = 0;
      let wrongCount = 0;
      const examAnswers = questions.map((q) => {
        const userAnswer = answers.get(q.id);
        const isCorrect = userAnswer === q.correctOption;
        const isEmpty = !userAnswer;

        if (isEmpty) {
          return {
            questionId: q.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE,
            userAnswer: null,
            correctAnswer: q.correctOption,
            isCorrect: false,
            isEmpty: true,
            solution: q.solution,
          };
        }

        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }

        return {
          questionId: q.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE,
          userAnswer: userAnswer || null,
          correctAnswer: q.correctOption,
          isCorrect,
          isEmpty: false,
          solution: q.solution,
        };
      });

      const emptyCount = questions.length - correctCount - wrongCount;
      const percentage = Math.round((correctCount / questions.length) * 100);

      await updateMockExamResult(resultId, {
        correctCount,
        wrongCount,
        emptyCount,
        percentage,
        completedAt: new Date().toISOString(),
        answers: examAnswers,
      });

      navigate(`/mock-exam/${resultId}/result`);
    } catch (err) {
      setError('Sonuç kaydedilemedi. Tekrar dene.');
      console.error('Error submitting exam:', err);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <Link to="/mock-exams" className="text-[#4058D8] hover:text-[#3347B7] font-medium">
            Denemelere Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#D64550] mb-4">Soru bulunamadı.</p>
          <Link to="/mock-exams" className="text-[#4058D8] hover:text-[#3347B7] font-medium">
            Denemelere Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/mock-exams" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Denemelere Dön</span>
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant={timeLeft < 300 ? 'error' : 'default'}>
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="default">
                {currentIndex + 1} / {questions.length}
              </Badge>
              <Badge variant="default">
                Cevaplanan: {answers.size}
              </Badge>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Navigator */}
        <div className="mb-4 p-4 bg-surface rounded-lg border border-border">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => {
              const isAnswered = answers.has(questions[index].id);
              const isCurrent = index === currentIndex;

              let className = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all';
              if (isCurrent) {
                className += ' bg-primary text-white';
              } else if (isAnswered) {
                className += ' bg-success/10 text-success border border-success';
              } else {
                className += ' bg-background text-text-secondary border border-border hover:border-primary';
              }

              return (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={className}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Question */}
            <div className="mb-8">
              <Badge variant="outline" className="mb-2">
                Soru {currentIndex + 1}
              </Badge>
              <p className="text-lg leading-relaxed text-text-primary whitespace-pre-line">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {OPTIONS.map((option) => {
                const isSelected = selected === option;

                let className = 'w-full text-left p-4 rounded-lg border-2 transition-all';
                if (isSelected) {
                  className += ' border-primary bg-primary/10';
                } else {
                  className += ' border-border hover:border-primary/50 bg-surface';
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={className}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-text-primary">{option})</span>
                      <span className="text-text-primary flex-1">{optionText(currentQuestion, option)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Source */}
            {currentQuestion.source && (
              <div className="mb-6">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.source}
                </Badge>
              </div>
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
                className="flex-1"
              >
                {currentIndex === questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki'}
              </Button>
            </div>

            {/* Finish Exam Button */}
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Sınavı Erken Bitir'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
