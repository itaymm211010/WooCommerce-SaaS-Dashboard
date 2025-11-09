# 🔧 תיקון בעיית Magic Link - "Invalid Token Signature"

## 📋 הבעיה
כאשר משתמש חדש מקבל הזמנה ולוחץ על "Log In" במייל, הוא:
1. מועבר לדף `https://lovable.dev/login` (לא לאפליקציה)
2. מקבל שגיאה: **"Invalid token: signature is invalid"**

## 🎯 הסיבה
הקישור במייל מנסה לעבור דרך Lovable auth bridge במקום ללכת **ישירות** לאפליקציה שלך.

## ✅ הפתרון (2 שלבים)

### שלב 1: הגדרת Supabase Auth Settings

1. **עבור לדשבורד Supabase**:
   ```
   https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/auth/url-configuration
   ```

2. **הגדר את ה-Site URL**:
   - שנה את Site URL ל: `https://preview--smart-woo-dashboard.lovable.app`
   - (זו כתובת האפליקציה שלך ב-Lovable Preview)

3. **הוסף Redirect URLs**:
   לחץ על "Add URL" והוסף את הכתובות הבאות:
   ```
   https://preview--smart-woo-dashboard.lovable.app/**
   http://localhost:5173/**
   http://localhost:*/**
   http://127.0.0.1:*/**
   ```

4. **שמור את השינויים** (Save)

### שלב 2: הגדרת משתני סביבה ב-Lovable

1. **עבור להגדרות הפרויקט ב-Lovable**:
   - לחץ על Settings בפרויקט
   - חפש "Environment Variables"

2. **הוסף משתנה סביבה**:
   ```
   Name: VITE_APP_URL
   Value: https://preview--smart-woo-dashboard.lovable.app
   ```

3. **שמור וטען מחדש** את האפליקציה

## 🧪 בדיקה

לאחר השינויים:

1. נסה להזמין משתמש חדש מ-Store Users
2. המשתמש יקבל מייל עם "Log In"
3. לחיצה על "Log In" תוביל ישירות ל: `https://preview--smart-woo-dashboard.lovable.app`
4. המשתמש יתחבר אוטומטית ויועבר לדף הבית

## 📝 הערות חשובות

- אם יש לך דומיין production (לא preview), הוסף גם אותו ל-Redirect URLs
- אם תשנה את שם הפרויקט ב-Lovable, תצטרך לעדכן את ה-URLs ב-Supabase
- השינויים ב-Supabase Auth Settings תקפים מיידית, לא צריך לעשות deploy מחדש

## 🔍 מה קרה?

**לפני התיקון**:
```
User clicks "Log In" →
Supabase tries to redirect to app →
Lovable intercepts and sends to lovable.dev/login →
Token becomes invalid ❌
```

**אחרי התיקון**:
```
User clicks "Log In" →
Supabase redirects directly to your app →
App receives valid token →
User logs in successfully ✅
```

## 💡 Troubleshooting

אם עדיין יש בעיה:

1. **בדוק את ה-URL במייל** - האם הוא מתחיל ב-`https://preview--smart-woo-dashboard.lovable.app`?
2. **נקה cache** - נסה במצב incognito
3. **בדוק Console** - פתח Developer Tools וחפש שגיאות
4. **בדוק Supabase Logs** - עבור ל-Logs בדשבורד Supabase

---

**אם הכל עבד**: מחק את הקובץ הזה ותהנה! 🎉
