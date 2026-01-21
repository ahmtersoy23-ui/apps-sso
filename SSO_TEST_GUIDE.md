# SSO Entegrasyon Test Rehberi

Bu rehber, diğer uygulamaların SSO entegrasyonunun hazır olup olmadığını test etmek için kullanılır.

## Test Öncesi Kontroller

### 1. Portal Üzerinden Kontrol

**Admin Console'a Giriş:**
1. [https://apps.iwa.web.tr](https://apps.iwa.web.tr) adresine git
2. Google ile login yap
3. Admin Console'a tıkla

**Kontrol Listesi:**
- [ ] Tüm uygulamalar "Applications" sekmesinde görünüyor mu?
- [ ] Her uygulamanın `app_url` değeri doğru mu?
- [ ] Test kullanıcıları var mı? (en az 3: admin, editor, viewer)
- [ ] Test kullanıcılarına uygulamalar atanmış mı?

### 2. Veritabanı Kontrol (Opsiyonel)

Sunucuya SSH ile bağlanıp şu komutları çalıştır:

```bash
cd /var/www/apps-sso/backend
docker exec postgres psql -U ssouser -d iwa_apps_sso

-- Uygulamaları listele
SELECT app_code, app_name, app_url, is_active FROM applications;

-- Kullanıcı-uygulama atamalarını göster
SELECT
  u.email,
  u.name,
  a.app_code,
  r.role_code
FROM user_app_roles uar
JOIN users u ON uar.user_id = u.user_id
JOIN applications a ON uar.app_id = a.app_id
JOIN roles r ON uar.role_id = r.role_id
ORDER BY u.email, a.app_code;
```

## Her Uygulama İçin Test Senaryoları

### Test 1: Token Doğrulama API

Her uygulama için token doğrulama endpoint'ini test et:

```bash
# Access token'ı al (Portal'dan login ol, Developer Tools > Application > Local Storage)
TOKEN="eyJhbGci..."

# Her uygulama için test et
curl -X POST https://apps.iwa.web.tr/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN'",
    "app_code": "pricelab"
  }'
```

**Beklenen Sonuç:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "ahmet@iwa.com.tr",
      "name": "Ahmet Ersoy",
      "picture": "..."
    },
    "role": "admin",
    "apps": {
      "pricelab": "admin",
      "stockpulse": "admin",
      ...
    }
  }
}
```

### Test 2: Uygulama Login Akışı

**A. İlk Login (SSO'dan)**

1. Incognito/Private pencere aç
2. [https://apps.iwa.web.tr](https://apps.iwa.web.tr) adresine git
3. Google ile login yap
4. Dashboard'da bir uygulama kartına tıkla (örn: PriceLab)
5. **Beklenen:**
   - Uygulama açılmalı
   - Token URL'de veya localStorage'da olmalı
   - Kullanıcı bilgileri görünmeli
   - ❌ Login sayfası GÖRMEMELI

**B. Direkt Uygulama Erişimi (Token Yok)**

1. Yeni incognito pencere aç
2. Doğrudan uygulamanın URL'ini aç (örn: `https://pricelab.iwa.web.tr`)
3. **Beklenen:**
   - ❌ Login sayfası GÖRMEMELİ
   - ✅ SSO Portal'a yönlendirilmeli (`https://apps.iwa.web.tr`)
   - Login sonrası uygulamaya geri dönmeli

**C. Direkt Uygulama Erişimi (Token Var)**

1. SSO portal'dan login ol
2. Yeni tab aç
3. Doğrudan uygulamanın URL'ini aç
4. **Beklenen:**
   - Uygulama direkt açılmalı (login gerektirmeden)
   - Token localStorage'dan okunmalı
   - Kullanıcı bilgileri görünmeli

### Test 3: Role-Based Access Control

Her rol için test kullanıcısı oluştur:

