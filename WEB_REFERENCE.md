# Web Referans Dokümanı

Bu doküman, web uygulamasının kesinleşmiş davranışlarını, Firestore yapısını ve hesaplama kurallarını içerir. Mobil uygulamanın web ile eşitlenmesi için referans olarak kullanılır.

---

## Firestore Koleksiyonları

### userQuestionProgress
**Açıklama:** Kullanıcının her soru için ilerleme kaydı
**Belge ID:** `{userId}_{questionId}`

| Alan | Tip | Açıklama |
|------|-----|----------|
| userId | string | Kullanıcı ID |
| questionId | string | Soru ID |
| lessonId | string | Ders ID |
| topicId | string | Konu ID (web'de zorunlu, mobil'de null olabilir) |
| attemptCount | number | Toplam çözüm sayısı (tekrar dahil) |
| correctCount | number | Toplam doğru sayısı |
| wrongCount | number | Toplam yanlış sayısı |
| lastAttemptAt | Timestamp | Son çözüm tarihi |
| inWrongQueue | boolean | Yanlış kuyruğunda mı? |
| consecutiveCorrectInQueue | number | Yanlış kuyruğunda üst üste doğru sayısı |

**Önemli:** `attemptCount` = ÇÖZÜM SAYISI (tekil soru sayısı değil)
- Aynı soruyu 3 kez çözen kullanıcı → attemptCount = 3
- Her doğru/yanlış sayısı ayrı ayrı tutuluyor

### userDailyStats
**Açıklama:** Kullanıcının günlük istatistikleri
**Belge ID:** `{userId}_{date}` (örn: `user123_2026-10-10`)

| Alan | Tip | Açıklama |
|------|-----|----------|
| userId | string | Kullanıcı ID |
| date | string | Tarih (YYYY-MM-DD) |
| totalQuestions | number | Toplam soru sayısı (her cevap +1) |
| correctCount | number | Doğru sayısı |
| wrongCount | number | Yanlış sayısı |
| successRate | number | Başarı oranı (%) |
| timeSpentMinutes | number | Harcanan süre (dakika) |
| target | number | Günlük hedef (varsayılan: 20) |
| targetReached | boolean | Hedefe ulaşıldı mı? |
| updatedAt | Timestamp | Son güncelleme tarihi |

**Kural:** Her soru çözüldüğünde `totalQuestions`, `correctCount`, `wrongCount` atomic increment ile artırılır.

### userWeeklyStats
**Açıklama:** Kullanıcının haftalık istatistikleri
**Belge ID:** `{userId}_{weekStart}` (örn: `user123_2026-10-06` - Pazartesi)

| Alan | Tip | Açıklama |
|------|-----|----------|
| userId | string | Kullanıcı ID |
| weekStart | string | Hafta başlangıcı (Pazartesi, YYYY-MM-DD) |
| weekEnd | string | Hafta bitişi (Pazar, YYYY-MM-DD) |
| totalQuestions | number | Toplam soru sayısı |
| correctCount | number | Doğru sayısı |
| wrongCount | number | Yanlış sayısı |
| successRate | number | Başarı oranı (%) |
| averageDailyQuestions | number | Ortalama günlük soru sayısı |
| target | number | Haftalık hedef (varsayılan: 140) |
| targetReached | boolean | Hedefe ulaşıldı mı? |
| updatedAt | Timestamp | Son güncelleme tarihi |

**Kural:** Hafta Pazartesi'den Pazar'a kadar.

### userStreak
**Açıklama:** Kullanıcının seri (streak) bilgisi
**Belge ID:** `{userId}`

| Alan | Tip | Açıklama |
|------|-----|----------|
| userId | string | Kullanıcı ID |
| currentStreak | number | Mevcut seri (gün) |
| longestStreak | number | En uzun seri (gün) |
| lastStudyDate | string | Son çalışma tarihi (YYYY-MM-DD) |
| updatedAt | Timestamp | Son güncelleme tarihi |

**Kural:**
- Aynı gün tekrar soru çözülürse: streak değişmez
- Dün çalışıldıysa: streak +1
- Dün çalışılmadıysa: streak = 1

---

## Soru Çözüm Akışı

### QuizPage'de Cevap Verildiğinde
1. `recordQuestionAttempt()` çağrılır
   - userQuestionProgress kaydı güncellenir (transaction ile)
   - attemptCount, correctCount, wrongCount artırılır
   - inWrongQueue ve consecutiveCorrectInQueue hesaplanır

