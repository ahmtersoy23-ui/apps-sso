# SSO Entegrasyon Durum Raporu

**Tarih:** 2026-01-21
**Test Eden:** Ahmet Ersoy
**SSO Portal:** https://apps.iwa.web.tr

---

## Test Sonuçları Özeti

| Uygulama | URL Testi | SSO Entegre? | Durum | Öncelik |
|----------|-----------|--------------|-------|---------|
| **SwiftStock WMS** | ❌ Login sayfasına yönlendiriyor | ❌ Hayır | Entegre edilmeli | 🔴 Yüksek |
| **StockPulse** | ❌ Login sayfasına yönlendiriyor | ❌ Hayır | Entegre edilmeli | 🔴 Yüksek |
| **AmzSellMetrics** | ❌ Login sayfasına yönlendiriyor | ❌ Hayır | Entegre edilmeli | 🔴 Yüksek |
| **PriceLab** | ⚠️ Dashboard'a geri dönüyor | ⚠️ Kısmi | Kontrol gerekli | 🟡 Orta |
| **ManuMaestro** | ⚠️ Dashboard'a geri dönüyor | ⚠️ Kısmi | Kontrol gerekli | 🟡 Orta |

---

## Detaylı Analiz

### 1. ❌ SwiftStock WMS - ENTEGRASİYON YOK

**URL:** https://swiftstock.iwa.web.tr (tahmin)
**PM2 Port:** 3001
**Durum:** Login sayfasına yönlendiriyor - SSO entegre değil

**Sorun:**
- Uygulamanın kendi login sistemi hala aktif
- SSO token kontrolü yapılmıyor
- Mevcut authentication katmanı kaldırılmamış

**Yapılması Gerekenler:**
```bash
✅ Mevcut login sayfasını kaldır
✅ Frontend'te SSO token kontrolü ekle
✅ Backend'te SSO auth middleware ekle
✅ Token yoksa → https://apps.iwa.web.tr'ye yönlendir
✅ Geçerli token varsa → Uygulamaya giriş yap
```

**Örnek Kod (Frontend):**
```typescript
// SwiftStock Frontend - App başlangıcında
useEffect(() => {
  const token = localStorage.getItem('sso_access_token');

  if (!token) {
    // Token yok - SSO'ya yönlendir
    window.location.href = 'https://apps.iwa.web.tr';
    return;
  }

  // Token'ı doğrula
  verifyToken(token, 'swiftstock').then(result => {
    if (!result?.success) {
      window.location.href = 'https://apps.iwa.web.tr';
    }
  });
}, []);
```

---

### 2. ❌ StockPulse - ENTEGRASİYON YOK

**URL:** https://stockpulse.iwa.web.tr (tahmin)
**PM2 Port:** 3010 (Vite SSR)
**Durum:** Login sayfasına yönlendiriyor - SSO entegre değil

**Sorun:**
- Uygulamanın kendi login sistemi hala aktif
- SSO token kontrolü yapılmıyor
- Kullanıcı authentication lokal yapılıyor

**Yapılması Gerekenler:**
Aynı şekilde SSO entegrasyonu eklenmeli (SwiftStock ile aynı adımlar)

---

### 3. ❌ AmzSellMetrics - ENTEGRASİYON YOK

**URL:** https://amzsellmetrics.iwa.web.tr (tahmin)
**PM2 Port:** 3003 (PriceLab Backend ile paylaşımlı)
**Durum:** Login sayfasına yönlendiriyor - SSO entegre değil

**Sorun:**
- Uygulamanın kendi login sistemi hala aktif
- SSO token kontrolü yapılmıyor

**Yapılması Gerekenler:**
Aynı şekilde SSO entegrasyonu eklenmeli

---

### 4. ⚠️ PriceLab - KISMİ ENTEGRASYON

**URL:** https://pricelab.iwa.web.tr
**PM2 Port:** 3003
**Durum:** Portal dashboard'a geri dönüyor

**Olası Senaryolar:**

**A. SSO Entegre AMA Token Geçersiz:**
- Uygulama token kontrolü yapıyor ✅
- Token geçersiz veya yok
- SSO'ya yönlendiriyor ✅
- **Ancak** portal dashboard'a dönüyor (beklenen: PriceLab'a dönmeli)

