# משימות פתוחות

מעבירים שורה ל־`done.md` כשמסתיימת. לא מוחקים בלי תיעוד.
דרישות מוצר שעודכנו מהמשתמש: [`requirements.md`](./requirements.md)

---

## Backend

- [ ] Cloudinary — להגדיר CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET ב-server/.env לצורך העלאת קבצים אמיתיים
- [ ] Push Notifications — לממש שליחת push notifications אמיתית (כרגע רק socket)
- [ ] JWT_SECRET — להחליף את הברירת מחדל לסוד אמיתי בסביבת production

## Frontend

- [ ] LabStats — לבדוק שגרף "עבודות לפי שלב" מציג נכון כשאין עבודות
- [ ] WorkOrderDetail — לבדוק תצוגה נכונה של חתימת שליח על מסכים קטנים

## Mobile (Android)

- [ ] להגדיר Push Notifications אמיתי ב-Android (Firebase / Capacitor PushNotifications)
- [ ] לבדוק את כל הטאבים על מסך Android קטן (360px)
- [ ] לשקול לחתום על APK (release signing) לפני הפצה ב-Play Store

## Admin

- [ ] AdminLabs — להוסיף אפשרות עריכת פרטי מעבדה ישירות מהממשק
- [ ] AdminUsers — לאפשר יצירת משתמש חדש ישירות מהממשק (כרגע רק seed)

## Deployment / Production

- [ ] להגדיר סביבת production עם MongoDB Atlas (לא localhost)
- [ ] render.yaml — לוודא תצורת deployment נכונה ב-Render
- [ ] FRONTEND_URL בסביבת production — לעדכן ל-URL האמיתי של הפרונטאנד
- [ ] להגדיר HTTPS עבור ה-API בסביבת production
