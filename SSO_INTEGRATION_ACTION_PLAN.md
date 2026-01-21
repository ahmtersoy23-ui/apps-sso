# SSO Entegrasyon Aksiyon Planı

**Tarih:** 2026-01-21
**Test Sonuçları:** Portal üzerinden kontrol edildi
**Hazırlayan:** Claude + Ahmet Ersoy

---

## ✅ Test Sonuçları (Portal Kartlarından)

### Tespit Edilen Durumlar:

| Uygulama | URL | Davranış | SSO Durumu |
|----------|-----|----------|-----------|
| **SwiftStock WMS** | swiftstock.apps.iwa.web.tr | ❌ Login sayfası gösteriyor | Entegre DEĞİL |
| **StockPulse** | stockpulse.iwa.web.tr | ❌ Login sayfası gösteriyor | Entegre DEĞİL |
| **AmzSellMetrics** | amzsellmetrics.iwa.web.tr | ❌ Login sayfası gösteriyor | Entegre DEĞİL |
| **PriceLab** | pricelab.iwa.web.tr | ⚠️ Dashboard'a geri dönüyor | Kısmi entegre |
| **ManuMaestro** | manumaestro.apps.iwa.web.tr | ⚠️ Dashboard'a geri dönüyor | Kısmi entegre |

---

## 🎯 Öncelikli Aksiyonlar

### GRUP A: Entegre Edilmesi Gerekenler (Acil)

Bu 3 uygulamanın SSO entegrasyonu **yapılmamış**. Öncelikli olarak bunlara başlanmalı.

#### 1. 🔴 SwiftStock WMS

**Sorun:** Hala kendi login sistemi aktif
**Deploy Klasörü:** `/var/www/swiftstock-backend` (Backend), `/var/www/swiftstock/frontend` (Frontend)
**PM2 Process:** `swiftstock-backend`
**Port:** 3001
**Database:** `pricelab_db` (shared)

**Yapılacaklar:**

**Backend (Express + TypeScript):**
```bash
# 1. SSO auth middleware ekle
ssh root@78.47.117.36
cd /var/www/swiftstock-backend

# middleware/sso-auth.ts oluştur
```

```typescript
// middleware/sso-auth.ts
import axios from 'axios';

export const authenticateSSO = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token gerekli' });
    }

    const response = await axios.post('https://apps.iwa.web.tr/api/auth/verify', {
      token,
      app_code: 'swiftstock'
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

export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Bu işlem için yetkiniz yok',
        requiredRole: allowedRoles,
        yourRole: req.userRole
      });
    }
    next();
  };
};
```

**Tüm route'lara ekle:**
```typescript
// routes/index.ts
import { authenticateSSO, requireRole } from '../middleware/sso-auth';

// Her endpoint'e ekle
app.get('/api/inventory', authenticateSSO, getInventory);
app.post('/api/inventory', authenticateSSO, requireRole(['admin', 'editor']), createInventoryItem);
app.delete('/api/inventory/:id', authenticateSSO, requireRole(['admin']), deleteInventoryItem);
```

**Frontend (React + TypeScript):**
```typescript
// src/App.tsx veya main.tsx
import { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSSO();
  }, []);

  const checkSSO = async () => {
    // URL'den token al
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      localStorage.setItem('sso_access_token', urlToken);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = localStorage.getItem('sso_access_token');

    if (!token) {
      window.location.href = 'https://apps.iwa.web.tr';
      return;
    }

    // Token'ı doğrula
    try {
      const response = await fetch('https://apps.iwa.web.tr/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, app_code: 'swiftstock' })
      });

      const data = await response.json();

      if (!data.success) {
        localStorage.removeItem('sso_access_token');
        window.location.href = 'https://apps.iwa.web.tr';
        return;
      }

      setUser(data.data.user);
      setLoading(false);
    } catch (error) {
      localStorage.removeItem('sso_access_token');
      window.location.href = 'https://apps.iwa.web.tr';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* SwiftStock uygulaması */}
      <p>Welcome, {user?.name}</p>
    </div>
  );
}
```

