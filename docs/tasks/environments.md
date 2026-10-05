# סביבות — DentalTrack

---

## סביבה מקומית (LOCAL)

| שירות | כתובת | הערות |
|---|---|---|
| Frontend (Vite) | http://localhost:5174 | `npm run dev` |
| Backend (Express) | http://localhost:5051 | `cd server && npm run dev` |
| MongoDB | mongodb://localhost:27017/dental-track | חייב לרוץ מראש |
| Android API URL | http://10.0.0.7:5051/api | ה-IP של המחשב ב-WiFi |

### הרצה מקומית
```bash
# Backend
cd server && npm run dev

# Frontend (טרמינל נפרד)
npm run dev

# Seed ראשי (יוצר users, lab, clinic)
cd server && npm run seed

# Seed נתוני demo (עבודות, הודעות, לוגים...)
cd server && npm run seed:dummy
```

---

## משתני סביבה

### frontend `.env`
```
VITE_API_URL=http://localhost:5051/api
# בזמן בדיקה מהטלפון — שנה ל-IP המחשב:
# VITE_API_URL=http://10.0.0.7:5051/api
```

### server `server/.env`
```
PORT=5051
MONGO_URI=mongodb://localhost:27017/dental-track
JWT_SECRET=change-this-to-a-secure-random-string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5174
NODE_ENV=development
```

---

## Android / Mobile

| פריט | ערך |
|---|---|
| appId | il.dentaltrack.app |
| appName | DentalTrack |
| webDir | dist |
| APK debug | android/app/build/outputs/apk/debug/app-debug.apk |

### בנייה ל-mobile
```bash
npm run build:mobile   # בנייה עם base ./
npx cap sync android   # סנכרון ל-android/
npx cap open android   # פתיחה ב-Android Studio
```

---

## Production (עתידי — Render)

| שירות | כתובת | הערות |
|---|---|---|
| Frontend | TBD | render.yaml מוגדר |
| Backend | TBD | render.yaml מוגדר |
| MongoDB | MongoDB Atlas | לא localhost |

> ראה `render.yaml` בשורש הפרויקט לתצורת deployment ב-Render.

---

## מבנה הקוד

```
dental-track/
├── src/                    # Frontend React
│   ├── api/               # קריאות API
│   ├── components/        # רכיבים משותפים
│   ├── pages/             # מסכים לפי תפקיד
│   │   └── admin/        # ממשק מנהל
│   ├── store/             # Zustand stores
│   ├── hooks/             # custom hooks
│   └── types.ts           # טיפוסי TypeScript
├── server/                # Backend Node.js
│   └── src/
│       ├── models/        # Mongoose models
│       ├── routes/        # Express routes
│       ├── middleware/    # authJwt, roleGuard, auditLogger
│       ├── socket/        # Socket.io events
│       └── scripts/       # seed.js, seedDummy.js
├── android/               # Capacitor Android
├── docs/                  # תיעוד זה
└── public/                # קבצים סטטיים
```
