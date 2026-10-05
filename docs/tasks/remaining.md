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

### חובה (לפני production)

1. **Neon Setup**
   - [ ] צור project `dental-track` ב-console.neon.tech
   - [ ] צור branch `prod` לייצור
   - [ ] Copy connection strings → הכנס ל-.env

2. **R2 Setup**
   - [ ] יצור bucket `dental-track` ב-dash.cloudflare.com
   - [ ] יצור R2 API token
   - [ ] הפעל Public Access על הbucket
   - [ ] Copy credentials → הכנס ל-.env

3. **prisma db push**
   ```bash
   npx prisma db push
   node server/src/scripts/seed.js
   ```

4. **Vercel Deploy**
   - [ ] חבר GitHub repo ל-Vercel
   - [ ] הכנס כל ENV vars ב-Vercel Dashboard
   - [ ] בדוק שה-build עובד

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