**Kaldırılacak dosyalar:**
```bash
# Mevcut login sayfalarını kaldır
rm src/pages/Login.tsx
rm src/pages/Register.tsx
rm src/components/LoginForm.tsx

# Eski auth servis dosyalarını kaldır veya güncelle
# src/services/auth.service.ts → SSO token kontrolüne çevir
```

**Deploy:**
```bash
# Local'de build
cd /Users/ahmetersoy/Desktop/swiftstock/wms-backend
npm install axios  # SSO için gerekli
npm run build

# Backend deploy
scp -r dist/* root@78.47.117.36:/var/www/swiftstock-backend/dist/
ssh root@78.47.117.36 "cd /var/www/swiftstock-backend && npm install axios && pm2 restart swiftstock-backend"

# Frontend build
cd /Users/ahmetersoy/Desktop/swiftstock/wms-frontend
npm run build

# Frontend deploy
scp -r dist/* root@78.47.117.36:/var/www/swiftstock/frontend/
```

**Tahmini Süre:** 1 gün (8 saat)

---

#### 2. 🔴 StockPulse

**Sorun:** Hala kendi login sistemi aktif
**Deploy Klasörü:** `/var/www/stockpulse`
**PM2 Process:** `stockpulse`
**Port:** 3010 (Vite SSR)
**Database:** `stockpulse_db`

**Yapılacaklar:**
Aynı adımlar SwiftStock ile (Backend middleware + Frontend token kontrolü)

**Özel Not:** StockPulse Vite SSR kullanıyor, bu yüzden server-side rendering kontrolü de gerekli.

```typescript
// server/index.ts
// SSR'da token kontrolü yapılmalı
app.use(async (req, res, next) => {
  const token = req.headers.authorization || req.query.token;

  if (!token) {
    return res.redirect('https://apps.iwa.web.tr');
  }

  // Token doğrulama...
  next();
});
```

**Tahmini Süre:** 1 gün (8 saat)

---

#### 3. 🔴 AmzSellMetrics

**Sorun:** Hala kendi login sistemi aktif
**Deploy Klasörü:** `/var/www/amzsellmetrics` (Frontend), Backend PriceLab ile shared (port 3003)
**PM2 Process:** `pricelab-backend` (shared)
**Database:** `pricelab_db` (shared)

**Yapılacaklar:**
Aynı adımlar (Backend middleware + Frontend token kontrolü)

**Özel Not:** AmzSellMetrics backend'i PriceLab ile aynı port'u kullanıyor (3003). Backend değişikliklerini yaparken dikkat et.

**Tahmini Süre:** 1 gün (8 saat)

---

### GRUP B: Sorun Giderme Gerekli (Orta Öncelik)

Bu 2 uygulama SSO entegre **görünüyor** ama portal dashboard'a geri dönüyor. Kontrol gerekli.

#### 4. 🟡 PriceLab

**Durum:** Dashboard'a geri dönüyor
**Deploy Klasörü:** `/var/www/pricelab` (Frontend), `/var/www/pricelab-backend` (Backend)
**PM2 Process:** `pricelab-backend`
**Port:** 3003
**Database:** `pricelab_db`

**Olası Sorunlar:**

**A. Kullanıcı yetkisi yok:**
```bash
# Admin Console'dan kontrol et
# → Users sekmesi → Test kullanıcısını seç
# → Apps listesinde "PriceLab" var mı?
# → Role ne? (admin/editor/viewer)
```

**B. Token doğrulama hatası:**
```bash
# Developer Tools → Console
# Hata mesajı var mı?

# Network Tab
# /api/auth/verify isteği başarısız mı?
```

**C. Redirect mantığı hatalı:**
```typescript
// Frontend'te kontrol et - src/App.tsx veya benzeri
// Token doğrulama başarısız olunca ne yapıyor?

// YANLIŞ:
if (!data.success) {
  window.location.href = 'https://apps.iwa.web.tr/dashboard'; // ❌
}

// DOĞRU:
if (!data.success) {
  window.location.href = 'https://apps.iwa.web.tr'; // ✅
}

// VEYA kullanıcıya mesaj göster:
if (!data.success) {
  alert('PriceLab erişiminiz yok. Lütfen yönetici ile iletişime geçin.');
}
```