**B. SSO Entegre AMA Yetki Yok:**
- Token doğrulanıyor ✅
- Kullanıcının PriceLab erişimi yok
- Portal'a geri gönderiyor

**Kontrol Edilmeli:**

```bash
# 1. Admin Console'dan kontrol et
# → Users sekmesinde test kullanıcısının PriceLab erişimi var mı?

# 2. Developer Tools ile kontrol et
# → Console'da hata var mı?
# → Network tab'de hangi istek başarısız oluyor?

# 3. Token doğrulama test et
curl -X POST https://apps.iwa.web.tr/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "PORTAL_TOKEN",
    "app_code": "pricelab"
  }'

# Beklenen: success: true, role: "admin"
```

**Olası Çözüm:**
```typescript
// PriceLab'da redirect mantığını kontrol et
// Yetki yoksa → Portal'a dön ❌
// Yetki yoksa → Hata mesajı göster veya "Access Denied" sayfası ✅
```

---

### 5. ⚠️ ManuMaestro - KISMİ ENTEGRASYON

**URL:** https://manumaestro.iwa.web.tr
**PM2 Port:** 3000 (Next.js)
**Durum:** Portal dashboard'a geri dönüyor

**Aynı durum PriceLab ile - yukarıdaki kontrolleri yap**

---

## Uygulamaların URL'leri (DEPLOYMENT_STATUS.md'den)

Sistemde kayıtlı 5 uygulama var:

1. **AmzSellMetrics** - `amzsellmetrics`
2. **PriceLab** - `pricelab`
3. **StockPulse** - `stockpulse`
4. **ManuMaestro** - `manumaestro`
5. **SwiftStock WMS** - `swiftstock`

---

## Öncelikli Aksiyonlar

### 🔴 Yüksek Öncelik (Login Sayfası Gösterenler)

Bu 3 uygulamanın SSO entegrasyonu **acilen** yapılmalı:

1. **SwiftStock WMS**
2. **StockPulse**
3. **AmzSellMetrics**

**Her biri için:**
```
1. Mevcut login katmanını kaldır (2-3 saat)
2. SSO token kontrolü ekle (1-2 saat)
3. Backend auth middleware ekle (1-2 saat)
4. Test et (1 saat)
─────────────────────────────────────
Toplam: ~1 gün/uygulama
```

### 🟡 Orta Öncelik (Dashboard'a Dönüş Yapanlar)

Bu 2 uygulamanın entegrasyonu **mevcut ama sorunlu**:

1. **PriceLab**
2. **ManuMaestro**

**Kontrol edilmesi gerekenler:**
```
1. Token doğrulama çalışıyor mu?
2. Kullanıcı yetkileri doğru atanmış mı?
3. Redirect mantığı doğru mu?
4. Error handling eksik mi?
─────────────────────────────────────
Toplam: ~4 saat/uygulama
```

---

## Test Senaryoları (Her Uygulama İçin)

### Başarılı SSO Entegrasyonu Kontrolü:

```
✅ Test 1: Token Yokken
   - Uygulama URL'ini aç
   - Beklenen: SSO'ya yönlendir (https://apps.iwa.web.tr)
   - ❌ Beklenmemesi gereken: Kendi login sayfası

✅ Test 2: Geçerli Token Varken
   - SSO'dan login ol
   - Uygulama kartına tıkla
   - Beklenen: Uygulama açılsın, kullanıcı bilgileri görünsün
   - ❌ Beklenmemesi gereken: Tekrar login sayfası

✅ Test 3: Geçersiz Token ile
   - LocalStorage'a geçersiz token ekle
   - Uygulama URL'ini aç
   - Beklenen: SSO'ya yönlendir
   - ❌ Beklenmemesi gereken: Hata mesajı veya boş sayfa

✅ Test 4: Yetkisiz Kullanıcı
   - Kullanıcının erişimi olmayan uygulamayı aç
   - Beklenen: "Access Denied" mesajı veya portal'a dönüş
   - Kullanıcıya açıklayıcı mesaj gösterilmeli

✅ Test 5: Role-Based Access
   - Admin: Tüm özellikler erişilebilir
   - Editor: Delete yapamıyor
   - Viewer: Sadece görüntüleme
```

