# 🛠️ WooPilot - Migration Scripts

סקריפטים אוטומטיים למיגרציה מ-LOVABLE ל-Supabase Self-Hosted על Coolify.

---

## 📋 רשימת סקריפטים

### 1. `run-migrations.sh` - הרצת קבצי מיגרציה

**מטרה:** יוצר את ה-Schema המלא (32 טבלאות, RLS, פונקציות) על Supabase החדש.

**שימוש:**
```bash
./scripts/run-migrations.sh
```

**דרישות:**
- ✅ Supabase מותקן ופועל על Coolify
- ✅ PostgreSQL נגיש (91.99.207.249:5432)
- ⚠️ **חובה להגדיר:** `NEW_SUPABASE_PASSWORD` בסקריפט

**מה זה עושה:**
1. מתחבר ל-PostgreSQL החדש
2. מריץ 48 קבצי מיגרציה לפי הסדר כרונולוגי
3. יוצר:
   - 32 טבלאות
   - 100+ RLS policies
   - 13 פונקציות
   - 29 טריגרים
   - 108+ אינדקסים
4. מציג דוח סיכום

**פלט לדוגמה:**
```
================================================
🚀 WooPilot - Database Schema Migration
================================================

Testing database connection...
✅ Connection successful!

Found 48 migration files

Running: 20240326000000_create_order_status_logs.sql
  ✅ Success
Running: 20251014171204_a710d0c6-2bbf-466b-a308-f72d0c8ef711.sql
  ✅ Success
...

================================================
📊 Migration Summary
================================================
Total migrations: 48
Successful: 48
Failed: 0

Tables created: 32
RLS policies: 105
Functions: 13

✅ Migration completed successfully!
```

---

### 2. `import-csv.sh` - ייבוא נתונים מ-CSV

**מטרה:** מייבא נתונים מקבצי CSV שייוצאו מ-LOVABLE.

**שימוש:**
```bash
# 1. הנח קבצי CSV בתיקייה:
mkdir -p csv-exports/
# העתק קבצים: stores.csv, products.csv, etc.

# 2. ערוך סקריפט והגדר סיסמה
nano scripts/import-csv.sh
# NEW_SUPABASE_PASSWORD="your-password"

# 3. הרץ ייבוא
./scripts/import-csv.sh
```

**דרישות:**
- ✅ Schema כבר קיים (הרצת `run-migrations.sh` קודם)
- ✅ קבצי CSV בתיקייה `csv-exports/`
- ⚠️ **חובה להגדיר:** `NEW_SUPABASE_PASSWORD` בסקריפט

**מה זה עושה:**
1. סורק את תיקיית `csv-exports/`
2. מייבא כל קובץ CSV לטבלה המתאימה
3. שומר על סדר נכון (foreign keys)
4. מציג דוח עם מספר שורות שיובאו

**סדר הייבוא (אוטומטי):**
```
1. profiles, stores                    (בסיס)
2. user_roles, store_users             (הרשאות)
3. store_categories, store_tags, ...   (טקסונומיות)
4. products, product_images, ...       (מוצרים)
5. orders, order_status_logs           (הזמנות)
6. webhooks, webhook_logs              (webhooks)
7. sync_logs, taxonomy_sync_log        (סנכרון)
8. tasks, sprints, bug_reports, ...    (ניהול פרויקט)
9. agent_insights, agent_alerts        (AI)
10. audit_logs, credential_access_logs (ביקורת)
```

**פלט לדוגמה:**
```
================================================
📦 WooPilot - CSV Data Import
================================================

Testing database connection...
✅ Connected to database

Importing: stores
  Rows in CSV: 3
  ✅ Success - imported 3 rows

Importing: products
  Rows in CSV: 150
  ✅ Success - imported 150 rows

...

================================================
📊 Import Summary
================================================
Total tables: 32
Imported: 15
Skipped: 17 (no CSV files)
Failed: 0
Total rows imported: 1,234

✅ Import completed successfully!
```

---

### 3. `backup-lovable-db.sh` - גיבוי מ-LOVABLE (לא זמין)

**סטטוס:** ⛔ **לא פעיל** - אין סיסמת DB ל-LOVABLE

**חלופה:** השתמש בייצוא CSV ידני דרך Supabase Studio.

ראה: [docs/CSV_EXPORT_GUIDE.md](../docs/CSV_EXPORT_GUIDE.md)

---

### 4. `import-to-new-supabase.sh` - ייבוא מגיבוי מלא

**סטטוס:** ⛔ **לא רלוונטי** - אין גיבוי pg_dump

**חלופה:** השתמש ב-`run-migrations.sh` + `import-csv.sh`

---

### 5. `test-lovable-api.sh` - בדיקת גישה ל-LOVABLE API

**מטרה:** בודק אם יש גישה ל-API של LOVABLE (למטרות דיבוג).

**שימוש:**
```bash
./scripts/test-lovable-api.sh
```

**תוצאה צפויה:**
```
Testing LOVABLE API access...
{"message":"Access denied"}
```

זה רק לבדיקה - לא חלק מתהליך המיגרציה.

---

## 🚀 תהליך המיגרציה המלא

### שלב 1: הכנה

