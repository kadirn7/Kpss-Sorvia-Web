# Güvenlik Dokümantasyonu

## Şifre Güvenliği

### Firebase Authentication
Bu proje Firebase Authentication kullanır ve şifre güvenliği için şu önlemler alınmıştır:

1. **Şifreler asla açıkça saklanmaz**: Firebase Authentication şifreleri hash'leyerek saklar, asla düz metin olarak tutmaz.
2. **Client-side güvenlik**: Şifreler asla client tarafında açıkça görünmez veya loglanmaz.
3. **TLS/SSL**: Firebase tüm iletişimi HTTPS üzerinden şifreler.

### Ek Güvenlik Önlemleri

#### Kayıt Olma Zorunlulukları
Kayıt olurken şifre şu kriterleri sağlamalı:
- En az 8 karakter
- En az bir büyük harf (A-Z)
- En az bir küçük harf (a-z)
- En az bir rakam (0-9)

Bu validasyon `src/pages/RegisterPage.tsx` dosyasında implement edilmiştir.

#### Giriş Sayfası
- Şifre göster/gizle butonu (göz ikonu)
- Güvenli input tipi (`type="password"`)
- Otomatik şifre kaydetme (tarayıcı özelliği, kullanıcı tercihine bağlı)

### Firestore Security Rules
Firestore Security Rules Firebase Console'da yönetilir ve şu kuralları içerir:
- `signedIn()`: Sadece giriş yapmış kullanıcılar veri okuyabilir/yazabilir
- `isSelf()`: Kullanıcılar sadece kendi verilerine erişebilir
- Veri validasyonu sunucu tarafında yapılır

### Best Practices

1. **HTTPS Kullanımı**: Production'da mutlaka HTTPS kullanın
2. **Firebase Emulator**: Geliştirme sırasında Firebase Emulator kullanabilirsiniz
3. **API Key Gizliliği**: Firebase API key'i `.env.local` dosyasında saklanır ve Git'e commit edilmez
4. **Rate Limiting**: Firebase otomatik rate limiting sağlar

### Önemli Notlar

- **Service Account Key**: Bu projede kullanılmaz (güvenlik riski)
- **Admin SDK**: Client-side kullanılmaz, sadece backend'de (varsa)
- **Şifre Sızıntısı**: Firebase Authentication ile şifreler asla sızdırılmaz

### Şifre İfşası Uyarısı

Tarayıcıdan "Şifreleriniz sızdırıldı" uyarısı alırsanız:
1. Bu uyarı tarayıcının kendi veritabanındaki kayıtlı şifrelerle ilgilidir
2. Bu proje ile doğrudan ilişkili değildir
3. Aynı şifreyi farklı sitelerde kullanıyorsanız, bu sitelerden biri sızdırılmış olabilir
4. Her site için farklı, güçlü şifreler kullanın
5. Şifre yöneticisi kullanmayı düşünün

### Daha Fazla Bilgi
- [Firebase Authentication Security](https://firebase.google.com/docs/auth/security)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/rules-structure)