---

## Teknik Gereksinimler (Her Uygulama İçin)

### Frontend Gereksinimleri:

```typescript
// 1. Token Kontrolü (App.tsx veya _app.tsx)
const checkSSO = async () => {
  const token = localStorage.getItem('sso_access_token');

  if (!token) {
    window.location.href = 'https://apps.iwa.web.tr';
    return;
  }

  const result = await fetch('https://apps.iwa.web.tr/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      app_code: 'YOUR_APP_CODE' // 'swiftstock', 'stockpulse', etc.
    })
  });

  const data = await result.json();

  if (!data.success) {
    window.location.href = 'https://apps.iwa.web.tr';
    return;
  }

  // Kullanıcı bilgilerini state'e kaydet
  setUser(data.data.user);
  setUserRole(data.data.role); // 'admin', 'editor', 'viewer'
};

// 2. Logout Fonksiyonu
const logout = () => {
  localStorage.removeItem('sso_access_token');
  window.location.href = 'https://apps.iwa.web.tr';
};
```

### Backend Gereksinimleri:

```typescript
// 1. SSO Auth Middleware (middleware/sso-auth.ts)
import axios from 'axios';

export const authenticateSSO = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token gerekli' });
    }

    const response = await axios.post('https://apps.iwa.web.tr/api/auth/verify', {
      token,
      app_code: 'YOUR_APP_CODE'
    });

    if (!response.data.success) {
      return res.status(401).json({ error: 'Geçersiz token' });
    }

    req.user = response.data.data.user;
    req.userRole = response.data.data.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Kimlik doğrulama başarısız' });
  }
};

// 2. Role Kontrolü Middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Bu işlem için yetkiniz yok'
      });
    }
    next();
  };
};

// 3. Route'lara Ekle
app.get('/api/products', authenticateSSO, getProducts);
app.post('/api/products', authenticateSSO, requireRole(['admin', 'editor']), createProduct);
app.delete('/api/products/:id', authenticateSSO, requireRole(['admin']), deleteProduct);
```

---

## Kaldırılması Gereken Kodlar

### ❌ Eski Login Sistemi Kalıntıları:

```typescript
// ❌ KALDIR: Login sayfaları
pages/login.tsx
pages/register.tsx
pages/forgot-password.tsx

// ❌ KALDIR: Auth servisler (lokal)
services/auth.service.ts (eğer lokal login yapıyorsa)

// ❌ KALDIR: Session middleware
middleware/session.ts

// ❌ KALDIR: User CRUD endpoint'leri (SSO'da olacak)
POST /api/auth/register
POST /api/auth/login
POST /api/auth/reset-password

// ❌ KALDIR: Lokal kullanıcı tablosu (opsiyonel)
users table (veya sadece referans için tut)
```

---

## SSO Entegrasyon Rehberi

Detaylı entegrasyon adımları için:
- [SSO_INTEGRATION_GUIDE.md](SSO_INTEGRATION_GUIDE.md) - Tam entegrasyon rehberi
- [SSO_TEST_GUIDE.md](SSO_TEST_GUIDE.md) - Test senaryoları

---

## İletişim

**SSO Portal:** https://apps.iwa.web.tr
**Admin Console:** https://apps.iwa.web.tr (Admin Console butonu)
**API Endpoint:** https://apps.iwa.web.tr/api
**Destek:** ahmet@iwa.com.tr

---

## Özet

**Entegrasyon Durumu:**
- 🟢 **SSO Portal:** Çalışıyor ✅
- 🟢 **Admin Console:** Çalışıyor ✅
- 🔴 **3 Uygulama:** Entegre değil (SwiftStock, StockPulse, AmzSellMetrics)
- 🟡 **2 Uygulama:** Kısmi entegre (PriceLab, ManuMaestro) - Kontrol gerekli

**Tahmini Süre:**
- Entegre olmayan uygulamalar: ~3 gün (3 uygulama x 1 gün)
- Kısmi entegre uygulamalar: ~1 gün (2 uygulama x 4 saat)
- **Toplam:** ~4 iş günü

---

**Rapor Oluşturulma:** 2026-01-21
**Güncelleme:** v1.0
