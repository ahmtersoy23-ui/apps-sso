# IWA Apps SSO - Entegrasyon Rehberi

## Genel Bakış

IWA Apps SSO sistemi, tüm uygulamalarımız için merkezi kimlik doğrulama ve yetkilendirme sağlar. Uygulamalardaki mevcut login katmanlarının kaldırılması ve SSO ile entegre edilmesi gerekiyor.

## SSO Mimarisi

```
┌─────────────┐
│   Kullanıcı  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  apps.iwa.web.tr │  ← SSO Login Portal (Google OAuth)
└────────┬────────┘
         │ JWT Token
         ▼
┌────────────────────┐
│  Uygulama (Client) │  ← StockPulse, PriceLab, vs.
└────────┬───────────┘
         │ Token Verification
         ▼
┌────────────────────┐
│  SSO Backend API   │  ← Token doğrulama & yetki kontrolü
└────────────────────┘
```

## Entegrasyon Adımları

### 1. Mevcut Login Katmanını Kaldırma

Uygulamanızdan şunları kaldırın:
- Login sayfaları
- Kullanıcı kayıt formları
- Şifre sıfırlama mekanizmaları
- Lokal authentication middleware'leri
- User sessions (database)

### 2. SSO Token Kontrolü Ekleme

#### Frontend (React Örneği)

```typescript
// SSO'dan gelen token'ı URL'den al veya localStorage'dan oku
const getAccessToken = (): string | null => {
  // URL'den token geliyorsa (ilk login)
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');

  if (urlToken) {
    localStorage.setItem('sso_access_token', urlToken);
    // URL'i temizle
    window.history.replaceState({}, '', window.location.pathname);
    return urlToken;
  }

  // localStorage'dan token oku
  return localStorage.getItem('sso_access_token');
};

// Token doğrulama
const verifyToken = async (token: string, appCode: string) => {
  const response = await fetch('https://apps.iwa.web.tr/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, app_code: appCode })
  });

  if (!response.ok) {
    // Token geçersiz - SSO'ya yönlendir
    window.location.href = 'https://apps.iwa.web.tr';
    return null;
  }

  return await response.json();
};

// Uygulama başlangıcında
const initAuth = async () => {
  const token = getAccessToken();

  if (!token) {
    // Token yok - SSO'ya yönlendir
    window.location.href = 'https://apps.iwa.web.tr';
    return;
  }

  // Token'ı doğrula ve kullanıcı bilgilerini al
  const result = await verifyToken(token, 'YOUR_APP_CODE'); // örn: 'stockpulse'

  if (result?.success) {
    const { user, role } = result.data;
    // Kullanıcı bilgilerini state'e kaydet
    setCurrentUser(user);
    setUserRole(role); // 'admin', 'editor', veya 'viewer'
  }
};
```

#### Backend (Node.js/Express Örneği)

```typescript
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Middleware: SSO Token Doğrulama
const authenticateSSO = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token gerekli' });
    }

    // SSO API'ye token doğrulama isteği
    const response = await axios.post('https://apps.iwa.web.tr/api/auth/verify', {
      token,
      app_code: 'YOUR_APP_CODE' // örn: 'stockpulse'
    });

    if (response.data.success) {
      // Kullanıcı bilgilerini request'e ekle
      req.user = response.data.data.user;
      req.userRole = response.data.data.role;
      next();
    } else {
      return res.status(401).json({ error: 'Geçersiz token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Kimlik doğrulama başarısız' });
  }
};

// Örnek kullanım
app.get('/api/protected-route', authenticateSSO, (req, res) => {
  // req.user ve req.userRole kullanılabilir
  res.json({
    message: 'Korumalı veri',
    user: req.user,
    role: req.userRole
  });
});
```

### 3. Role-Based Access Control (RBAC)

SSO üç rol seviyesi sağlar:

| Rol | Açıklama | Örnek Yetkiler |
|-----|----------|----------------|
| **admin** | Tam yetki | Tüm CRUD işlemleri, ayarlar, kullanıcı yönetimi |
| **editor** | Düzenleme yetkisi | Read + Create + Update (Delete yok) |
| **viewer** | Sadece görüntüleme | Sadece Read işlemleri |

#### Backend'de Role Kontrolü

```typescript
// Middleware: Role bazlı yetkilendirme
const requireRole = (allowedRoles: string[]) => {
  return (req, res, next) => {
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

// Örnek kullanım
app.post('/api/products',
  authenticateSSO,
  requireRole(['admin', 'editor']),
  createProduct
);

app.delete('/api/products/:id',
  authenticateSSO,
  requireRole(['admin']),
  deleteProduct
);
```

