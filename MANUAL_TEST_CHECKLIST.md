# Manuel Test Listesi

Web uygulamasının tüm kritik özelliklerini manuel olarak test etmek için kullanın.

---

## Test Ortamı Hazırlığı

- [ ] Firebase bağlantısı aktif
- [ ] Test kullanıcısı oluşturulmuş
- [ ] Firestore'da test verileri mevcut (dersler, konular, sorular)
- [ ] Tarayıcı konsolu açık (hata kontrolü için)

---

## 1. Kimlik Doğrulama

### Kayıt Olma
- [ ] E-posta geçerli formatta kontrol edilir
- [ ] Şifre minimum uzunluk kontrolü
- [ ] Şifre onayı şifre ile eşleşir
- [ ] Zaten kayıtlı e-posta için hata mesajı
- [ ] Başarılı kayıt sonrası otomatik giriş
- [ ] Başarılı kayıt sonrası HomePage'e yönlendirme

### Giriş Yapma
- [ ] Geçersiz e-posta için hata mesajı
- [ ] Geçersiz şifre için hata mesajı
- [ ] Başarılı giriş sonrası HomePage'e yönlendirme
- [ ] Profil bilgisi yüklenir
- [ ] Giriş durumu context'e kaydedilir

### Çıkış Yapma
- [ ] Çıkış butonu çalışır
- [ ] Firebase'den oturum kapatılır
- [ ] Context temizlenir
- [ ] LoginPage'e yönlendirilir

### Şifre Sıfırlama
- [ ] Geçersiz e-posta için hata mesajı
- [ ] Geçerli e-posta için sıfırlama e-postası gönderilir
- [ ] Başarı mesajı gösterilir

---

## 2. Soru Çözme

### Quiz Yükleme
- [ ] Topic'ten soru çekme
- [ ] Playlist'ten soru çekme
- [ ] Soru yoksa uygun hata mesajı
- [ ] Loading spinner gösterilir
- [ ] Hata durumunda "Tekrar Dene" butonu

### Soru Görüntüleme
- [ ] Soru metni doğru gösterilir
- [ ] Şıklar (A, B, C, D, E) doğru gösterilir
- [ ] Source badge gösterilir (varsa)
- [ ] Progress indicator (örn: "1 / 20")
- [ ] Doğru sayısı header'da gösterilir

### Cevap Verme
- [ ] Şık seçilebilir
- [ ] Cevap verince çözüm açılır
- [ ] Doğru şık yeşil renk
- [ ] Yanlış şık kırmızı renk
- [ ] Seçilen şık (yanlışsa) kırmızı border
- [ ] Progress Firestore'a kaydedilir
- [ ] İstatistikler güncellenir (daily, weekly, streak)

### Navigasyon
- [ ] Next butonu çalışır
- [ ] Previous butonu çalışır
- [ ] Son soruda "Bitir" butonu görünür
- [ ] Cevap verilmeden Next çalışmaz
- [ ] Quiz bitince sonuç sayfasına gidilir

### Quiz Sonuçları
- [ ] Başarı oranı doğru hesaplanır
- [ ] Doğru sayısı doğru gösterilir
- [ ] Yanlış sayısı doğru gösterilir
- [ ] "Tekrar Çöz" butonu çalışır
- [ ] "Konulara Dön" link'i çalışır
- [ ] Son quiz ID'leri localStorage'a kaydedilir

### Listeye Ekleme
- [ ] Modal açılır
- [ ] Mevcut listeler gösterilir
- [ ] Sorunun olduğu listeler işaretli
- [ ] Listeye ekleme çalışır
- [ ] Listeden kaldırma çalışır
- [ ] Yeni liste oluşturma çalışır (modal içinde)
- [ ] Modal kapanır

---

## 3. İstatistikler

### Genel Yükleme
- [ ] İstatistikler yüklenir
- [ ] Loading spinner gösterilir
- [ ] Hata durumunda "Tekrar Dene" butonu