2. `updateDailyStats()` çağrılır
   - userDailyStats kaydı güncellenir (increment ile)
   - totalQuestions, correctCount, wrongCount atomic increment
   - successRate ve targetReached yeniden hesaplanır

3. `updateWeeklyStats()` çağrılır
   - userWeeklyStats kaydı güncellenir (increment ile)
   - totalQuestions, correctCount, wrongCount atomic increment
   - successRate, averageDailyQuestions, targetReached yeniden hesaplanır

4. `updateStreak()` çağrılır
   - userStreak kaydı güncellenir (transaction ile)
   - currentStreak, longestStreak, lastStudyDate hesaplanır

**Önemli:** Tüm güncellemeler atomic veya transaction ile yapılır. Race condition riski yoktur.

---

## İstatistik Hesaplama Kuralları

### attemptCount Tanımı
- **Tanım:** Toplam ÇÖZÜM SAYISI (tekrar edilen sorular dahil)
- **Örnek:** Aynı soruyu 3 kez çözen kullanıcı → attemptCount = 3
- **Kullanım:**
  - Konu istatistikleri: Σ attemptCount
  - Ders istatistikleri: Σ attemptCount
  - Günlük istatistikler: Her cevap 1 sayılır (çözüm sayısı)
  - Haftalık istatistikler: Her cevap 1 sayılır (çözüm sayısı)

### Başarı Oranı
- **Formül:** `(correctCount / totalAttempts) * 100`
- **Yuvarlama:** `Math.round()`
- **Kontrol:** Doğru + Yanlış ≈ Toplam (±1 hata payı)

### Yanlış Oranı
- **Formül:** `(wrongCount / totalAttempts) * 100`
- **Yuvarlama:** `Math.round()`
- **Kontrol:** Başarı + Yanlış ≈ 100% (±1 hata payı)

---

## Hata Durumları

### Yükleme Hatası
- **Durum:** Firestore sorgusu başarısız olduğunda
- **Çözüm:** Tiplerde `loadError: true` alanı
- **UI:** "İstatistikler yüklenemedi" uyarısı + "Tekrar Dene" butonu
- **Kullanıcı deneyimi:** Hata = sıfır istatistik gibi gösterilmez

### topicId Eksik Kayıtlar
- **Durum:** Sorunun topicId'si yok veya null
- **Tespit:** `getTopicStats()` bilinmeyen konuları sayar
- **UI:** "X sorunun konu bilgisi eksik" uyarısı
- **Açıklama:** "Bu sorular muhtemelen mobil uygulamadan çözüldü"
- **İstatistik:** Konu bazlı istatistiklerde gösterilmez (ancak ders istatistiklerinde dahil edilir)

---

## Eşzamanlı İşlemler

### Atomic Increment
- **Kullanım:** `updateDailyStats()`, `updateWeeklyStats()`
- **Kural:** Firebase `increment()` fonksiyonu
- **Sonuç:** Race condition yok, veri kaybı yok

### Transaction
- **Kullanım:** `recordQuestionAttempt()`, `updateStreak()`
- **Kural:** Firebase `runTransaction()` fonksiyonu
- **Sonuç:** Okuma-yazma işlemi atomik, veri kaybı yok

---

## Mobil Uygulama Farkları (Düzeltilmesi Gereken)

### Koleksiyon Farkları
| Koleksiyon | Web | Mobil | Durum |
|------------|-----|-------|--------|
| userDailyStats | ✅ | ❌ | Mobil'e eklenmeli |
| userWeeklyStats | ✅ | ❌ | Mobil'e eklenmeli |
| userStreak | ✅ | ❌ | Mobil'e eklenmeli |

### ProgressService Parametre Farkı
| Parametre | Web | Mobil | Durum |
|-----------|-----|-------|--------|
| topicId | ✅ | ❌ | Mobil'e eklenmeli |

### Güncelleme Yöntemi Farkı
| Fonksiyon | Web | Mobil | Durum |
|----------|-----|-------|--------|
| recordQuestionAttempt | Transaction | Okuma-yazma | Mobil transaction'a geçmeli |
| updateDailyStats | Increment | Yok | Mobil'e eklenmeli |
| updateWeeklyStats | Increment | Yok | Mobil'e eklenmeli |
| updateStreak | Transaction | Yok | Mobil'e eklenmeli |

