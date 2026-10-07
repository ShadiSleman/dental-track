# סביבות — DentalTrack

> **עדכון אוקטובר 2026** — הפרויקט עבר ל-Vercel + PostgreSQL/Neon + Cloudflare R2.
> אין יותר Android App, MongoDB, Socket.io, Render.

---

## סביבות

| סביבה | APP_ENV | Frontend | Backend | DB (Neon) |
|---|---|---|---|---|
| **LOCAL** | `local` | http://localhost:5174 | http://localhost:5051 | branch `main` (dev) |
| **DEV** | `dev` | https://dental-track-dev.vercel.app | Vercel Serverless | branch `dev` |
| **PROD** | `prod` | https://dental-track-eight.vercel.app | Vercel Serverless | branch `main` |

---

## הרצה מקומית (LOCAL)

```bash
# 1. התקנת dependencies
npm install
cd server && npm install && cd ..

# 2. יצירת .env בשורש (ראה .env.example)
cp .env.example .env
# ← ערוך .env עם credentials אמיתיים

# 3. הרצת prisma db push (יוצר טבלאות ב-Neon)
npx prisma db push

# 4. Seed ראשי (users, lab, clinic, subscription)
node server/src/scripts/seed.js

# 5. Seed נתוני demo
node server/src/scripts/seedDummy.js

# 6. הרצת כל הפרויקט (frontend + backend)
npm run dev
```

---

## משתני סביבה (`.env` בשורש)

```env
APP_ENV=local

JWT_SECRET=change_me_to_a_long_random_string

# Neon PostgreSQL — נוצר ב-console.neon.tech
DATABASE_URL=postgresql://USER:PASS@HOST/dental_track?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://USER:PASS@HOST/dental_track?sslmode=require

# Cloudflare R2 — נוצר ב-dash.cloudflare.com
R2_ACCOUNT_ID=4f5da284966441ad72099de8f367a4ae
R2_ACCESS_KEY_ID=309e2094ee04bca1cf8259a26f936dac
R2_SECRET_ACCESS_KEY=364aa24a30f60a24d985c15dd8abda9dbf6765c930f8ef487f2074999a6eb937
R2_BUCKET_NAME=dental-track
R2_PUBLIC_URL=https://pub-1b21d9a118e549d88248f3133255af62.r2.dev

PORT=5051
FRONTEND_URL=http://localhost:5174
```

---

## Vercel Deploy

### Deploy מ-GitHub (אוטומטי)
1. GitHub repo: https://github.com/ShadiSleman/dental-track
2. Vercel מחובר ל-GitHub — כל push ל-`master` → deploy ל-DEV
3. Promote ל-Production → ENV prod

### Build Settings ב-Vercel
| הגדרה | ערך |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install && cd server && npm install && cd ..` |
| Node Version | 20.x |

### ENV vars ב-Vercel Dashboard
העתק את כל משתני `.env` ל-Vercel → Settings → Environment Variables
(שנה `APP_ENV=dev` לסביבת Preview, `APP_ENV=prod` לסביבת Production)

---

## מבנה הפרויקט

```
dental-track/
├── api/
│   ├── index.js          ← Vercel Serverless entry (מייבא את app.js)
│   └── package.json      ← {"type": "commonjs"}
├── prisma/
│   └── schema.prisma     ← Prisma schema (PostgreSQL)
├── server/
│   └── src/
│       ├── app.js        ← Express app (ללא listen)
│       ├── server.js     ← local dev server
│       ├── lib/
│       │   ├── prisma.js ← Prisma Client singleton
│       │   ├── r2.js     ← Cloudflare R2 upload
│       │   └── withId.js ← _id backward-compat transform
│       ├── routes/       ← auth, workOrders, messages, notifications, admin
│       ├── middleware/    ← authJwt, roleGuard, auditLogger
│       └── scripts/      ← seed.js, seedDummy.js
├── src/                  ← React frontend
│   ├── hooks/
│   │   └── usePolling.ts ← polling every 4s (מחליף Socket.io)
│   ├── api/              ← axios API clients
│   ├── components/
│   ├── pages/
│   ├── store/
│   └── types.ts
├── .env.example
├── vercel.json
└── package.json
```

---

## ארכיטקטורה

```
Browser (React/Vite)
    │
    │  HTTPS
    ▼
Vercel CDN (dist/)
    │
    │  /api/* routes (vercel.json)
    ▼
Vercel Serverless Function (api/index.js)
    │
    ├──► Neon PostgreSQL (Prisma Client, pgBouncer pooling)
    └──► Cloudflare R2 (S3-compatible, file uploads)
```

### Polling במקום Socket.io
- כל 4 שניות → `GET /api/notifications` → עדכון NotificationBell
- כל 10 שניות → `GET /api/work-orders/mine` → עדכון dashboard
- עלות: 0 (Vercel Serverless + Neon Free Tier)

---

## Neon Project Setup ✅ (הושלם)

- Project ID: `bitter-sea-76544202`
- Default branch: `production` (branch ID: `br-little-mud-b1kzb2m4`)
- Endpoint ID: `ep-odd-snow-b1295ibo`
- Region: EU Central 1 (Frankfurt)

### פורמט Connection Strings
```
# DATABASE_URL (pooled — pgBouncer)
postgresql://neondb_owner:PASSWORD@ep-odd-snow-b1295ibo-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# DIRECT_URL (direct — prisma migrations / db push)
# שים לב: כולל .c-5. בשם המארח (ללא -pooler)
postgresql://neondb_owner:PASSWORD@ep-odd-snow-b1295ibo.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

> ⚠️ שים לב: DIRECT_URL חייב לכלול `.c-5.` (region-code) — ללא זה `prisma db push` ייכשל עם P1000!

---

## Cloudflare R2 Setup ✅ (הושלם אוקטובר 2026)

- Account ID: `4f5da284966441ad72099de8f367a4ae`
- Bucket: `dental-track` (Eastern Europe, Standard)
- Public URL: `https://pub-1b21d9a118e549d88248f3133255af62.r2.dev` (Public Development URL מופעל)
- S3 Endpoint: `https://4f5da284966441ad72099de8f367a4ae.r2.cloudflarestorage.com`
- Token: "R2 Account Token" — permissions: Object Read & Write, All buckets
- כל 5 env vars נוספו ל-Vercel Production (אוקטובר 2026)