```bash
cd WooCommerce-SaaS-Dashboard

# ודא שהסקריפטים ניתנים להרצה
chmod +x scripts/*.sh

# צור תיקייה לייצוא CSV
mkdir -p csv-exports
```

---

### שלב 2: יצירת Schema

```bash
# ערוך והגדר סיסמה
nano scripts/run-migrations.sh
# NEW_SUPABASE_PASSWORD="your-postgres-password-from-coolify"

# הרץ מיגרציה
./scripts/run-migrations.sh
```

**בדוק:**
- ✅ 48 מיגרציות הצליחו
- ✅ 32 טבלאות נוצרו
- ✅ 100+ RLS policies פעילים

---

### שלב 3: ייצוא נתונים מ-LOVABLE

עקוב אחרי המדריך המפורט:
📄 **[docs/CSV_EXPORT_GUIDE.md](../docs/CSV_EXPORT_GUIDE.md)**

**בקיצור:**
1. התחבר ל: https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz
2. Table Editor → בחר טבלה → Export to CSV
3. שמור קבצים ב-`csv-exports/`

**טבלאות קריטיות:**
- ✅ `stores.csv`
- ✅ `profiles.csv`
- ✅ `products.csv`
- ✅ `store_categories.csv`
- ✅ `store_tags.csv`
- ✅ `orders.csv`

---

### שלב 4: ייבוא נתונים

```bash
# ערוך והגדר סיסמה (אותה מהשלב 2)
nano scripts/import-csv.sh
# NEW_SUPABASE_PASSWORD="your-postgres-password-from-coolify"

# הרץ ייבוא
./scripts/import-csv.sh
```

**בדוק:**
- ✅ כל הקבצים יובאו בהצלחה
- ✅ מספר שורות תואם ל-LOVABLE
- ✅ אין שגיאות foreign key

---

### שלב 5: אימות

```bash
# התחבר ל-Supabase Studio החדש
# http://api.ssw-ser.com/

# SQL Editor:
SELECT
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## ⚙️ הגדרות

### איפה למצוא `POSTGRES_PASSWORD`?

1. פתח Coolify Dashboard: `http://91.99.207.249:8000`
2. Projects → WooPilot → Supabase Service
3. Environment Variables
4. חפש: `POSTGRES_PASSWORD`
5. העתק את הערך

### פורמט קבצי CSV

**נדרש:**
- ✅ שורה ראשונה = כותרות (headers)
- ✅ Delimiter: `,` (פסיק)
- ✅ Encoding: UTF-8
- ✅ Quotes: `"` (למחרוזות עם פסיקים)

**דוגמה:**
```csv
id,name,url,created_at
1,My Store,https://example.com,2024-01-01 00:00:00
2,Store 2,https://store2.com,2024-01-02 10:30:00
```

---

## 🐛 פתרון בעיות

### ❌ "Permission denied"

**בעיה:** סיסמה לא נכונה

**פתרון:**
1. בדוק את `POSTGRES_PASSWORD` ב-Coolify
2. ודא שאין רווחים מיותרים
3. השתמש במרכאות כפולות: `"password"`

---

### ❌ "Connection refused"

**בעיה:** PostgreSQL לא נגיש

**פתרון:**
```bash
# בדוק אם PostgreSQL רץ
ssh root@91.99.207.249
docker ps | grep postgres

# בדוק פורט
netstat -tlnp | grep 5432
```

---

### ❌ "Table already exists"

**בעיה:** כבר הרצת מיגרציה פעם אחת

**פתרון:**
```sql
-- אפשרות 1: נקה הכל והתחל מחדש
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- אפשרות 2: דלג על טבלאות קיימות
-- (ערוך קובץ מיגרציה והוסף: IF NOT EXISTS)
```

---

### ❌ "CSV file not found"

**בעיה:** קבצי CSV לא בתיקייה הנכונה

**פתרון:**
```bash
# ודא שהקבצים בתיקייה הנכונה
ls -lh csv-exports/

# אם הקבצים במיקום אחר, העתק:
cp /path/to/your/csvs/* csv-exports/
```

---

## 📚 מסמכים קשורים

- 📄 [CSV_EXPORT_GUIDE.md](../docs/CSV_EXPORT_GUIDE.md) - מדריך מפורט לייצוא מ-LOVABLE
- 📄 [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) - תוכנית מיגרציה מלאה
- 📄 [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - תיעוד Schema המלא
- 📄 [STEP_BY_STEP_COOLIFY.md](../docs/STEP_BY_STEP_COOLIFY.md) - התקנת Supabase

---

## 💡 טיפים

1. **גבה תמיד לפני מיגרציה:**
   - גם אם אין pg_dump, שמור CSV files במיקום בטוח
   - הם הגיבוי היחיד שלך!

2. **הרץ קודם ב-Staging:**
   - אם אפשר, בדוק על Supabase נפרד לפני production

3. **בדוק RLS אחרי ייבוא:**
   - ודא שמשתמשים רואים רק את הנתונים שלהם

4. **שמור לוגים:**
   ```bash
   ./scripts/run-migrations.sh 2>&1 | tee migration.log
   ./scripts/import-csv.sh 2>&1 | tee import.log
   ```

---

**סטטוס:** מוכן לשימוש ✅
**עדכון אחרון:** 2025-11-12
