# ×× ×××©×× â DentalTrack

---

## Sprint 1 â MVP ×¨××©×× × (×¡×¤××××¨ 2026)

- ××§××ª ××¤×¨×××§×: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + MongoDB/Mongoose
- ×××××ª JWT
- 5 ×ª×¤×§××× ××©×ª××©
- 11 ×©××× ×¢××××
- Chat per work order (Socket.io)
- Notification Bell (Socket.io)
- Admin Dashboard
- Statistics page (LabStats)
- Build APK (Capacitor Android)

---

## Sprint 2 â ×ª×©×ª××ª Production (×××§××××¨ 2026)

| ×©×× ×× | ×¤×¨××× |
|---|---|
| Android ×××¡×¨ | responsive web ×××× |
| Socket.io ×××¡×¨ | polling ×× 4/10 ×©× ×××ª |
| MongoDB â PostgreSQL | Prisma + Neon |
| Cloudinary â R2 | Cloudflare R2 S3-compatible |
| Render â Vercel | Serverless Functions |
| GitHub | https://github.com/ShadiSleman/dental-track |
| Prisma schema | ×× 9 ×××××× ×¢× Json columns |
| seed.js | Prisma version |
| seedDummy.js | 16 ×¢×××××ª + messages + notifications |
| usePolling | ×××××£ useSocket |
| api/index.js | Vercel serverless entry |
| vercel.json | routing /api/* + /* |
| .env.example | ×¢×××× ××× ××©×ª× × ××¡×××× ××××©×× |
| docs/ | ×¢×××× × ×× ×§××¦× ××ª××¢×× |
| Neon PostgreSQL | prisma db push ××¦×××, seed ×¨×¥ |
| Vercel deploy | 6 ENV vars + Production build â |
| ChatPanel | ×××××£ useSocket ×-setInterval polling |
| NewWorkOrder form | ×©×××ª ×××©××: ×©× ×¤×¨××/××©×¤××, ×××, ×ª. ×××× (××× ××××'), ×ª. ×¡×¨××§× â ×××¡×¨× workType + dueDate |

| 12/10/2026 | Multi-lab architecture — GET /api/labs, GET /api/labs/mine, lab selection in NewWorkOrder, LabLogo component, per-lab header in AppLayout, seedMultiLab.js |
| 12/10/2026 | רופא בכמה מעבדות (LabMember), מחירון נפרד שלא משנה מנויים קיימים, דוגמת אורתו-דנט אחרי 3 שנים |