**Test Kullanıcıları:**
- `admin@test.com` → **admin** rolü → Tüm CRUD işlemleri
- `editor@test.com` → **editor** rolü → Create/Read/Update (Delete yok)
- `viewer@test.com` → **viewer** rolü → Sadece Read

**Test Adımları:**

1. **Admin Kullanıcı:**
   ```
   - ✅ Veri görüntüleyebilmeli
   - ✅ Yeni veri oluşturabilmeli
   - ✅ Veri güncelleyebilmeli
   - ✅ Veri silebilmeli
   - ✅ Ayarlara erişebilmeli
   ```

2. **Editor Kullanıcı:**
   ```
   - ✅ Veri görüntüleyebilmeli
   - ✅ Yeni veri oluşturabilmeli
   - ✅ Veri güncelleyebilmeli
   - ❌ Veri silme butonu GÖRMEMELİ veya devre dışı olmalı
   - ❌ Ayarlara erişememeli
   ```

3. **Viewer Kullanıcı:**
   ```
   - ✅ Veri görüntüleyebilmeli
   - ❌ Create/Edit/Delete butonları GÖRMEMELİ
   - ❌ Ayarlara erişememeli
   ```

**Backend Test (API):**
```bash
# Editor token ile delete isteği gönder
curl -X DELETE https://pricelab.iwa.web.tr/api/products/123 \
  -H "Authorization: Bearer $EDITOR_TOKEN"

# Beklenen: 403 Forbidden
{
  "error": "Bu işlem için yetkiniz yok",
  "requiredRole": ["admin"],
  "yourRole": "editor"
}
```

### Test 4: Logout

1. Uygulamaya login ol
2. Logout butonuna tıkla
3. **Beklenen:**
   - localStorage'dan token temizlenmeli
   - SSO portal'a yönlendirilmeli
   - Uygulamanın URL'ini yeniden açtığında tekrar login istemeli

**Developer Tools ile Kontrol:**
```javascript
// Logout öncesi
localStorage.getItem('sso_access_token') // Token var

// Logout sonrası
localStorage.getItem('sso_access_token') // null
```

### Test 5: Token Expiry

Token'lar 24 saat geçerlidir. Test için:

1. Geçersiz bir token oluştur veya eski bir token kullan
2. Bu token ile uygulamaya erişmeyi dene
3. **Beklenen:**
   - Token doğrulama başarısız olmalı
   - SSO portal'a yönlendirilmeli
   - Yeniden login sonrası yeni token almalı

## Uygulama Bazlı Test Checklist

Her uygulama için bu listeyi doldurun:

### PriceLab
- [ ] Token doğrulama endpoint'i çalışıyor
- [ ] SSO portal'dan açılıyor
- [ ] Direkt URL erişiminde token kontrolü yapıyor
- [ ] Admin rolü tüm özelliklere erişebiliyor
- [ ] Editor rolü delete yapamıyor
- [ ] Viewer rolü sadece görüntüleme yapabiliyor
- [ ] Logout çalışıyor
- [ ] Mevcut login sistemi kaldırılmış

### StockPulse
- [ ] Token doğrulama endpoint'i çalışıyor
- [ ] SSO portal'dan açılıyor
- [ ] Direkt URL erişiminde token kontrolü yapıyor
- [ ] Admin rolü tüm özelliklere erişebiliyor
- [ ] Editor rolü delete yapamıyor
- [ ] Viewer rolü sadece görüntüleme yapabiliyor
- [ ] Logout çalışıyor
- [ ] Mevcut login sistemi kaldırılmış

### ManuMaestro
- [ ] Token doğrulama endpoint'i çalışıyor
- [ ] SSO portal'dan açılıyor
- [ ] Direkt URL erişiminde token kontrolü yapıyor
- [ ] Admin rolü tüm özelliklere erişebiliyor
- [ ] Editor rolü delete yapamıyor
- [ ] Viewer rolü sadece görüntüleme yapabiliyor
- [ ] Logout çalışıyor
- [ ] Mevcut login sistemi kaldırılmış

