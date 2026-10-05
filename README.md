# DentalTrack 🦷

מערכת לניהול עבודות שיניים בין מרפאות ומעבדות.

## טכנולוגיות

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express + MongoDB (Mongoose) + Socket.io
- **Mobile:** Capacitor 7 (Android)
- **State:** Zustand
- **Charts:** Recharts

## הרצה מהירה

```bash
# 1. התקנת תלויות
npm install
cd server && npm install && cd ..

# 2. יצירת קבצי סביבה
cp .env.example .env
cp server/.env.example server/.env

# 3. הפעלת השרתים
cd server && npm run dev      # Backend :5051
npm run dev                    # Frontend :5174

# 4. יצירת נתוני demo
cd server && npm run seed && npm run seed:dummy
```

## כניסה למערכת

| תפקיד | אימייל | סיסמה |
|---|---|---|
| מנהל מערכת | admin@dentaltrack.co.il | admin123 |
| רופא | doctor@demo.co.il | demo123 |
| מנהל מעבדה | labmanager@demo.co.il | demo123 |
| טכנאי | technician@demo.co.il | demo123 |
| שליח | courier@demo.co.il | demo123 |

## תיעוד

ראה תיקיית [`docs/tasks/`](./docs/tasks/README.md) לספציפיקציה, משימות וסביבות.

## Android

```bash
npm run build:mobile
npx cap sync android
npx cap open android   # ואז ▶ Run ב-Android Studio
```
