# 🔐 Google OAuth 2.0 Setup Guide - IWA Apps SSO (YENİ ARAYÜZ)

**Not:** Google Cloud Console arayüzü 2026'da güncellenmiştir. Bu rehber yeni arayüz içindir.

---

## 📋 Şu Anda Bulunduğunuz Sayfa: Branding

Ekran görüntüsünde gördüğünüz gibi, sol menüde şu seçenekler var:
- Overview
- **Branding** ← (ŞU ANDA BURADASINIZ)
- Audience
- Clients
- Data Access
- Verification Center
- Settings

---

## 🚀 Adım Adım Doldurma

### 1. App Information (Mevcut Sayfa - Branding)

Zaten doğru yerdesiniz. Scroll down yaparak şu alanları doldurun:

#### App name
```
IWA Apps
```
✅ Zaten doldurmuşsunuz: "IWA Apps"

#### User support email
```
ersoy@iwaconcept.com.tr
```
✅ Zaten doldurmuşsunuz

#### App logo (Opsiyonel)
Şimdilik boş bırakabilirsiniz veya bir logo yükleyebilirsiniz.
- Format: JPG, PNG, BMP
- Max: 1MB
- Boyut: 120x120px (square)

#### App domain

**Application home page:**
```
https://apps.iwa.web.tr
```

**Application privacy policy link:**
```
https://apps.iwa.web.tr/privacy
```

**Application terms of service link:**
```
https://apps.iwa.web.tr/terms
```

#### Authorized domains

**"+ Add domain" butonuna tıklayın** ve ekleyin:
```
iwa.web.tr
```

**NOT:** `https://` veya `www.` OLMADAN sadece domain adını yazın!

#### Developer contact information (Zaten dolu)
```
ersoy@iwaconcept.com.tr
```

**"SAVE AND CONTINUE" butonuna tıklayın** (sayfanın en altında)

---

### 2. Scopes (Sol Menüden)

Branding sayfasını kaydettikten sonra:

1. Sol menüden **"Data Access"** seçeneğine tıklayın (veya otomatik yönlendirileceksiniz)
2. **"ADD OR REMOVE SCOPES"** butonuna tıklayın
3. Açılan popup'ta şu scope'ları seçin:

**Seçilmesi Gerekenler:**
- ✅ `openid`
- ✅ `email` (Google account email address)
- ✅ `profile` (See your personal info)
- ✅ `.../auth/userinfo.email` (View your email address)
- ✅ `.../auth/userinfo.profile` (See your personal info)

4. **"UPDATE"** butonuna tıklayın
5. **"SAVE AND CONTINUE"** butonuna tıklayın

---

### 3. Test Users (Sol Menüden - Audience)

1. Sol menüden **"Audience"** seçeneğine tıklayın
2. **"+ ADD USERS"** butonuna tıklayın
3. Email adresinizi ekleyin:
```
ersoy@iwaconcept.com.tr
```
4. **"ADD"** butonuna tıklayın
5. **"SAVE AND CONTINUE"** (varsa)

**NOT:** App'iniz "Testing" modunda olduğu sürece sadece bu listedeki kullanıcılar giriş yapabilir.

---

### 4. OAuth Client Oluşturma (Sol Menüden - Clients)

Artık OAuth client credentials'ı oluşturmaya hazırsınız:

1. Sol menüden **"Clients"** seçeneğine tıklayın
2. **"+ CREATE CLIENT"** veya **"+ CREATE CREDENTIALS"** butonuna tıklayın
3. Application type: **"Web application"** seçin
4. Name:
```
IWA Apps SSO
```

#### Authorized JavaScript origins

**"+ ADD URI"** butonuna tıklayıp ekleyin:
```
https://apps.iwa.web.tr
```

**"+ ADD URI"** tekrar tıklayıp development için:
```
http://localhost:5173
```

#### Authorized redirect URIs

**"+ ADD URI"** butonlarıyla şunları ekleyin:
```
https://apps.iwa.web.tr/auth/callback
https://apps.iwa.web.tr
http://localhost:5173/auth/callback
```

5. **"CREATE"** butonuna tıklayın

---

### 5. Credentials'ı Kaydet

Oluşturma işlemi tamamlandığında bir popup açılacak:

**ÖNEMLİ! Şu bilgileri kopyalayın:**
- **Client ID:** `XXXXXXXXXXXXXX.apps.googleusercontent.com`
- **Client secret:** `XXXXXXXXXXXXXX`

