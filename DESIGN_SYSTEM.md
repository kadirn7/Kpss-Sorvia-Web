# KPSS Sorvia - Web Tasarım Sistemi

## Genel Bakış

KPSS Sorvia web uygulaması için modern, premium ve akademik bir tasarım sistemi. Bu sistem, kullanıcıların uzun süre kullanacağı ciddi ve güven veren bir sınav hazırlık platformu sunmayı hedefler.

## Tasarım Prensipleri

1. **Sadelik**: Gereksiz animasyonlar, gradientler ve görsel efektlerden kaçınma
2. **Okunabilirlik**: Temiz tipografi ve yeterli boşluk
3. **Tutarlılık**: Tüm bileşenlerde aynı tasarım kuralları
4. **Erişilebilirlik**: Net kontrast ve kolay kullanım
5. **Performans**: Hızlı yüklenen, optimize edilmiş tasarım

## Renk Paleti

### Ana Renkler

| Renk | Hex | Kullanım Alanı |
|------|-----|----------------|
| Arka Plan | `#F6F8FC` | Ana sayfa arka planı |
| Yüzey | `#FFFFFF` | Kartlar, modallar, navigasyon |
| Birincil Metin | `#17233B` | Başlıklar, ana metinler |
| İkincil Metin | `#68758B` | Açıklamalar, ikincil bilgiler |
| Kenarlık | `#E5E9F2` | Kart kenarları, ayrımcılar |

### Vurgu Renkleri

| Renk | Hex | Kullanım Alanı |
|------|-----|----------------|
| Birincil | `#4058D8` | Ana butonlar, vurgular |
| Birincil Hover | `#3347B7` | Buton hover durumu |
| Başarı | `#159B78` | Doğru cevaplar, başarı durumları |
| Hata | `#D64550` | Yanlış cevaplar, hata durumları |
| Uyarı | `#C88420` | Uyarı mesajları, dikkat gerektiren durumlar |

## Tipografi

### Font Ailesi

- **Ana Font**: Inter (Google Fonts)
- **Fallback**: system-ui, sans-serif

### Font Boyutları

| Boyut | Kullanım |
|-------|----------|
| 32px (text-2xl) | Ana sayfa başlıkları |
| 24px (text-xl) | Sayfa başlıkları |
| 18px (text-lg) | Kart başlıkları, soru metinleri |
| 16px (text-base) | Standart metinler |
| 14px (text-sm) | İkincil bilgiler, açıklamalar |
| 12px (text-xs) | Badge metinleri, küçük etiketler |

### Font Ağırlıkları

- **Regular (400)**: Standart metinler
- **Medium (500)**: Alt başlıklar
- **Semibold (600)**: Başlıklar, vurgular
- **Bold (700)**: Önemli sayılar, istatistikler

## Boşluk Sistemi

| Birim | Kullanım |
|-------|----------|
| 4px (1) | İç boşluklar |
| 8px (2) | Küçük bileşen boşlukları |
| 12px (3) | Kart içi boşluklar |
| 16px (4) | Standart boşluklar |
| 24px (6) | Bölüm araları |
| 32px (8) | Büyük bölüm araları |

## Kenar Yuvarlaklığı

| Boyut | Değer | Kullanım |
|-------|-------|----------|
| sm | 6px | Küçük butonlar, badge'ler |
| md | 8px | Standart butonlar |
| lg | 12px | Kartlar |
| xl | 16px | Büyük kartlar, modallar |

## Gölgeler

| Gölge | Kullanım |
|-------|----------|
| card | Standart kartlar |
| card-hover | Kart hover durumu |

## Bileşenler

### Button

**Variant'lar:**
- `primary`: Ana eylemler
- `secondary`: İkincil eylemler
- `outline`: Kenarlıklı butonlar
- `ghost`: Arkasız butonlar

**Boyutlar:**
- `sm`: Küçük butonlar (32px yükseklik)
- `md`: Standart butonlar (40px yükseklik)
- `lg`: Büyük butonlar (48px yükseklik)

### Card

**Sınıflar:**
- `card`: Standart kart görünümü
- `card-hover`: Hover durumu

**Alt Bileşenler:**
- `CardHeader`: Kart başlığı
- `CardTitle`: Kart başlık metni
- `CardDescription`: Kart açıklama metni
- `CardContent`: Kart içeriği
- `CardFooter`: Kart alt kısmı

### Badge

**Variant'lar:**
- `default`: Standart durum
- `success`: Başarı durumu
- `error`: Hata durumu
- `warning`: Uyarı durumu

## Responsive Tasarım

### Breakpoint'ler

| Breakpoint | Genişlik | Kullanım |
|------------|---------|----------|
| sm | 640px | Küçük tabletler |
| md | 768px | Tabletler |
| lg | 1024px | Küçük masaüstü |
| xl | 1280px | Standart masaüstü |

### Grid Sistemleri

- `grid-cols-1`: Mobil (tek sütun)
- `sm:grid-cols-2`: Küçük tablet (2 sütun)
- `lg:grid-cols-4`: Masaüstü (4 sütun)

## Navigasyon

### Header

- Sabit üst navigasyon
- Logo ve menü linkleri
- Mobilde gizli, masaüstünde görünür

### Bottom Navigation (Mobile)

- Sabit alt navigasyon
- Sadece mobilde görünür
- 4 ana menü öğesi

## Form Bileşenleri

TODO: Form bileşenleri (input, select, checkbox, radio)

## Modal Bileşenleri

TODO: Modal ve drawer bileşenleri

## İkonlar

Lucide React ikon kütüphanesi kullanılır. Tutarlı boyut ve stil için:
- Küçük ikonlar: 16px (w-4 h-4)
- Standart ikonlar: 20px (w-5 h-5)
- Büyük ikonlar: 24px (w-6 h-6)

## Durumlar

### Loading

TODO: Loading spinner ve skeleton

### Empty State

TODO: Boş durum bileşeni

### Error State

TODO: Hata durumu bileşeni

## Erişilebilirlik

- WCAG AA standardına uygun kontrast oranları
- Klavye navigasyonu desteği
- Screen reader dostu etiketler
- Odak yönetimi

## Tarayıcı Desteği

- Chrome (son 2 sürüm)
- Firefox (son 2 sürüm)
- Safari (son 2 sürüm)
- Edge (son 2 sürüm)

## Performans

- CSS optimize edildi
- İkonlar tree-shake edildi
- Bundle size: ~240 KB (gzip: ~74 KB)
- Build süresi: ~27 saniye
