# Apps-SSO

Merkezi kimlik dogrulama. Google OAuth + JWT + RBAC. Tum app'ler buna bagimli.

## Komutlar
```bash
cd backend && npm run dev     # ts-node-dev (port 3005)
cd frontend && npm run dev    # vite
cd backend && npm test        # jest (5 test)
```

## Kurallar
- Auth degisikligi TUM app'leri etkiler — dikkatli ol
- JWT secret DB'de saklanir (system_secrets tablosu, AES-256-GCM)
- Token verify: `/api/auth/verify` (2000 req/min rate limit)
- SwiftStock ve ManuMaestro kendi lokal user management'i var, digerleri SSO-only