Bu bilgileri güvenli bir yere kaydedin veya bana gönderin!

**"DOWNLOAD JSON"** butonuna da tıklayabilirsiniz (opsiyonel yedek).

---

## 📊 Verification Status

Ekranın sağ üst tarafında gördüğünüz "Verification status" bölümünde:

> "Verification is not required since your app is in Testing status"

Bu normaldir. App'iniz **Testing** modunda:
- Max 100 test user ekleyebilirsiniz
- Sadece eklediğiniz kullanıcılar giriş yapabilir
- Verification gerekmez

**Production'a almak için:**
1. Sol menüden **"Settings"** seçin
2. **"PUBLISH APP"** butonuna tıklayın
3. (Bizim scope'larımız için verification gerekmez)

---

## 🔧 Backend'e Credentials Ekleme

Credentials'ı aldıktan sonra:

### Sunucuda (.env dosyası):
```bash
ssh root@78.47.117.36
nano /var/www/apps-sso-backend/.env
```

Şu satırları bulup güncelleyin:
```env
GOOGLE_CLIENT_ID=BURAYA_CLIENT_ID_YAPIŞTIR.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=BURAYA_CLIENT_SECRET_YAPIŞTIR
```

Kaydedin (Ctrl+O, Enter, Ctrl+X) ve backend'i restart edin:
```bash
pm2 restart apps-sso-backend
pm2 logs apps-sso-backend --lines 20
```

---

## ✅ Test Etme

### Backend Health Check:
```bash
curl https://apps.iwa.web.tr/api/health
```

Beklenen sonuç:
```json
{"status":"ok","timestamp":"2026-01-21T...","database":"connected"}
```

### Google OAuth Test:
Frontend'den Google ile giriş yapmayı deneyin. İlk denemede:
1. Google consent screen görünecek
2. İzinleri onaylayın
3. Giriş başarılı olmalı

---

## 🚨 Troubleshooting

### "redirect_uri_mismatch" Hatası

**Sebep:** Redirect URI eşleşmiyor.

**Çözüm:**
1. Sol menüden **"Clients"** seçin
2. Oluşturduğunuz client'a tıklayın
3. "Authorized redirect URIs" bölümünü kontrol edin
4. Frontend'den gönderilen redirect_uri ile tam olarak eşleşmeli

### "Access blocked: This app's request is invalid"

**Sebep:** Authorized domains eksik.

**Çözüm:**
1. Sol menüden **"Branding"** seçin
2. "Authorized domains" bölümüne `iwa.web.tr` eklenmiş mi kontrol edin

### "invalid_client" Hatası

**Sebep:** Client ID veya Secret yanlış.

**Çözüm:**
1. Sol menüden **"Clients"** seçin
2. Client'ınızı bulun ve credentials'ı tekrar kopyalayın
3. `.env` dosyasını güncelleyin
4. `pm2 restart apps-sso-backend`

---

## 📝 Özet Checklist

Şu adımları tamamladınız mı?

- [x] OAuth consent screen oluşturuldu (External)
- [ ] **Branding** sayfası dolduruldu
  - [ ] App name: IWA Apps
  - [ ] User support email: ersoy@iwaconcept.com.tr
  - [ ] Application home page: https://apps.iwa.web.tr
  - [ ] Privacy policy link: https://apps.iwa.web.tr/privacy
  - [ ] Terms of service link: https://apps.iwa.web.tr/terms
  - [ ] Authorized domain: iwa.web.tr
- [ ] **Data Access** - Scopes eklendi (openid, email, profile)
- [ ] **Audience** - Test user eklendi (ersoy@iwaconcept.com.tr)
- [ ] **Clients** - OAuth client oluşturuldu
  - [ ] Authorized JavaScript origins eklendi
  - [ ] Authorized redirect URIs eklendi
- [ ] Client ID ve Secret kaydedildi
- [ ] Backend .env dosyası güncellendi
- [ ] Backend restart edildi
- [ ] Health check başarılı

---

## 🎯 Sonraki Adımlar

1. ✅ Bu formu doldurun
2. ✅ Client ID ve Secret'ı alın
3. ✅ Bana gönderin veya backend'e ekleyin
4. 🚀 Frontend geliştirmeye başlayalım!

---

**Oluşturma Tarihi:** 2026-01-21
**Arayüz Versiyonu:** 2026 (Yeni Google Cloud Console)
**Hazırlayan:** IWA Apps Team
