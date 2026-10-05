# דיאגרמת סביבות — DentalTrack

עודכן: **2026-10-05**

---

## ארכיטקטורת המערכת

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│                                                                  │
│  🌐 Web Browser          📱 Android App (Capacitor)             │
│  http://localhost:5174   il.dentaltrack.app                      │
│  (React + Vite)          (WebView מעל React build)              │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP REST + Socket.io
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express)                            │
│                   http://localhost:5051                           │
│                                                                  │
│  /api/auth          JWT Authentication                           │
│  /api/work-orders   CRUD + stage updates + file upload           │
│  /api/messages      Chat per work order                          │
│  /api/admin         Super admin only                             │
│                                                                  │
│  Socket.io ──── real-time events:                               │
│    new_order / stage_updated / notification / message            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MongoDB                                    │
│             mongodb://localhost:27017/dental-track               │
│                                                                  │
│  Collections:                                                    │
│  workorders · users · labs · clinics                            │
│  messages · notifications · auditlogs                           │
│  subscriptions · supporttickets · errorlogs                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudinary (תמונות)                           │
│                   https://cloudinary.com                         │
│                                                                  │
│  dental-track/orders/       ← קבצי עבודות                      │
│  dental-track/stage-images/ ← תמונות שלבים                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## זרימת עבודה — Work Order Flow

```
רופא (Doctor)
    │
    │  POST /api/work-orders
    ▼
[scan_received] ──→ [order_opened] ──→ [cad_design]
                                            │
                                            ▼
                              [awaiting_approval] ◄── רופא צריך לאשר
                                            │
                              ┌─────────────┴──────────────┐
                         אישר │                            │ דחה
                              ▼                            ▼
                          [approved]               חוזר ל-[cad_design]
                              │
                              ▼
                       [manufacturing]
                              │
                              ▼
                          [finishing]
                              │
                              ▼
                        [quality_check]
                              │
                              ▼
                       [ready_to_ship] ──→ שליח מקבל התראה
                              │
                              ▼
                        [with_courier]
                              │
                              ▼
                          [delivered] ──→ Socket event לרופא
```

---

## הרשאות לפי תפקיד

| פעולה | doctor | lab_manager | technician | courier | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|
| יצירת עבודה | ✅ | ❌ | ❌ | ❌ | ✅ |
| אישור/דחיית עבודה | ✅ | ❌ | ❌ | ❌ | ✅ |
| קידום שלב | ❌ | ✅ | ✅ | ❌ | ✅ |
| הקצאת טכנאי | ❌ | ✅ | ❌ | ❌ | ✅ |
| ראיית כל העבודות | ❌ | ✅ | ❌ | ❌ | ✅ |
| עבודות שליח בלבד | ❌ | ❌ | ❌ | ✅ | ✅ |
| ממשק Admin | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## כתובות חיות

| סביבה | שירות | כתובת |
|---|---|---|
| LOCAL | Frontend | http://localhost:5174 |
| LOCAL | Backend API | http://localhost:5051/api |
| LOCAL | MongoDB | mongodb://localhost:27017/dental-track |
| LOCAL (Android) | Backend מהטלפון | http://10.0.0.7:5051/api |
| PRODUCTION | Frontend | TBD (Render) |
| PRODUCTION | Backend | TBD (Render) |
| PRODUCTION | MongoDB | TBD (MongoDB Atlas) |
| PRODUCTION | קבצים | Cloudinary |

---

## חינם / תשלום

| שירות | תוכנית | עלות | הערות |
|---|---|---|---|
| MongoDB (LOCAL) | Community | ₪0 | מקומי |
| MongoDB Atlas (PROD) | M0 Free | ₪0 | עד 512MB |
| Cloudinary | Free | ₪0 | עד 25 קרדיטים/חודש |
| Render (Frontend) | Free | ₪0 | Sleep אחרי חוסר פעילות |
| Render (Backend) | Free | ₪0 | Sleep אחרי חוסר פעילות |
| APK (Android debug) | — | ₪0 | לא דרוש Play Store |
| Google Play Store | חד-פעמי | $25 ≈ ₪75 | אם רוצים להפיץ |

> ראה פירוט עלויות מלא: [`tasks/costs.md`](./tasks/costs.md)