**Kontrol Adımları:**
1. Browser Developer Tools aç
2. PriceLab kartına tıkla
3. Console ve Network tab'i izle
4. Hangi endpoint hata veriyor?
5. Hata mesajı nedir?

**Tahmini Süre:** 4 saat

---

#### 5. 🟡 ManuMaestro

**Durum:** Dashboard'a geri dönüyor
**Deploy Klasörü:** `/var/www/manumaestro`
**PM2 Process:** `manumaestro`
**Port:** 3000 (Next.js)
**Database:** `manumaestro_db`

**Aynı kontroller PriceLab ile**

**Özel Not:** ManuMaestro Next.js kullanıyor. Server-side middleware kontrolü gerekli.

```typescript
// middleware.ts (Next.js middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('sso_access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('https://apps.iwa.web.tr', request.url));
  }

  // Token doğrulama...
  const response = await fetch('https://apps.iwa.web.tr/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, app_code: 'manumaestro' })
  });

  const data = await response.json();

  if (!data.success) {
    return NextResponse.redirect(new URL('https://apps.iwa.web.tr', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Tahmini Süre:** 4 saat

---

## 📅 Önerilen Timeline

### Hafta 1 (Acil - Grup A):
```
Pazartesi:    SwiftStock WMS backend + frontend entegrasyonu
Salı:         SwiftStock test + debugging
Çarşamba:     StockPulse backend + frontend entegrasyonu
Perşembe:     StockPulse test + debugging
Cuma:         AmzSellMetrics backend + frontend entegrasyonu
```

### Hafta 2 (Sorun Giderme - Grup B):
```
Pazartesi:    PriceLab sorun analizi ve düzeltme
Salı:         ManuMaestro sorun analizi ve düzeltme
Çarşamba:     Tüm uygulamalar için end-to-end test
Perşembe:     Role-based access control test (admin/editor/viewer)
Cuma:         Production'a final deploy + dokumentasyon
```

---

## 🧪 Test Checklist (Her Uygulama İçin)

Deploy sonrası her uygulama için:

### ✅ Fonksiyonel Testler:
- [ ] Token yokken SSO'ya yönlendiriyor mu?
- [ ] Geçerli token ile uygulama açılıyor mu?
- [ ] Geçersiz token ile SSO'ya yönlendiriyor mu?
- [ ] Kullanıcı bilgileri görüntüleniyor mu?
- [ ] Logout çalışıyor mu? (SSO'ya dönüyor mu?)

### ✅ Yetkilendirme Testleri:
- [ ] Admin: Tüm özelliklere erişebiliyor mu?
- [ ] Editor: Create/Update yapabiliyor, Delete yapamıyor mu?
- [ ] Viewer: Sadece görüntüleme yapabiliyor mu?
- [ ] Yetkisiz kullanıcı: Hata mesajı alıyor mu?

### ✅ Güvenlik Testleri:
- [ ] Backend API'leri token olmadan erişilemiyor mu?
- [ ] Geçersiz token ile 401 dönüyor mu?
- [ ] Yetkisiz işlemde 403 dönüyor mu?
- [ ] CORS ayarları doğru mu?

### ✅ Performans Testleri:
- [ ] Token doğrulama hızlı mı? (<500ms)
- [ ] Redis cache kullanılıyor mu?
- [ ] PM2 memory kullanımı normal mi?

---

## 🚨 Yaygın Hatalar ve Çözümleri

### 1. "Failed to fetch" Hatası

**Sorun:** Frontend SSO API'sine erişemiyor
**Çözüm:**
```typescript
// CORS hatası varsa, SSO backend'de:
// src/index.ts
app.use(cors({
  origin: [
    'https://apps.iwa.web.tr',
    'https://swiftstock.apps.iwa.web.tr',
    'https://stockpulse.iwa.web.tr',
    'https://amzsellmetrics.iwa.web.tr',
    'https://pricelab.iwa.web.tr',
    'https://manumaestro.apps.iwa.web.tr'
  ],
  credentials: true
}));
```

### 2. "Token expired" Hatası

**Sorun:** Token süresi dolmuş
**Çözüm:**
```typescript
// Token refresh logic ekle
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('sso_refresh_token');

  const response = await fetch('https://apps.iwa.web.tr/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('sso_access_token', data.data.accessToken);
    return data.data.accessToken;
  }

  // Refresh başarısız - logout
  logout();
};
```

### 3. "Infinite redirect loop"

**Sorun:** Uygulama SSO'ya, SSO tekrar uygulamaya yönlendiriyor
**Çözüm:**
```typescript
// Token kontrolü yaparken, sadece bir kez yönlendir
let isRedirecting = false;

