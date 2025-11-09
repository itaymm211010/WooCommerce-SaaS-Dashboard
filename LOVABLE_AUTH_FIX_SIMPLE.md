# 🔧 תיקון בעיית Magic Link - Lovable Cloud Database

## ❌ הבעיה
כשמשתמש חדש מקבל הזמנה ולוחץ "Log In", הוא מועבר ל-`lovable.dev/login` ומקבל שגיאה.

## ✅ הפתרון - דרך Lovable בלבד

### אופציה 1: דרך Lovable Settings (מומלץ)

1. **פתח את הפרויקט ב-Lovable**
2. לחץ על **⚙️ Settings** (למטה משמאל)
3. חפש **Database** או **Supabase Settings**
4. חפש **Auth Configuration** או **URL Configuration**
5. הגדר:
   - **Site URL**: `https://preview--smart-woo-dashboard.lovable.app`
   - **Redirect URLs**: `https://preview--smart-woo-dashboard.lovable.app/**`

### אופציה 2: פנה לתמיכת Lovable

אם אין אפשרות לשנות את ההגדרות האלו בממשק Lovable:

1. פנה לצ'אט תמיכה ב-Lovable (לחץ על 💬 בפינה)
2. בקש לעדכן את **Supabase Auth Site URL** ל:
   ```
   https://preview--smart-woo-dashboard.lovable.app
   ```
3. בקש להוסיף **Redirect URL**:
   ```
   https://preview--smart-woo-dashboard.lovable.app/**
   ```

### אופציה 3: אם יש לך גישה מלאה לדשבורד Supabase

רק אם אתה יכול להתחבר ישירות ל-Supabase Dashboard:
- עבור ל: https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz
- Authentication → URL Configuration
- עדכן כמו למעלה

אבל ב-Lovable Cloud זה בדרך כלל **לא נדרש**.

---

## 🎯 מה השינוי צריך להיות?

**Site URL** (כרגע כנראה): `https://lovable.dev` או ריק  
**צריך להיות**: `https://preview--smart-woo-dashboard.lovable.app`

**Redirect URLs** (צריך להוסיף):
- `https://preview--smart-woo-dashboard.lovable.app/**`
- `http://localhost:5173/**` (לפיתוח מקומי)

---

**האם יש לך גישה להגדרות Database ב-Lovable Settings?**