### SwiftStock WMS
- [ ] Token doğrulama endpoint'i çalışıyor
- [ ] SSO portal'dan açılıyor
- [ ] Direkt URL erişiminde token kontrolü yapıyor
- [ ] Admin rolü tüm özelliklere erişebiliyor
- [ ] Editor rolü delete yapamıyor
- [ ] Viewer rolü sadece görüntüleme yapabiliyor
- [ ] Logout çalışıyor
- [ ] Mevcut login sistemi kaldırılmış

### Amazon Sell Metrics
- [ ] Token doğrulama endpoint'i çalışıyor
- [ ] SSO portal'dan açılıyor
- [ ] Direkt URL erişiminde token kontrolü yapıyor
- [ ] Admin rolü tüm özelliklere erişebiliyor
- [ ] Editor rolü delete yapamıyor
- [ ] Viewer rolü sadece görüntüleme yapabiliyor
- [ ] Logout çalışıyor
- [ ] Mevcut login sistemi kaldırılmış

## Hata Senaryoları Test

### 1. Geçersiz Token
```bash
curl -X POST https://apps.iwa.web.tr/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid_token", "app_code": "pricelab"}'

# Beklenen: 401 Unauthorized
```

### 2. Yetkisiz Uygulama
```bash
# Kullanıcının erişimi olmayan bir app_code ile
curl -X POST https://apps.iwa.web.tr/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "'$TOKEN'", "app_code": "unauthorized_app"}'

# Beklenen: 403 Forbidden veya role: null
```

### 3. Eksik Token
```bash
curl -X POST https://apps.iwa.web.tr/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"app_code": "pricelab"}'

# Beklenen: 400 Bad Request
```

## Test Sonuçları Rapor Şablonu

```
Tarih: [2026-01-21]
Tester: [İsim]

Uygulama: [PriceLab]
Versiyon: [1.0.0]

Test Sonuçları:
✅ Token doğrulama çalışıyor
✅ SSO login akışı başarılı
✅ Role-based access control doğru
✅ Logout başarılı
❌ Direkt URL erişiminde yönlendirme çalışmıyor
  → Sorun: Token kontrolü yapmıyor, direkt uygulamayı açıyor
  → Çözüm: Frontend'e token kontrolü eklenmeli

Notlar:
- Login sayfası hala mevcut, kaldırılmalı
- Token localStorage yerine cookie'de tutulması önerilir
```

## Entegrasyon Hazır mı Kontrolü

Bir uygulamanın SSO entegrasyonunun tamamen hazır olduğunu söyleyebilmek için:

### ✅ Gerekli Kontroller:
1. [ ] Uygulamanın `app_code` veritabanında kayıtlı
2. [ ] Mevcut login sayfası/sistemi tamamen kaldırılmış
3. [ ] Frontend'te token kontrolü yapılıyor
4. [ ] Backend'te SSO token doğrulama middleware'i eklenmiş
5. [ ] Role-based access control uygulanmış
6. [ ] Logout SSO portal'a yönlendiriyor
7. [ ] Tüm API endpoint'leri SSO token ile korunuyor
8. [ ] Test kullanıcıları ile tüm roller test edilmiş

### 🔍 Kritik Test Noktaları:
- **Token yokken:** SSO'ya yönlendirme ✅
- **Geçersiz token:** SSO'ya yönlendirme ✅
- **Geçerli token:** Uygulama açılıyor ✅
- **Yetkisiz rol:** İşlem engelleniyor ✅

## Destek

Sorun yaşanırsa kontrol edilecekler:
1. Browser console'da hata var mı?
2. Network tab'de token gönderiliyor mu?
3. Token doğrulama API'si 200 dönüyor mu?
4. Backend logs'da hata var mı?

---

**Not:** Bu test rehberi, tüm uygulamaların SSO entegrasyonunun doğru çalıştığından emin olmak için kullanılmalıdır.