---

## Tutarlılık Kontrolleri

### LessonStats Kontrolü
```typescript
const calculatedTotal = correctCount + wrongCount;
if (calculatedTotal !== totalAttempts) {
  console.warn(`⚠️ LessonStats tutarsızlık: doğru+yanlış=${calculatedTotal}, toplam=${totalAttempts}`);
}
```

### Oran Kontrolü
```typescript
const rateSum = successRate + wrongRate;
if (Math.abs(rateSum - 100) > 1) {
  console.warn(`⚠️ LessonStats oran tutarsızlığı: başarı=${successRate}%, yanlış=${wrongRate}%, toplam=${rateSum}%`);
}
```

---

## Veri Migrasyon Notları

### Eski Mobil Kayıtları
- **Durum:** Mobil'den çözülen soruların topicId'si yok
- **Etki:** Konu bazlı istatistiklerde görünmez
- **Çözüm:** Web veri modeli kesinleşdikten sonra değerlendirilecek
- **Seçenekler:**
  1. topicId geriye dönük olarak güncelle (zor)
  2. Eksik topicId'leri manuel ekle (zahmetli)
  3. Eski kayıtları kabul et, sadece yeni kayıtlar için kural uygula (kolay)

---

## Test Senaryoları

### Senaryo 1: Normal Soru Çözümü
1. Kullanıcı giriş yapar
2. Bir konu seçer
3. 5 soru çözer (3 doğru, 2 yanlış)
4. İstatistikler sayfasına gider
5. Beklenen sonuç:
   - Günlük: 5 soru, 3 doğru, 2 yanlış
   - Haftalık: 5 soru, 3 doğru, 2 yanlış
   - Ders: 5 çözüm, 3 doğru, 2 yanlış
   - Konu: 5 çözüm, 3 doğru, 2 yanlış
   - Streak: 1 gün

### Senaryo 2: Aynı Soruyu Tekrar Çözme
1. Kullanıcı aynı konuyu tekrar seçer
2. Aynı soruyu tekrar çözer (yanlış)
3. İstatistikler sayfasına gider
4. Beklenen sonuç:
   - Konu istatistik: attemptCount = 2 (tekrar dahil)
   - Günlük istatistik: totalQuestions = 6 (yeni cevap +1)

### Senaryo 3: Eşzamanlı Çözüm
1. Kullanıcı 2 farklı sekmede aynı anda soru çözer
2. Her iki işlem de tamamlanır
3. İstatistikler sayfasına gider
4. Beklenen sonuç: 2 cevap kaybedilmeden, toplam = 2

### Senaryo 4: topicId Eksik Kayıt
1. Manuel olarak topicId'si olmayan bir progress kaydı oluşturulur
2. İstatistikler sayfasına gider
3. Beklenen sonuç:
   - "X sorunun konu bilgisi eksik" uyarısı görünür
   - Konu bazlı istatistiklerde bu soru görünmez
   - Ders bazlı istatistiklerde bu soru dahil edilir

### Senaryo 5: Firebase Hatası
1. Firebase bağlantısı kesilir
2. İstatistikler sayfasına gidilir
3. Beklenen sonuç:
   - "İstatistikler yüklenemedi" uyarısı görünür
   - "Tekrar Dene" butonu aktif olur
   - Sıfır istatistik gibi gösterilmez

---

## Sabit Değerler

### Constants
```typescript
DAILY_QUESTION_TARGET = 20    // Günlük hedef
WEEKLY_QUESTION_TARGET = 140  // Haftalık hedef
WEAK_TOPIC_MIN_ATTEMPTS = 5   // Zayıf konu için minimum deneme
WRONG_CLEARS_AFTER = 3        // Yanlış kuyruğundan çıkma eşiği
```

---

## Özet

Web uygulaması şu davranışları takip eder:
1. Her soru çözümü 4 yerde kaydedilir: userQuestionProgress, userDailyStats, userWeeklyStats, userStreak
2. Eşzamanlı işlemler atomic increment ve transaction ile korunur
3. Hata durumları kullanıcıya açıkça bildirilir
4. topicId eksik kayıtlar tespit edilir ve raporlanır
5. attemptCount = ÇÖZÜM SAYISI (tekrar dahil)

Mobil uygulama bu davranışları takip etmelidir.
