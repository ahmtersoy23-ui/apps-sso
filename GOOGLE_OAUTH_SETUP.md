# 🔐 Google OAuth 2.0 Setup Guide - IWA Apps SSO

Bu rehber, IWA Apps SSO sistemine Google OAuth entegrasyonu için gerekli adımları içerir.

---

## 📋 Gerekli Bilgiler

**Authorized JavaScript Origins:**
- `https://apps.iwa.web.tr`
- `http://localhost:5173` (Development için)

**Authorized Redirect URIs:**
- `https://apps.iwa.web.tr/auth/callback`
- `https://apps.iwa.web.tr`
- `http://localhost:5173/auth/callback` (Development için)

---

## 🚀 Adım Adım Kurulum

### 1. Google Cloud Console'a Giriş

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Google hesabınızla giriş yapın

---

### 2. Proje Oluştur veya Seç

**Yeni Proje Oluştur:**
1. Sol üst köşede proje seçiciye tıklayın
2. "New Project" (Yeni Proje) butonuna tıklayın
3. Proje adı: `IWA Apps` veya `IWA Apps SSO`
4. "Create" (Oluştur) butonuna tıklayın
5. Proje oluşturulmasını bekleyin (~10 saniye)
6. Sol üstten yeni oluşturduğunuz projeyi seçin

**Mevcut Proje Kullan:**
- Zaten bir projeniz varsa, onu seçebilirsiniz

---

### 3. OAuth Consent Screen Ayarları

1. Sol menüden **"APIs & Services"** → **"OAuth consent screen"** seçin
2. User Type seçin:
   - **Internal:** Sadece Google Workspace organizasyonunuzdaki kullanıcılar (eğer G Suite kullanıyorsanız)
   - **External:** Herhangi bir Google hesabı sahibi (önerilen)
3. "External" seçip **"Create"** butonuna tıklayın

