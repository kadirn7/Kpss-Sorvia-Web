import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ListTodo, Plus, FolderOpen, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ErrorState } from '../components/ui/error-state';
import { EmptyState } from '../components/ui/empty-state';
import { Input } from '../components/ui/input';
import type { Playlist } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchUserPlaylists, createUserPlaylist, deletePlaylist, ensureDefaultPlaylists } from '../services/playlistService';

export default function PlaylistsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadPlaylists() {
      if (!user) {
        setError('Giriş yapmalısınız.');
        setIsLoading(false);
        return;
      }

      try {
        await ensureDefaultPlaylists(user.uid);
        const data = await fetchUserPlaylists(user.uid);
        setPlaylists(data);
      } catch (err) {
        setError('Listeler yüklenemedi. Tekrar dene.');
        console.error('Error loading playlists:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPlaylists();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newListName.trim()) return;

    setIsCreating(true);
    try {
      await createUserPlaylist(user.uid, newListName.trim());
      setNewListName('');
      setShowCreateForm(false);
      const data = await fetchUserPlaylists(user.uid);
      setPlaylists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste oluşturulamadı.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm('Bu listeyi silmek istediğinizden emin misiniz?')) return;

    try {
      await deletePlaylist(playlistId);
      const data = await fetchUserPlaylists(user?.uid || '');
      setPlaylists(data);
    } catch (err) {
      setError('Liste silinemedi.');
      console.error('Error deleting playlist:', err);
    }
  };

  const handleSolve = (playlist: Playlist) => {
    // Quiz sayfasına yönlendir
    navigate(`/quiz?source=playlist&playlistId=${playlist.id}`);
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
            <h1 className="text-lg font-semibold text-text-primary">Listelerim</h1>
            <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Liste
            </Button>
          </div>
        </div>
      </header>

      {/* Create Form */}
      {showCreateForm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Liste adı..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                />
                <Button onClick={handleCreate} disabled={isCreating || !newListName.trim()}>
                  {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {playlists.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-16 h-16 text-text-secondary" />}
            title="Henüz listeniz yok"
            description="Kişisel soru listeleri oluşturarak sorularınızı organize edebilirsiniz"
            action={
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                İlk Listeni Oluştur
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">{playlist.name}</h3>
                      <Badge variant="default" className="text-xs">
                        {playlist.kind === 'user' ? 'Kişisel' : playlist.kind === 'hard' ? 'Zor' : 'Tekrar'}
                      </Badge>
                    </div>
                    {playlist.kind === 'user' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(playlist.id)}
                        className="text-error hover:text-error hover:bg-error/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>{playlist.questionCount} soru</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSolve(playlist)}
                      disabled={playlist.questionCount === 0}
                    >
                      <ListTodo className="w-4 h-4 mr-1" />
                      Çöz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