#### Frontend'de Role Kontrolü

```typescript
// Component'te role bazlı UI gösterimi
const ProductList = () => {
  const { userRole } = useAuth();

  return (
    <div>
      {/* Herkes görebilir */}
      <ProductTable />

      {/* Sadece editor ve admin görebilir */}
      {(['admin', 'editor'].includes(userRole)) && (
        <button onClick={createProduct}>Yeni Ürün Ekle</button>
      )}

      {/* Sadece admin görebilir */}
      {userRole === 'admin' && (
        <button onClick={deleteProduct}>Sil</button>
      )}
    </div>
  );
};
```

### 4. Logout İşlemi

```typescript
const logout = async () => {
  const token = localStorage.getItem('sso_access_token');

  // SSO'ya logout bildirimi (opsiyonel)
  try {
    await fetch('https://apps.iwa.web.tr/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Local token'ı temizle
  localStorage.removeItem('sso_access_token');

  // SSO portal'a yönlendir
  window.location.href = 'https://apps.iwa.web.tr';
};
```

### 5. Token Refresh (Opsiyonel)

JWT token'lar 24 saat geçerlidir. Token yenileme için:

```typescript
const refreshToken = async () => {
  const currentRefreshToken = localStorage.getItem('sso_refresh_token');

  const response = await fetch('https://apps.iwa.web.tr/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: currentRefreshToken })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('sso_access_token', data.data.accessToken);
    localStorage.setItem('sso_refresh_token', data.data.refreshToken);
    return data.data.accessToken;
  }

  // Refresh başarısız - yeniden login gerekli
  logout();
};

// Axios interceptor ile otomatik refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

## API Endpoints

### SSO Backend Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/verify` | Token doğrulama ve kullanıcı bilgisi alma |
| POST | `/api/auth/logout` | Token'ı geçersiz kılma |
| POST | `/api/auth/refresh` | Token yenileme |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgisi |

### Token Verify Request

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "app_code": "stockpulse"
}
```

### Token Verify Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "ahmet@iwa.com.tr",
      "name": "Ahmet Ersoy",
      "picture": "https://..."
    },
    "role": "admin",
    "apps": {
      "stockpulse": "admin",
      "pricelab": "viewer",
      "manumaestro": "editor"
    }
  }
}
```

## Güvenlik Notları

1. **Token Güvenliği**
   - Token'ları her zaman HTTPS üzerinden gönderin
   - LocalStorage yerine httpOnly cookie kullanmayı düşünün (daha güvenli)
   - Token'ları URL'de query parameter olarak göstermeyin

2. **CORS Ayarları**
   - SSO backend'inizin CORS ayarlarında uygulamanızın domain'i olmalı
   - Örnek: `https://stockpulse.iwa.web.tr`

3. **Rate Limiting**
   - Token verification endpoint'lerine rate limit uygulayın
   - Kötü amaçlı token denemelerini engelleyin

4. **Logging**
   - Tüm authentication hatalarını logla
   - Başarısız login denemelerini izle

## Uygulama Kodu (app_code) Listesi

Her uygulama için benzersiz bir kod:

- `amzsellmetrics` - Amazon Sell Metrics
- `stockpulse` - StockPulse
- `pricelab` - PriceLab
- `manumaestro` - ManuMaestro
- `swiftstock` - SwiftStock WMS

## Test Senaryoları

### 1. İlk Login
- SSO portal'dan login → Token al → Uygulamaya yönlendir

### 2. Token Doğrulama
- Mevcut token ile uygulama açılıyor mu?
- Geçersiz token ile SSO'ya yönlendiriliyor mu?

### 3. Yetkilendirme
- Admin, editor ve viewer rolleri doğru çalışıyor mu?
- Yetkisiz işlemler engelleniy or mu?

### 4. Logout
- Logout sonrası token geçersiz mi?
- SSO portal'a yönlendirme yapılıyor mu?

## Destek

Entegrasyon sırasında sorun yaşarsanız:
- Email: ahmet@iwa.com.tr
- SSO Backend URL: https://apps.iwa.web.tr
- API Documentation: https://apps.iwa.web.tr/api/docs

## Örnek Entegrasyon Timeline

1. **Gün 1-2**: Mevcut auth katmanını kaldır
2. **Gün 3-4**: SSO token kontrolü ekle
3. **Gün 5**: Role-based access control uygula
4. **Gün 6-7**: Test ve debugging
5. **Gün 8**: Production'a deploy

---

**Son Güncelleme:** 2026-01-21
**Versiyon:** 1.0