#### App Information
- **App name:** `IWA Apps`
- **User support email:** `ersoy@iwaconcept.com.tr` (veya sizin email'iniz)
- **App logo:** (Opsiyonel - logo yükleyebilirsiniz)

#### App Domain (Opsiyonel ama önerilen)
- **Application home page:** `https://apps.iwa.web.tr`
- **Application privacy policy link:** `https://apps.iwa.web.tr/privacy`
- **Application terms of service link:** `https://apps.iwa.web.tr/terms`

#### Authorized Domains
Ekleyin:
- `iwa.web.tr`

#### Developer Contact Information
- **Email addresses:** `ersoy@iwaconcept.com.tr`

"Save and Continue" butonuna tıklayın.

---

### 4. Scopes (İzinler)

1. **"Add or Remove Scopes"** butonuna tıklayın
2. Şu scope'ları ekleyin:
   - ✅ `openid`
   - ✅ `email`
   - ✅ `profile`
   - ✅ `https://www.googleapis.com/auth/userinfo.email`
   - ✅ `https://www.googleapis.com/auth/userinfo.profile`

3. "Update" butonuna tıklayın
4. "Save and Continue"

---

### 5. Test Users (External için gerekli)

Eğer "External" seçtiyseniz ve henüz app'i yayınlamadıysanız:

1. **"Add Users"** butonuna tıklayın
2. Test kullanıcıları ekleyin:
   - `ersoy@iwaconcept.com.tr`
   - (Diğer test kullanıcılar...)
3. "Add" → "Save and Continue"

**NOT:** App'i "Publish" yapana kadar sadece bu kullanıcılar giriş yapabilir!

---

### 6. OAuth 2.0 Credentials Oluştur

1. Sol menüden **"APIs & Services"** → **"Credentials"** seçin
2. Üst kısımda **"+ CREATE CREDENTIALS"** butonuna tıklayın
3. **"OAuth client ID"** seçin

#### Application Type
- **Application type:** `Web application`
- **Name:** `IWA Apps SSO`

#### Authorized JavaScript Origins
Ekleyin:
```
https://apps.iwa.web.tr
http://localhost:5173
```

#### Authorized redirect URIs
Ekleyin:
```
https://apps.iwa.web.tr/auth/callback
https://apps.iwa.web.tr
http://localhost:5173/auth/callback
```

4. **"Create"** butonuna tıklayın

---

### 7. Credentials'ı Kaydet

Açılan pencerede:
- **Client ID:** `XXXXX.apps.googleusercontent.com` (KOPYALA!)
- **Client Secret:** `XXXXX` (KOPYALA!)

**ÖNEMLİ:** Bu bilgileri güvenli bir yere kaydedin!

---

### 8. Backend'e Credentials Ekle

#### Sunucuda:
```bash
ssh root@78.47.117.36
nano /var/www/apps-sso-backend/.env
```

Şu satırları bulup güncelleyin:
```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

Kaydedin (Ctrl+O, Enter, Ctrl+X) ve backend'i restart edin:
```bash
pm2 restart apps-sso-backend
pm2 logs apps-sso-backend --lines 20
```

#### Yerel Development için:
```bash
cd /Users/ahmetersoy/Desktop/apps-sso/backend
nano .env
```

Aynı şekilde güncelleyin.

---

### 9. Test Et

#### API Test (cURL):
```bash
# Local test
curl http://localhost:3005/health

# Server test
curl https://apps.iwa.web.tr/api/health
```

#### Google OAuth Test:
Frontend uygulamanızdan Google ile giriş yapın. İlk denemede:
- Google consent screen görünecek
- İzinleri onaylayın
- Giriş başarılı olmalı

---

## 🔄 App'i Yayınlama (Production)

### Publishing Status

Başlangıçta app'iniz **"Testing"** modunda:
- Sadece eklediğiniz test kullanıcıları giriş yapabilir
- Max 100 test user

**Production'a almak için:**

1. Sol menüden **"OAuth consent screen"** seçin
2. **"PUBLISH APP"** butonuna tıklayın
3. Onay bekleyin

**Verification Gerekli mi?**
- Eğer sensitive/restricted scope'lar kullanmıyorsanız → **Verification gerekmez**
- Sadece `openid`, `email`, `profile` kullanıyoruz → **Verification gerekmiyor** ✅

---

## 🛠️ Troubleshooting

### "redirect_uri_mismatch" Hatası

**Sebep:** Redirect URI'ler eşleşmiyor.

**Çözüm:**
1. Google Cloud Console → Credentials
2. OAuth 2.0 Client'ınızı düzenleyin
3. "Authorized redirect URIs" bölümünde URL'leri kontrol edin
4. Frontend'den gönderilen redirect_uri ile eşleşmeli

---

### "Access blocked: This app's request is invalid"

**Sebep:** OAuth consent screen eksik veya yanlış konfigüre edilmiş.

**Çözüm:**
1. OAuth consent screen'i tamamlayın
2. Authorized domains ekleyin
3. App'i publish edin veya kendinizi test user olarak ekleyin

---

### "invalid_client" Hatası

**Sebep:** Client ID veya Client Secret yanlış.

**Çözüm:**
1. Google Cloud Console → Credentials'dan tekrar kopyalayın
2. `.env` dosyasına doğru yapıştırdığınızdan emin olun
3. Backend'i restart edin: `pm2 restart apps-sso-backend`

---

### Test Kullanıcıları Eklemek İçin

```bash
# OAuth consent screen → Test users → Add users
ersoy@iwaconcept.com.tr
test@example.com
```

Max 100 test user ekleyebilirsiniz.

---

## 📊 Monitoring & Analytics

### Google Cloud Console'da İzleme

1. **APIs & Services** → **Dashboard**
   - API çağrılarınızı görün
   - Hata oranlarını takip edin

2. **OAuth consent screen** → **Metrics**
   - Kaç kullanıcı giriş yaptı
   - Consent verme oranları

---

## 🔐 Güvenlik Best Practices

✅ **Client Secret'ı asla commit etmeyin!**
- `.env` dosyası `.gitignore`'da olmalı

✅ **Redirect URIs'leri kısıtlayın**
- Sadece gerçekten kullandığınız URL'leri ekleyin

✅ **Production'da HTTPS kullanın**
- HTTP redirect URI'leri sadece development için

✅ **Scope'ları minimumda tutun**
- Sadece ihtiyacınız olan izinleri isteyin

---

## 📝 Özet Checklist

- [ ] Google Cloud Console'da proje oluşturuldu
- [ ] OAuth consent screen yapılandırıldı
- [ ] Scopes eklendi (`openid`, `email`, `profile`)
- [ ] OAuth 2.0 credentials oluşturuldu
- [ ] Authorized JavaScript origins eklendi
- [ ] Authorized redirect URIs eklendi
- [ ] Client ID ve Client Secret kaydedildi
- [ ] Backend `.env` dosyası güncellendi
- [ ] Backend restart edildi
- [ ] Health check başarılı
- [ ] Google login test edildi
- [ ] (Opsiyonel) App publish edildi

---

## 🆘 Yardım

**Resmi Dokümantasyon:**
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth Consent Screen Setup](https://support.google.com/cloud/answer/6158849)

**IWA Apps Backend Health Check:**
```bash
curl https://apps.iwa.web.tr/api/health
```

**PM2 Logs:**
```bash
ssh root@78.47.117.36
pm2 logs apps-sso-backend --lines 50
```

---

**Oluşturma Tarihi:** 2026-01-21
**Son Güncelleme:** 2026-01-21
**Hazırlayan:** IWA Apps Team
