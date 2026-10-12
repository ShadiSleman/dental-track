# דרישות מוצר — DentalTrack

מעדכנים את הקובץ הזה בכל דרישה חדשה או שינוי מהמשתמש.
מה שנסגר עובר גם ל־`done.md`.

---

## כללי המוצר

- **שם האפליקציה:** DentalTrack
- **מזהה Android:** `il.dentaltrack.app`
- **שפה:** עברית (RTL), ממשק מימין לשמאל
- **פלטפורמות:** Web (Vite + React) + Android (Capacitor)
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **סביבה מקומית:** frontend `http://localhost:5174`, backend `http://localhost:5051`

---

## תפקידים במערכת

| תפקיד | אימייל demo | סיסמה | תיאור |
|---|---|---|---|
| super_admin | admin@dentaltrack.co.il | admin123 | מנהל מערכת כולל |
| doctor | doctor@demo.co.il | demo123 | רופא — שולח עבודות |
| lab_manager | labmanager@demo.co.il | demo123 | מנהל מעבדה |
| technician | technician@demo.co.il | demo123 | טכנאי — מבצע עבודות |
| courier | courier@demo.co.il | demo123 | שליח — מחזיר/מעביר עבודות |

---

## שלבי עבודה (Stages)

| מפתח | תווית | צבע |
|---|---|---|
| scan_received | סריקה התקבלה | אפור |
| order_opened | עבודה נפתחה | כחול |
| cad_design | תכנון CAD | אינדיגו |
| awaiting_approval | ממתין לאישור רופא | צהוב |
| approved | אושר | ירוק בהיר |
| manufacturing | בייצור | ציאן |
| finishing | צביעה / גימור | סגול |
| quality_check | בקרת איכות | כתום |
| ready_to_ship | מוכן למשלוח | טיל |
| with_courier | אצל שליח | ורוד |
| delivered | נמסר למרפאה | ירוק |

---

## סוגי עבודות

`crown` כתר · `bridge` גשר · `implant` שתל · `veneer` ויניר · `denture` תותבת · `nightguard` סד לילה · `other` אחר

---

## מסכי הרופא

- **DoctorDashboard:** טאבים — כל העבודות / ממתין לאישור / בתהליך / במשלוח / הושלמו
- KPI: עבודות פעילות, ממתין לאישור (צהוב), מאחרות (אדום)
- התראה כשיש עבודה עם שליח 🚚
- **NewWorkOrder:** יצירת עבודה חדשה — שם פרטי + שם משפחה (ללא קוד מטופל), מין, תאריך לידה (גיל מחושב אוטומטית), תאריך סריקת עבודה, הערות, קבצים. ללא שדה סוג עבודה וללא תאריך יעד לאספקה.
- **WorkOrderDetail:** ציר זמן שלבים, צ'אט, חתימה, קבצים, אישור/דחיית עבודה

## מסכי המעבדה

- **LabDashboard:** כל העבודות, פילטר — פתוחות / מאחרות / הושלמו
- **LabStats:** סטטיסטיקות — KPI, גרף חודשי, עוגה בזמן/מאחר, בר לפי שלב, בר לפי סוג, ביצועי טכנאים
- כפתור "סטטיסטיקות" בניווט → `/lab/stats`

## מסכי הטכנאי

- **TechnicianView:** עבודות שהוקצו אליו, קידום שלבים

## מסך השליח

- **CourierView:** עבודות במצב `ready_to_ship` / `with_courier`, אפשרות קידום

## ממשק Admin (super_admin בלבד)

- `/admin` — Dashboard עם KPI + גרפים + הצטרפויות אחרונות
- `/admin/users` — ניהול משתמשים (עריכה, השבתה, איפוס סיסמה)
- `/admin/labs` — רשימת מעבדות + טכנאים + עבודות פתוחות + מנוי
- `/admin/subscriptions` — ניהול מנויים (active/trial/overdue/cancelled)
- `/admin/logs` — לוג ביקורת (audit logs)
- `/admin/health` — בריאות המערכת (uptime, MongoDB, socket clients, שגיאות)
- `/admin/support` — כרטיסי תמיכה (open/in_progress/resolved)

---

## נתיבי API עיקריים

| Method | Path | תיאור |
|---|---|---|
| POST | /api/auth/login | כניסה |
| GET | /api/work-orders/mine | עבודות של המשתמש |
| GET | /api/work-orders | כל העבודות (lab_manager) |
| GET | /api/work-orders/stats | סטטיסטיקות מעבדה |
| POST | /api/work-orders | יצירת עבודה חדשה |
| PATCH | /api/work-orders/:id/stage | קידום שלב |
| PATCH | /api/work-orders/:id/approve | אישור רופא |
| PATCH | /api/work-orders/:id/reject | דחייה עם סיבה |
| GET | /api/messages/:workOrderId | הודעות צ'אט |
| GET | /api/admin/stats | סטטיסטיקות מנהל |
| GET | /api/admin/health | בריאות המערכת |

---

## רופא בכמה מעבדות

- רופא לא שייך למעבדה אחת. כל מעבדה שמנהל/טכנאי מוסיף אליה רופא קיים (לפי אימייל) **מקשרת** אותו, בלי להסיר מעבדות קודמות.
- הרופא רואה בשליחת עבודה רק את המעבדות שקישרו אותו.
- הסרה מצוות מעבדה מנתקת את הקישור. החשבון נשאר, ושאר המעבדות נשארות.

## מנויים ומחירון

מחירון (`/admin/pricing`) חל על **מעבדה חדשה ועל חידוש חדש**. שינוי מחירון לא משנה מנוי שכבר נשמר.

| תכנית | ברירת מחדל (ללא מע״מ) | מתי |
|---|---|---|
| lab_lifetime_3y | ₪19,000 חד-פעמי | פתיחת מעבדה, 3 שנים |
| lab_starter | ₪290 לחודש | אחרי 3 שנים, עד 3 רופאים |
| lab_standard | ₪590 לחודש | אחרי 3 שנים, עד 10 רופאים |
| lab_pro | ₪990 לחודש | אחרי 3 שנים, ללא הגבלת רופאים |

מעבדות שנרשמו לפני עדכון המחירון נשארות על הסכום שנשמר להן (למשל ₪19,900).
במעבדות ובדשבורד המעבדות מסווגות ל־**בתוך 3 שנים** או **חודשי אחרי 3 שנים**, עם תאריך סיום ליד מספר הימים שנותרו.
ארבעת מחירי המחירון נערכים במקום (דשבורד, מעבדות, ומסך מחירון) ונשמרים בנפרד לכל שדה.
דוגמה למעבדה שסיימה 3 שנים ועברה לחודשי: **אורתו-דנט** — `after3@dentaltrack.co.il` / `local123`.

---

## Android / Mobile

- פלטפורמה: Capacitor 7
- appId: `il.dentaltrack.app`
- webDir: `dist`
- כשבונים ל-mobile: `npm run build:mobile` → `npx cap sync android`
- ה-API URL ב-.env חייב להיות IP המחשב (לא localhost) בזמן בדיקה מהטלפון
- APK נמצא ב: `android/app/build/outputs/apk/debug/app-debug.apk`
