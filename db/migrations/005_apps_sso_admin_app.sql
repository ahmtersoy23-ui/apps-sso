-- Migration: Apps-SSO admin uygulamasi olarak kayit + super admin role atamasi
-- Tarih: 2026-04-30
-- Amac: Privilege escalation duzeltmesi. Onceden "herhangi bir app'te admin = SSO admin"
--       Yeni model: SADECE apps-sso uygulamasinda admin rolu olan = SSO admin

BEGIN;

-- 1. Apps-SSO uygulamasini applications tablosuna ekle
INSERT INTO applications (app_code, app_name, app_description, app_url, is_active)
VALUES (
  'apps-sso',
  'Apps SSO Admin',
  'Centralized SSO administration: kullanici yonetimi, role atamasi, secret rotation',
  'https://apps.iwa.web.tr/admin',
  true
)
ON CONFLICT (app_code) DO NOTHING;

-- 2. Super admin'lere apps-sso/admin role ata
-- Mevcut durumda ersoy@ ve huseyin@ tum 11 uygulamada admin -> super admin sayilirlar
-- Baska kisi eklemek istiyorsan bu listeyi guncelle ve tekrar calistir (ON CONFLICT DO UPDATE)
INSERT INTO user_app_roles (user_id, app_id, role_id)
SELECT u.user_id, a.app_id, r.role_id
FROM users u
CROSS JOIN applications a
CROSS JOIN roles r
WHERE u.email IN (
    'ersoy@iwaconcept.com.tr',
    'huseyin@iwaconcept.com.tr'
  )
  AND a.app_code = 'apps-sso'
  AND r.role_code = 'admin'
ON CONFLICT (user_id, app_id) DO UPDATE SET role_id = EXCLUDED.role_id;

-- 3. Dogrulama: kac kisi apps-sso/admin oldu?
DO $$
DECLARE
  admin_count INT;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM user_app_roles uar
  JOIN applications a ON uar.app_id = a.app_id
  JOIN roles r ON uar.role_id = r.role_id
  WHERE a.app_code = 'apps-sso' AND r.role_code = 'admin';

  RAISE NOTICE 'Apps-SSO admin sayisi: %', admin_count;

  IF admin_count = 0 THEN
    RAISE EXCEPTION 'KRITIK: Hicbir kullaniciya apps-sso/admin role atanmadi. Migration BASARISIZ.';
  END IF;
END $$;

COMMIT;