### Hata Durumu (Yeni!)
- [ ] Firebase hatası olduğunda "İstatistikler yüklenemedi" uyarısı görünür
- [ ] Uyarıda "Tekrar Dene" butonu çalışır
- [ ] Sıfır istatistik gibi gösterilmez
- [ ] loadError alanı doğru çalışır

### Günlük İstatistikler
- [ ] Bugün çözülen soru sayısı doğru
- [ ] Doğru sayısı doğru
- [ ] Yanlış sayısı doğru
- [ ] Hedef doğru gösterilir
- [ ] Hedefe ulaşıldıysa görsel işaret

### Haftalık İstatistikler
- [ ] Bu hafta çözülen soru sayısı doğru
- [ ] Doğru sayısı doğru
- [ ] Yanlış sayısı doğru
- [ ] Hedef doğru gösterilir

### Ders İstatistikleri
- [ ] Toplam çözüm sayısı doğru
- [ ] Doğru sayısı doğru
- [ ] Yanlış sayısı doğru
- [ ] Başarı oranı doğru hesaplanır
- [ ] Yanlış oranı doğru hesaplanır
- [ ] loadError alanı doğru çalışır

### Streak
- [ ] Mevcut seri doğru gösterilir
- [ ] En uzun seri doğru gösterilir
- [ ] Aynı gün tekrar soru çözülürse değişmez
- [ ] Dün çalışıldıysa +1 artar
- [ ] Dün çalışılmadıysa 1 olur
- [ ] loadError alanı doğru çalışır

### Zayıf Konular
- [ ] Minimum 5 soru eşiği uygulanır
- [ ] Yanlış oranına göre sıralı (yüksekten düşüğe)
- [ ] Öncelik etiketi doğru (high/medium/low)
- [ ] Öneri metni gösterilir
- [ ] Konuya tıklayınca quiz'e gider

### Konu Başarıları
- [ ] Her konu için doğru toplam gösterilir
- [ ] Doğru/yanlış sayıları doğru
- [ ] Doğru oranı doğru hesaplanır
- [ ] Yanlış oranı doğru hesaplanır
- [ **]** topicId eksik kayıtlar için uyarı görünür (YENİ!)
- [ **]** Uyarıda soru sayısı gösterilir (YENİ!)
- [ **]** "Mobil uygulamadan çözüldü" açıklaması görünür (YENİ!)

### Genel Öneri
- [ ] Zayıf konular yoksa genel öneri gösterilir
- [ ] Zayıf konular varsa en çok yanlış yapılanlar gösterilir

---

## 4. Eşzamanlı İşlemler (Yeni!)

### Senaryo: 2 Sekmede Aynı Anda Soru Çözme
1. İki sekme açın
2. Her iki sekmede de aynı kullanıcı ile giriş yapın
3. İki sekmede de aynı anda soru çözmeye başlayın
4. Her iki işlemi de tamamlayın
5. İstatistikler sayfasına gidin

**Beklenen Sonuç:**
- [ ] 2 cevap kaybedilmeden toplam = 2
- [ ] Doğru/yanlış sayıları doğru
- [ ] race condition yok
- [ ] Veri kaybı yok

### Senaryo: Aynı Soruyu Hızlıca Tekrar Çözme
1. Bir soruyu çözün
2. Hemen aynı soruyu tekrar çözün (refresh veya yeni quiz)
3. İstatistikler sayfasına gidin

**Beklenen Sonuç:**
- [ ] attemptCount = 2 (tekrar dahil)
- [ ] Her iki cevap kaydedilir
- [ ] Veri kaybı yok

---

## 5. Dersler ve Konular

### Ders Listesi
- [ ] Dersler Firestore'dan yüklenir
- [ ] Loading spinner gösterilir
- [ ] Hata durumunda "Tekrar Dene" butonu
- [ ] Türkçe sıralama (localeCompare)
- [ ] Ders seçince konulara gidilir

### Konu Listesi
- [ ] Konular Firestore'dan yüklenir
- [ ] Loading spinner gösterilir
- [ ] Hata durumunda "Tekrar Dene" butonu
- [ ] Order bazlı sıralama
- [ ] Türkçe sıralama (localeCompare)
- [ ] Konu seçince quiz'e gidilir
- [ ] "Derslere Dön" link'i çalışır

