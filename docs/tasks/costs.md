# עלויות תפעול — DentalTrack

עודכן: **2026-10-05**
פירוט דיאגרמה: [`../diagrams-environments.md`](../diagrams-environments.md)

---

## תעריפים חיים (לעדכן תמיד)

| שירות | תוכנית | USD/חודש | ₪/חודש | מי משלם |
|---|---|---|---|---|
| MongoDB (LOCAL) | Community | $0 | ₪0 | — |
| MongoDB Atlas (PROD) | M0 Free Tier | $0 | ₪0 | מפעיל המערכת |
| MongoDB Atlas (PROD) | M10 (אם גדלים) | $57 | ₪171 | מפעיל המערכת |
| Cloudinary | Free | $0 | ₪0 | מפעיל המערכת |
| Cloudinary | Plus | $89 | ₪267 | מפעיל המערכת |
| Render (Web Service) | Free | $0 | ₪0 | מפעיל המערכת |
| Render (Web Service) | Starter | $7 | ₪21 | מפעיל המערכת |
| Google Play Store | חד-פעמי | $25 | ₪75 | מפעיל המערכת |
| Apple App Store | שנתי | $99 | ₪297 | מפעיל המערכת |

שער: ≈ ₪3.0 ל-$1

---

## תוכנית חינם — מגבלות

### MongoDB Atlas M0
| מגבלה | ערך |
|---|---|
| אחסון | 512MB |
| עבודות (WorkOrders) | ~50,000 רשומות |
| חיבורים בו-זמנית | 500 |
| Shared cluster | כן — ביצועים לא מובטחים |

### Cloudinary Free
| מגבלה | ערך |
|---|---|
| קרדיטים/חודש | 25 |
| אחסון | 25GB |
| Bandwidth | 25GB/חודש |
| קובץ מקסימלי | 10MB |

> **קרדיט Cloudinary:** העלאת תמונה 1MB ≈ 0.02 קרדיטים. 25 קרדיטים ≈ 1,250 העלאות בחודש.

### Render Free
| מגבלה | ערך |
|---|---|
| Sleep | אחרי 15 דקות חוסר פעילות |
| Cold start | 30-60 שניות |
| Bandwidth | 100GB/חודש |
| Build minutes | 500/חודש |

---

## עלות לפי פעולה

| פעולה | עלות |
|---|---|
| יצירת עבודה חדשה | ₪0 |
| קידום שלב | ₪0 |
| העלאת קובץ / תמונה (Cloudinary) | ₪0 (בתוך מכסה חינם) |
| שליחת הודעת Socket.io | ₪0 |
| התראה (Notification) | ₪0 |

> DentalTrack **אינה** משתמשת ב-WhatsApp API, SMS, או תשלומים — אין עלויות per-message.

---

## סיכום חודשי — תרחישים

### תרחיש 1: מעבדה קטנה (עד 200 עבודות/חודש)
| שירות | עלות |
|---|---|
| MongoDB Atlas M0 | ₪0 |
| Cloudinary Free | ₪0 |
| Render Free | ₪0 |
| **סה"כ** | **₪0/חודש** |

### תרחיש 2: מעבדה בינונית (עד 2,000 עבודות/חודש)
| שירות | עלות |
|---|---|
| MongoDB Atlas M10 | ₪171 |
| Cloudinary Free | ₪0 |
| Render Starter | ₪21 |
| **סה"כ** | **₪192/חודש** |

### תרחיש 3: הפצה ב-Play Store (חד-פעמי)
| הוצאה | עלות |
|---|---|
| דמי רישום Google Play | ₪75 (חד-פעמי) |
| Signing key (APK release) | ₪0 |
| **סה"כ** | **₪75 פעם אחת** |

---

## מעקב שימוש — היכן לבדוק

| שירות | לינק לדשבורד |
|---|---|
| MongoDB Atlas | https://cloud.mongodb.com |
| Cloudinary | https://console.cloudinary.com |
| Render | https://dashboard.render.com |
| Google Play Console | https://play.google.com/console |

---

## היסטוריית עדכוני תעריפים

| תאריך | שינוי |
|---|---|
| 2026-10-05 | נוצר קובץ, תעריפים נוכחיים לפי Free tier |
