# KPSS Sorvia - Web Tasarım Prototipi

KPSS Sorvia için modern, premium ve akademik bir web tasarım prototipi. Bu prototip, gerçek Firebase entegrasyonu olmadan tasarım sistemini ve kullanıcı deneyimini değerlendirmek için oluşturulmuştur.

## Özellikler

### Tasarım Sistemi
- **Modern ve Premium**: Inter font, temiz renk paleti, özenli spacing
- **shadcn/ui Altyapısı**: Özelleştirilebilir React bileşenleri
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu
- **Tutarlı Bileşenler**: Button, Card, Badge vb. yeniden kullanılabilir bileşenler

### Ekranlar
1. **Ana Sayfa**: Günlük hedef, dersler, hızlı erişim
2. **Dersler**: Ders listesi ve ilerleme
3. **Konular**: Konu listesi ve soru sayıları
4. **Soru Çözme**: 1 sayfa 1 soru quiz sistemi
5. **Listeler**: Kişisel soru listeleri
6. **İstatistikler**: Başarı oranları ve zayıf konular

### Demo Veriler
- 4 ders (Tarih, Coğrafya, Eğitim Bilimleri, Türkçe)
- 10 konu (Tarih dersinde)
- 5 örnek soru
- 4 liste
- Günlük istatistikler

## Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn

### Adımlar

1. Bağımlılıkları yükle:
```bash
npm install
```

2. Development server'ı başlat:
```bash
npm run dev
```

3. Tarayıcıda aç:
```
http://localhost:5173
```

## Kullanım

### Navigasyon
- **Ana Sayfa**: `/`
- **Dersler**: `/lessons`
- **Konular**: `/lessons/:lessonId/topics`
- **Quiz**: `/quiz?topicId=:topicId&lessonId=:lessonId`
- **Listeler**: `/playlists`
- **İstatistikler**: `/statistics`

### Demo İşlevleri
- Tüm navigasyon çalışır
- Soru seçimi ve geri bildirim çalışır
- Quiz tamamlama ve sonuç görüntüleme çalışır
- Progress bar'lar ve istatistikler interaktif

**Not**: Bu prototip mock veriler kullanır. Gerçek Firebase verisi veya kullanıcı kaydı yoktur.

## Build

Production build için:
```bash
npm run build
```

Build çıktısı `dist/` klasöründe oluşur.

## Teknoloji Stack

- **React 18.3.1**: UI kütüphanesi
- **TypeScript 5.6.2**: Tip güvenliği
- **Vite 6.4.4**: Build tool
- **Tailwind CSS 3.4.17**: CSS framework
- **React Router 7.1.1**: Navigasyon
- **Lucide React 0.468.0**: İkonlar
- **class-variance-authority**: Bileşen variant yönetimi
- **clsx & tailwind-merge**: Class name yönetimi

## Tasarım Sistemi

Detaylı bilgi için [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) dosyasına bakın.

### Renk Paleti
- Arka Plan: `#F6F8FC`
- Yüzey: `#FFFFFF`
- Birincil Metin: `#17233B`
- İkincil Metin: `#68758B`
- Birincil Vurgu: `#4058D8`
- Başarı: `#159B78`
- Hata: `#D64550`
- Uyarı: `#C88420`

### Tipografi
- Font: Inter (Google Fonts)
- Boyutlar: 12px - 32px
- Ağırlıklar: 400 - 700

## Proje Yapısı

```
web/
├── src/
│   ├── components/ui/    # shadcn/ui bileşenleri
│   ├── data/            # Mock veriler
│   ├── lib/             # Utility fonksiyonları
│   ├── pages/           # Sayfa bileşenleri
│   ├── types/           # TypeScript tipleri
│   ├── App.tsx          # Ana uygulama
│   ├── main.tsx         # Entry point
│   └── index.css        # Global CSS
├── public/              # Statik dosyalar
├── index.html           # HTML template
├── tailwind.config.ts   # Tailwind yapılandırması
├── tsconfig.json        # TypeScript yapılandırması
├── vite.config.ts       # Vite yapılandırması
└── package.json        # Bağımlılıklar
```

## Sonraki Adımlar

Tasarım onaylandıktan sonra:

1. **Firebase Entegrasyonu**
   - Authentication ekle
   - Firestore bağlantısı kur
   - Gerçek verileri kullan

2. **Ek Bileşenler**
   - Form bileşenleri (input, select, checkbox)
   - Modal ve drawer
   - Loading skeleton
   - Empty ve error state

3. **Özellikler**
   - Giriş/kayıt sayfaları
   - Deneme sınavları
   - Soru kaydetme modal'ı
   - Profil ve ayarlar

4. **Mobil Uygulama**
   - Tasarım tokenlarını React Native'e uyarla
   - Aynı tasarım dilini mobilde kullan

## Notlar

- Bu prototip **mobil uygulamayı değiştirmez**
- `frontend/` klasörüne dokunulmaz
- Firebase Security Rules değiştirilmez
- Sadece tasarım değerlendirmesi için kullanılır

## Lisans

Telif Hakkı © 2024 KPSS Sorvia
