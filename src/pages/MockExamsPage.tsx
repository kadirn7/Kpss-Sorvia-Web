import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, Play } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorState } from '../components/ui/error-state';
import { EmptyState } from '../components/ui/empty-state';
import type { MockExam } from '../types';
import { fetchMockExams } from '../services/mockExamService';
import { useAuth } from '../context/AuthContext';

export default function MockExamsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<MockExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadExams() {
      if (!user) {
        setError('Giriş yapmalısınız.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchMockExams();
        setExams(data);
      } catch (err) {
        setError('Denemeler yüklenemedi. Tekrar dene.');
        console.error('Error loading exams:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadExams();
  }, [user]);

  const handleStartExam = (exam: MockExam) => {
    navigate(`/mock-exam/${exam.id}/solve`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
            <h1 className="text-lg font-semibold text-text-primary">Deneme Sınavları</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {exams.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16 text-text-secondary" />}
            title="Henüz deneme sınavı yok"
            description="Deneme sınavları eklendiğinde burada görünecek"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-text-primary mb-2">{exam.title}</h3>
                    <Badge variant="outline" className="text-xs mb-2">
                      {exam.lessonName}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{exam.questionCount} soru</span>
                    </div>
                    {exam.durationMinutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{exam.durationMinutes} dk</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleStartExam(exam)}
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Başla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
