# מה נשאר לעשות — DentalTrack

> עדכון אחרון: אוקטובר 2026

---

## ✅ הושלם

### תשתית
- [x] מחיקת Android/Capacitor (הפרויקט הוא web-only)
- [x] מחיקת Socket.io → Polling כל 4/10 שניות
- [x] מחיקת MongoDB/Mongoose → PostgreSQL/Prisma (Neon)
- [x] מחיקת Cloudinary → Cloudflare R2
- [x] יצירת Prisma schema (כל 9 מודלים)
- [x] כתיבת כל ה-routes מחדש עם Prisma
- [x] מבנה Vercel Serverless (`api/index.js` + `vercel.json`)
- [x] GitHub repo: https://github.com/ShadiSleman/dental-track
- [x] usePolling hook (מחליף useSocket)
- [x] seed.js + seedDummy.js עם Prisma
- [x] Neon PostgreSQL — project `bitter-sea-76544202`, prisma db push ✅
- [x] Vercel deploy — Production build **Ready** ✅
- [x] ChatPanel — הוחלף useSocket ב-setInterval polling

### פיצ'רים
- [x] כל 11 שלבי עבודה (scan_received → delivered)
- [x] 5 תפקידי משתמש (doctor, lab_manager, technician, courier, super_admin)
- [x] Chat per work order
- [x] Notification Bell
- [x] Admin Dashboard (users, labs, subscriptions, logs, health, tickets)
- [x] Statistics (LabStats page עם גרפים)
- [x] Digital signature (courier delivery)
- [x] File uploads (R2)

---

## 🔲 נשאר לעשות

### חובה (לפני מעבר מלא)

1. **Cloudflare R2 Setup** (נדרש לupload קבצים)
   - [ ] יצור bucket `dental-track` ב-dash.cloudflare.com
   - [ ] יצור R2 API token (R2 permissions)
   - [ ] הפעל Public Access על הbucket
   - [ ] עדכן `.env` + Vercel env vars:
     - `R2_ACCOUNT_ID`
     - `R2_ACCESS_KEY_ID`
     - `R2_SECRET_ACCESS_KEY`
     - `R2_PUBLIC_URL`

2. **Neon Dev Branch** (optional — לסביבת פיתוח)
   - [ ] צור branch `dev` ב-Neon console
   - [ ] עדכן `.env` עם connection strings של `dev`

---

## 🔧 שיפורים עתידיים (optional)

- [ ] Email notifications (SendGrid)
- [ ] Push notifications (Web Push API)
- [ ] Work order PDF export
- [ ] Calendar view (תאריך יעד)
- [ ] Multi-language (i18n)
- [ ] PWA (manifest + service worker)
- [ ] Rate limiting per user (לא רק global)
- [ ] Prisma migrations (במקום db push)
