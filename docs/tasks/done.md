# מה הושלם — DentalTrack

---

## Sprint 1 — MVP ראשוני (ספטמבר 2026)

- הקמת הפרויקט: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + MongoDB/Mongoose
- אימות JWT
- 5 תפקידי משתמש
- 11 שלבי עבודה
- Chat per work order (Socket.io)
- Notification Bell (Socket.io)
- Admin Dashboard
- Statistics page (LabStats)
- Build APK (Capacitor Android)

---

## Sprint 2 — תשתית Production (אוקטובר 2026)

| שינוי | פרטים |
|---|---|
| Android הוסר | responsive web בלבד |
| Socket.io הוסר | polling כל 4/10 שניות |
| MongoDB → PostgreSQL | Prisma + Neon |
| Cloudinary → R2 | Cloudflare R2 S3-compatible |
| Render → Vercel | Serverless Functions |
| GitHub | https://github.com/ShadiSleman/dental-track |
| Prisma schema | כל 9 מודלים עם Json columns |
| seed.js | Prisma version |
| seedDummy.js | 16 עבודות + messages + notifications |
| usePolling | מחליף useSocket |
| api/index.js | Vercel serverless entry |
| vercel.json | routing /api/* + /* |
| .env.example | עודכן לכל משתני הסביבה החדשים |
| docs/ | עודכנו כל קבצי התיעוד |
| Neon PostgreSQL | prisma db push הצליח, seed רץ |
| Vercel deploy | 6 ENV vars + Production build ✅ |
| ChatPanel | הוחלף useSocket ב-setInterval polling |
