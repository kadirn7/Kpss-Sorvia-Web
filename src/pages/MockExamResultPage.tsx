import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { MockExamResult, CorrectOption } from '../types';
import { fetchMockExamResult, fetchMockExamQuestions } from '../services/mockExamService';

const OPTIONS: CorrectOption[] = ['A', 'B', 'C', 'D', 'E'];

function optionText(question: any, option: CorrectOption): string {
  switch (option) {
    case 'A':
      return question.optionA || '';
    case 'B':
      return question.optionB || '';
    case 'C':
      return question.optionC || '';
    case 'D':
      return question.optionD || '';
    case 'E':
      return question.optionE || '';
  }
}

export default function MockExamResultPage() {
  const { resultId } = useParams<{ resultId: string }>();

  const [result, setResult] = useState<MockExamResult | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResult() {
      if (!resultId) {
        setError('Sonuç bulunamadı.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchMockExamResult(resultId);
        if (!data) {
          setError('Sonuç bulunamadı.');
          setIsLoading(false);
          return;
        }
        setResult(data);

        // Soruları yükle
        const examQuestions = await fetchMockExamQuestions(data.examId);
        setQuestions(examQuestions);
      } catch (err) {
        setError('Sonuç yüklenemedi. Tekrar dene.');
        console.error('Error loading result:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResult();
  }, [resultId]);

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

  if (error || !result) {
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/mock-exams" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Denemelere Dön</span>
            </Link>
            <h1 className="text-lg font-semibold text-text-primary">{result.examTitle}</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Deneme Sonucu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-5xl font-bold text-text-primary mb-2">{result.percentage}%</p>
              <p className="text-text-secondary">Başarı Oranı</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{result.correctCount}</p>
                <p className="text-sm text-text-secondary">Doğru</p>
              </div>
              <div className="text-center p-4 bg-error/10 rounded-lg">
                <p className="text-2xl font-bold text-error">{result.wrongCount}</p>
                <p className="text-sm text-text-secondary">Yanlış</p>
              </div>
              <div className="text-center p-4 bg-warning/10 rounded-lg">
                <p className="text-2xl font-bold text-warning">{result.emptyCount}</p>
                <p className="text-sm text-text-secondary">Boş</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">Soruları İncele</h2>
        <div className="space-y-6">
          {result.answers.map((answer, index) => {
            const question = questions.find((q) => q.id === answer.questionId);

            return (
              <Card key={answer.questionId}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Badge
                      variant={answer.isCorrect ? 'success' : answer.isEmpty ? 'warning' : 'error'}
                      className="mb-2"
                    >
                      Soru {index + 1}
                    </Badge>
                    <p className="text-lg leading-relaxed text-text-primary whitespace-pre-line">
                      {question?.questionText || `Soru ${index + 1}`}
                    </p>
                    <p className="text-sm text-text-secondary mt-2">
                      Cevabınız: {answer.userAnswer || '-'} · Doğru Cevap: {answer.correctAnswer}
                    </p>
                  </div>

                  {/* Options */}
                  {question && (
                    <div className="space-y-3 mb-4">
                      {OPTIONS.map((option) => {
                        const isUserAnswer = answer.userAnswer === option;
                        const isCorrectAnswer = answer.correctAnswer === option;

                        let className = 'w-full text-left p-4 rounded-lg border-2 transition-all';
                        if (isCorrectAnswer) {
                          className += ' border-success bg-success/10';
                        } else if (isUserAnswer && !answer.isCorrect) {
                          className += ' border-error bg-error/10';
                        } else {
                          className += ' border-border bg-surface';
                        }

                        return (
                          <div key={option} className={className}>
                            <div className="flex items-start gap-3">
                              <span className="font-semibold text-text-primary">{option})</span>
                              <span className="text-text-primary flex-1">{optionText(question, option)}</span>
                              {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />}
                              {isUserAnswer && !answer.isCorrect && <XCircle className="w-5 h-5 text-error flex-shrink-0" />}
                              {answer.isEmpty && option === answer.correctAnswer && <Circle className="w-5 h-5 text-warning flex-shrink-0" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {answer.solution && (
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                      <p className="font-semibold text-success mb-1">Çözüm:</p>
                      <p className="text-text-primary text-sm">{answer.solution}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
