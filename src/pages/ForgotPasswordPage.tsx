import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { firebaseAuth } from '../firebase/app';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setSuccess(true);
    } catch (err) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/user-not-found') {
        setError('Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.');
      } else if (code === 'auth/invalid-email') {
        setError('Geçerli bir e-posta adresi gir.');
      } else {
        setError('Şifre sıfırlama bağlantısı gönderilemedi. Tekrar dene.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-[#17233B]">Şifremi Unuttum</CardTitle>
          <CardDescription className="text-[#68758B]">
            E-posta adresine şifre sıfırlama bağlantısı göndereceğiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#D64550]/10 border border-[#D64550]/20 rounded-lg">
                <p className="text-sm text-[#D64550]">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-[#159B78]/10 border border-[#159B78]/20 rounded-lg">
                <p className="text-sm text-[#159B78]">
                  Şifre sıfırlama bağlantısı e-posta adresine gönderildi.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#17233B]">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E9F2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4058D8] focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || success}
            >
              {isLoading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
            </Button>

            <div className="text-center text-sm text-[#68758B]">
              <Link to="/login" className="text-[#4058D8] hover:text-[#3347B7] font-medium">
                Giriş Sayfasına Dön
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