const checkSSO = async () => {
  if (isRedirecting) return;

  const token = localStorage.getItem('sso_access_token');

  if (!token) {
    isRedirecting = true;
    window.location.href = 'https://apps.iwa.web.tr';
    return;
  }

  // Token doğrulama...
};
```

### 4. "PM2 crash loop"

**Sorun:** Backend sürekli restart oluyor
**Çözüm:**
```bash
# Logs kontrol et
pm2 logs swiftstock-backend --err --lines 50

# Environment variables kontrol et
pm2 env 0

# Restart with updated env
pm2 restart swiftstock-backend --update-env

# Memory limit aşımı varsa:
pm2 restart swiftstock-backend --max-memory-restart 300M
```

---

## 📊 Başarı Kriterleri

Entegrasyon tamamlandığında:

✅ **Tüm 5 uygulama:**
- Login sayfası yok
- SSO token kontrolü yapıyor
- Geçerli token ile açılıyor
- Geçersiz token ile SSO'ya yönlendiriyor

✅ **Role-based access:**
- Admin tüm özelliklere erişebiliyor
- Editor delete yapamıyor
- Viewer sadece görüntüleme yapabiliyor

✅ **Güvenlik:**
- Tüm API endpoint'leri token ile korunuyor
- Geçersiz/eksik token 401 dönüyor
- Yetkisiz işlemler 403 dönüyor

✅ **Performans:**
- Token doğrulama <500ms
- Redis cache kullanılıyor
- PM2 stable (no crash loop)

---

## 📞 Destek ve Kaynaklar

**Dökümanlar:**
- [SSO_INTEGRATION_GUIDE.md](SSO_INTEGRATION_GUIDE.md) - Detaylı entegrasyon rehberi
- [SSO_TEST_GUIDE.md](SSO_TEST_GUIDE.md) - Test senaryoları
- [SSO_INTEGRATION_STATUS_REPORT.md](SSO_INTEGRATION_STATUS_REPORT.md) - Durum raporu

**Server Bilgileri:**
- [SERVER_REFERENCE.md](/Users/ahmetersoy/Desktop/memory-bank/SERVER_REFERENCE.md)
- **Server IP:** 78.47.117.36
- **SSO Portal:** https://apps.iwa.web.tr
- **Admin Console:** https://apps.iwa.web.tr (Admin Console butonu)

**İletişim:**
- Email: ahmet@iwa.com.tr
- GitHub: https://github.com/ahmtersoy23-ui/apps-sso

---

## 🎯 Sonraki Adım

**ŞİMDİ YAPILACAK:**

1. ✅ **Bu dokümanda belirtilen önceliklere göre hareket et**
2. ✅ **GRUP A uygulamalarına başla** (SwiftStock, StockPulse, AmzSellMetrics)
3. ✅ **Her uygulamayı deploy ettikten sonra test et**
4. ✅ **GRUP B uygulamalarını kontrol et** (PriceLab, ManuMaestro)
5. ✅ **Tüm testler geçtikten sonra production'a al**

**Başarılar! 🚀**

---

**Hazırlayan:** Claude + Ahmet Ersoy
**Tarih:** 2026-01-21
**Versiyon:** 1.0
