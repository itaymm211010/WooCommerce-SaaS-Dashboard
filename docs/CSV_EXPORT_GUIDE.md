# 📤 מדריך ייצוא נתונים מ-LOVABLE (CSV)

## סקירה כללית

מכיוון שאין גישה לסיסמת בסיס הנתונים של LOVABLE, נשתמש בייצוא CSV ידני דרך ממשק Supabase Studio.

---

## שלב 1: גישה ל-Supabase Studio של LOVABLE

### 1.1 כניסה ל-Studio

1. פתח דפדפן וגש ל:
   ```
   https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz
   ```

2. התחבר עם חשבון LOVABLE שלך

3. בתפריט צד, לחץ על: **Table Editor**

---

## שלב 2: זיהוי טבלאות עם נתונים

### 2.1 טבלאות קריטיות (חובה לייצא!)

אלו הטבלאות שכנראה מכילות נתונים חיוניים:

#### 🏪 ניהול חנויות (Store Management)
- ✅ **`stores`** - פרטי החנויות המחוברות
- ✅ **`profiles`** - פרופילי משתמשים
- ✅ **`store_users`** - הרשאות משתמשים לחנויות
- ✅ **`user_roles`** - תפקידי משתמשים

#### 📦 מוצרים (Products)
- ✅ **`products`** - קטלוג מוצרים
- ✅ **`product_images`** - תמונות מוצרים
- ✅ **`product_variations`** - וריאציות (צבעים, מידות)
- ✅ **`product_attributes`** - מאפייני מוצרים

#### 🗂️ טקסונומיות (Taxonomies)
- ✅ **`store_categories`** - קטגוריות
- ✅ **`store_tags`** - תגיות
- ✅ **`store_brands`** - מותגים
- ✅ **`store_attributes`** - מאפיינים גלובליים
- ✅ **`store_attribute_terms`** - ערכי מאפיינים

#### 📊 הזמנות (Orders)
- ✅ **`orders`** - הזמנות
- ✅ **`order_status_logs`** - היסטוריית סטטוס הזמנות

#### 🔗 Webhooks
- ⚪ **`webhooks`** - הגדרות webhooks (אופציונלי)
- ⚪ **`webhook_logs`** - לוגים (אופציונלי - נתונים רבים)

### 2.2 טבלאות אופציונליות

אלו אפשר לדלג עליהן אם ריקות:

#### 🔄 סנכרון (Sync)
- ⚪ **`sync_logs`** - לוגי סנכרון (ניתן להתחיל מחדש)
- ⚪ **`sync_errors`** - שגיאות (ניתן להתחיל מחדש)
- ⚪ **`taxonomy_sync_log`** - לוגי סנכרון טקסונומיות

#### 📝 ניהול פרויקט (Project Management)
- ⚪ **`sprints`** - ספרינטים
- ⚪ **`tasks`** - משימות
- ⚪ **`work_logs`** - לוגי עבודה
- ⚪ **`task_comments`** - תגובות
- ⚪ **`bug_reports`** - דוחות באגים
- ⚪ **`deployments`** - פריסות

#### 🤖 AI System
- ⚪ **`agent_insights`** - תובנות AI
- ⚪ **`agent_alerts`** - התראות
- ⚪ **`agent_execution_log`** - לוגי ביצוע

#### 🔐 אבטחה (Security/Audit)
- ⚪ **`credential_access_logs`** - לוגי גישה (אופציונלי)
- ⚪ **`audit_logs`** - לוגי ביקורת (אופציונלי)

---

## שלב 3: ייצוא טבלה ל-CSV

### עבור כל טבלה:

1. **בחר טבלה:**
   - ב-Table Editor, לחץ על שם הטבלה (למשל: `stores`)

2. **בדוק אם יש נתונים:**
   - האם יש שורות בטבלה?
   - אם הטבלה ריקה → דלג עליה

3. **ייצא ל-CSV:**
   - לחץ על כפתור **Export** או **Download CSV**
   - (אם אין כפתור Export, ראה "פתרונות חלופיים" למטה)

4. **שמור קובץ:**
   - שמור בשם: `<table_name>.csv`
   - דוגמה: `stores.csv`, `products.csv`

5. **העבר לתיקייה:**
   - העתק את הקובץ לתיקייה:
     ```
     WooCommerce-SaaS-Dashboard/csv-exports/
     ```

---

## שלב 4: פתרונות חלופיים (אם אין כפתור Export)

### אופציה 1: שימוש ב-SQL Editor

1. לך ל: **SQL Editor** בתפריט Supabase Studio

2. הרץ שאילתה:
   ```sql
   SELECT * FROM stores;
   ```

3. תוצאות השאילתה יכללו כפתור **Export to CSV**

### אופציה 2: העתקה ידנית (לטבלאות קטנות)

1. סמן את כל השורות בטבלה
2. העתק (**Ctrl+C**)
3. הדבק ב-Excel/Google Sheets
4. שמור כ-CSV

### אופציה 3: שימוש ב-API (מתקדם)

אם יש לך הרבה נתונים, אפשר לייצא דרך API:

```bash
# ייצוא טבלת stores
curl "https://ddwlhgpugjyruzejggoz.supabase.co/rest/v1/stores?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  | jq -r '(.[0] | keys_unsorted) as $keys | $keys, map([.[ $keys[] ]])[] | @csv' \
  > csv-exports/stores.csv
```