---

## 6. Listeler

### Liste Listesi
- [ ] Listeler Firestore'dan yüklenir
- [ ] Loading spinner gösterilir
- [ ] Hata durumunda "Tekrar Dene" butonu
- [ ] Yeni liste oluşturma (inline form)
- [ ] Liste silme (sadece user listeleri)
- [ ] Listeden soru çözme
- [ ] Soru sayısı gösterilir

### Playlist Modal
- [ ] Modal açılır
- [ ] Mevcut listeler gösterilir
- [ ] Sorunun olduğu listeler işaretli
- [ ] Listeye ekleme çalışır
- [ ] Listeden kaldırma çalışır
- [ ] Yeni liste oluşturma (modal içinde)
- [ ] Modal kapanır

---

## 7. Deneme Sınavları

### Deneme Listesi
- [ ] Denemeler Firestore'dan yüklenir
- [ ] Loading spinner gösterilir
- [ ] Hata durumunda "Tekrar Dene" butonu
- [ ] Deneme detayları gösterilir
- [ ] Deneme başlatma butonu

### Deneme Çözme
- [ ] Geri sayım sayacı çalışır
- [ ] Sorular yüklenir
- [ ] Cevaplar kaydedilir (Map ile)
- [ ] Soru navigatörü çalışır
- [ ] Cevaplanan sorular yeşil
- [ ] Next/Previous butonları çalışır
- [ ] "Sınavı Bitir" butonu (son soruda)
- [ ] "Sınavı Erken Bitir" butonu (her zaman)
- [ ] Cevaplar gizli (bitene kadar)
- [ ] Sonuçlar Firestore'a kaydedilir

### Deneme Sonuçları
- [ ] Sonuç özeti doğru (doğru, yanlış, boş, başarı oranı)
- [ ] Soruları inceleme çalışır
- [ ] Şıklar renkli (doğru yeşil, yanlış kırmızı, boş sarı)
- [ ] Çözüm gösterilir
- [ ] Geri dönüş link'i çalışır

---

## 8. Responsive Tasarım

### Mobil (360×800)
- [ ] Header'da geri butonu görünür
- [ ] İstatistik kartları tek sütun
- [ ] Soru metni okunabilir
- [ ] Şıklar tıklanabilir
- [ ] Modal tam ekran

### Tablet (768×1024)
- [ ] İstatistik kartları 2 sütun
- [ ] Soru metni okunabilir
- [ ] Şıklar tıklanabilir

### Masaüstü (1280×800, 1440×900)
- [ ] İstatistik kartları 2 sütun
- [ ] Konu listesi 4 sütun
- [ ] Tüm bileşenler düzgün hizalanmış

---

## 9. Hata Yönetimi

### Network Hatası
- [ ] Offline durumda uygun hata mesajı
- [ ] "Tekrar Dene" butonu çalışır

### Firebase Hatası
- [ ] İzin hatası için uygun mesaj
- [ ] "Tekrar Dene" butonu çalışır

### Boş Veri
- [ ] Henüz ders yoksa uygun mesaj
- [ ] Henüz konu yoksa uygun mesaj
- [ ] Henüz soru yoksa uygun mesaj
- [ ] Henüz liste yoksa uygun mesaj

---

## 10. Performans

### Sayfa Yükleme
- [ ] HomePage < 2 saniye
- [ ] Dersler sayfası < 2 saniye
- [ ] Konular sayfası < 2 saniye
- [ ] Quiz sayfası < 2 saniye
- [ ] İstatistikler sayfası < 3 saniye

### Bundle Size
- [ ] Gzip'lenmiş bundle < 300 KB
- [ ] CSS < 20 KB (gzip)

---

## Test Sonuçları

### Başarılı Testler
- (Liste)

### Başarısız Testler
- (Liste)

### Düzeltilmesi Gerekenler
- (Liste)

---

## Notlar

- Her test senaryosunu tek tek çalıştırın
- Hata olursa tarayıcı konsolunu kontrol edin
- Firebase Console'dan verileri doğrulayın
- Screenshot veya video alarak kaydedin
