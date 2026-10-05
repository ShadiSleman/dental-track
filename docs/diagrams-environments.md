# דיאגרמת סביבות — DentalTrack

> עדכון אוקטובר 2026 — ראה גם [`diagrams-environments.html`](diagrams-environments.html) לגרסה ויזואלית עם zoom.

---

## ארכיטקטורה

```
Browser / Mobile Browser
        │
        │  HTTPS
        ▼
   ┌─────────────────────────────────────┐
   │           Vercel                    │
   │  ┌───────────┐  ┌────────────────┐  │
   │  │  CDN      │  │  Serverless    │  │
   │  │  dist/    │  │  api/index.js  │  │
   │  │  React    │  │  (Express)     │  │
   │  └───────────┘  └───────┬────────┘  │
   └──────────────────────────┼──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       Neon Postgres    Cloudflare R2    (future)
       (Prisma ORM)     (file storage)
```

---

## Polling (מחליף Socket.io)

```
Client (usePolling.ts)
  │
  ├── GET /api/notifications  ← כל 4 שניות
  │     └── updateNotifStore()
  │
  └── GET /api/work-orders/mine  ← כל 10 שניות
        └── updateOrdersStore()
```

---

## סביבות

| | LOCAL | DEV | PROD |
|---|---|---|---|
| **APP_ENV** | `local` | `dev` | `prod` |
| **Frontend** | localhost:5174 | Vercel Preview | Vercel Production |
| **Backend** | localhost:5051 | Vercel Serverless | Vercel Serverless |
| **DB** | Neon main branch | Neon main branch | Neon prod branch |
| **Files** | R2 `local/` prefix | R2 `dev/` prefix | R2 `prod/` prefix |

---

## שלבי עבודה

```
scan_received → order_opened → cad_design → awaiting_approval
     → approved → manufacturing → finishing → quality_check
          → ready_to_ship → with_courier → delivered
```

**כלל דחייה:** `awaiting_approval` → דחייה → חזרה ל-`cad_design`

---

## מבנה הפרויקט

```
dental-track/
├── api/
│   ├── index.js        ← Vercel Serverless (מייבא app.js)
│   └── package.json    ← {"type": "commonjs"}
├── prisma/
│   └── schema.prisma   ← PostgreSQL schema (10 models)
├── server/
│   └── src/
│       ├── app.js      ← Express app (ללא listen)
│       ├── server.js   ← local dev (listen :5051)
│       ├── lib/
│       │   ├── prisma.js   ← Prisma Client singleton
│       │   ├── r2.js       ← Cloudflare R2 upload
│       │   └── withId.js   ← _id backward-compat
│       ├── routes/     ← auth · workOrders · messages · notifications · admin
│       ├── middleware/ ← authJwt · roleGuard · auditLogger
│       └── scripts/    ← seed.js · seedDummy.js
├── src/                ← React 18 + TypeScript + Tailwind
│   ├── hooks/
│   │   └── usePolling.ts  ← polling hook
│   ├── api/            ← axios API clients
│   ├── components/
│   ├── pages/
│   ├── store/          ← Zustand (auth, orders, notif)
│   └── types.ts
├── docs/               ← תיעוד זה
├── .env.example
├── vercel.json
└── package.json
```

---

## GitHub

🔗 [https://github.com/ShadiSleman/dental-track](https://github.com/ShadiSleman/dental-track)
