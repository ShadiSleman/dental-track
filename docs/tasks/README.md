# תיעוד DentalTrack — מדריך

קבצי התיעוד בתיקייה זו מתעדכנים אוטומטית בכל שיחה ב-Cursor.

---

## קבצים

| קובץ | תוכן |
|---|---|
| [`requirements.md`](./requirements.md) | ספציפיקציית המוצר החיה — דרישות, תפקידים, שלבים, API |
| [`remaining.md`](./remaining.md) | משימות פתוחות (checkboxes) |
| [`done.md`](./done.md) | משימות שהושלמו עם תאריך |
| [`environments.md`](./environments.md) | פרטי סביבות, כתובות, משתני סביבה, הרצה |

---

## כלל עדכון אוטומטי

קובץ `.cursor/rules/update-docs.mdc` גורם ל-AI לעדכן את קבצי ה-MD אוטומטית בכל פעם שמתבצע שינוי בפרויקט — בלי שצריך לבקש ידנית.

- דרישה חדשה → `requirements.md`
- משימה הסתיימה → `done.md` + מסמן ב-`remaining.md`
- משימה פתוחה → `remaining.md`