⚠️ **הערה:** זה לא יעבוד אם יש RLS policies שחוסמות גישה ללא authentication.

---

## שלב 5: אימות הקבצים

לפני שממשיכים, ודא:

### 5.1 מבנה הקובץ תקין

פתח קובץ CSV ובדוק:

✅ **שורה ראשונה = כותרות (headers):**
```csv
id,name,url,consumer_key,consumer_secret,created_at,updated_at,...
```

✅ **שורות נוספות = נתונים:**
```csv
1,My Store,https://example.com,ck_123...,cs_456...,2024-01-01,...
```

### 5.2 רשימת קבצים מומלצת

ודא שיש לך לפחות את הקבצים הבאים (אם הם מכילים נתונים):

```
csv-exports/
├── stores.csv              ← קריטי!
├── profiles.csv            ← קריטי!
├── products.csv            ← קריטי (אם יש מוצרים)
├── store_categories.csv    ← קריטי (אם יש קטגוריות)
├── store_tags.csv          ← קריטי (אם יש תגיות)
├── orders.csv              ← קריטי (אם יש הזמנות)
└── ...
```

---

## שלב 6: הרצת ייבוא

### 6.1 הכן את סביבת העבודה

```bash
cd WooCommerce-SaaS-Dashboard

# ודא שהתיקייה קיימת
mkdir -p csv-exports

# בדוק אילו קבצים יש
ls -lh csv-exports/
```

### 6.2 הגדר סיסמה בסקריפט

ערוך את הסקריפט:
```bash
nano scripts/import-csv.sh
```

מצא שורה:
```bash
NEW_SUPABASE_PASSWORD=""
```

החלף ל:
```bash
NEW_SUPABASE_PASSWORD="YOUR_POSTGRES_PASSWORD_FROM_COOLIFY"
```

💡 **איפה למצוא את הסיסמה:**
1. Coolify Dashboard → WooPilot → Supabase
2. Environment Variables
3. `POSTGRES_PASSWORD`

### 6.3 הרץ את הייבוא

```bash
./scripts/import-csv.sh
```

הסקריפט יבצע:
1. ✅ חיבור לבסיס הנתונים החדש
2. ✅ ייבוא כל קובץ CSV לפי הסדר (foreign keys)
3. ✅ דיווח על הצלחה/כישלון
4. ✅ ספירת שורות בכל טבלה

---

## שלב 7: אימות הנתונים

### 7.1 התחבר ל-Supabase Studio החדש

```
http://api.ssw-ser.com/
```

### 7.2 בדוק טבלאות

1. לך ל-Table Editor
2. בדוק כל טבלה שייבאת
3. ודא:
   - ✅ מספר השורות תואם ל-LOVABLE
   - ✅ הנתונים נראים תקינים
   - ✅ אין שורות ריקות/מקולקלות

### 7.3 בדוק Foreign Keys

הרץ ב-SQL Editor:

```sql
-- בדוק שכל המוצרים מקושרים לחנות קיימת
SELECT COUNT(*) FROM products
WHERE store_id NOT IN (SELECT id FROM stores);

-- תוצאה צריכה להיות: 0
```

אם התוצאה > 0 → יש בעיה! (מוצרים ללא חנות)

---

## שגיאות נפוצות ופתרונות

### ❌ "ERROR: duplicate key value violates unique constraint"

**בעיה:** כבר יש נתונים בטבלה

**פתרון:**
```sql
-- נקה טבלה לפני ייבוא חוזר
TRUNCATE stores CASCADE;
```

⚠️ **אזהרה:** `CASCADE` ימחק גם נתונים בטבלאות קשורות!

---

### ❌ "ERROR: insert or update on table violates foreign key constraint"

**בעיה:** הסדר הייבוא לא נכון

**פתרון:**
1. ייבא קודם טבלאות "הורה" (`stores`, `profiles`)
2. אחר כך טבלאות "ילד" (`products`, `orders`)

הסקריפט `import-csv.sh` כבר עושה את זה אוטומטית!

---

### ❌ "ERROR: permission denied for table"

**בעיה:** RLS מונע ייבוא

**פתרון:**
```sql
-- כבה RLS זמנית (רק לייבוא!)
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- אחרי הייבוא, הפעל בחזרה:
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
```

---

## סיכום Checklist

- [ ] התחברתי ל-Supabase Studio של LOVABLE
- [ ] זיהיתי אילו טבלאות מכילות נתונים
- [ ] ייצאתי את כל הטבלאות הקריטיות ל-CSV
- [ ] שמרתי קבצים בתיקייה `csv-exports/`
- [ ] הרצתי `./scripts/run-migrations.sh` (ליצירת Schema)
- [ ] הגדרתי סיסמה ב-`import-csv.sh`
- [ ] הרצתי `./scripts/import-csv.sh`
- [ ] אימתתי נתונים ב-Studio החדש
- [ ] בדקתי foreign keys ו-data integrity

---

## קישורים

- **LOVABLE Studio:** https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz
- **New Studio:** http://api.ssw-ser.com/
- **Database Schema:** [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
- **Migration Plan:** [MIGRATION_PLAN.md](../MIGRATION_PLAN.md)

---

**הבא:** אחרי ייבוא הנתונים → [העברת Edge Functions](./EDGE_FUNCTIONS_DEPLOYMENT.md)
