# מדריך התקנת Supabase על Coolify

## דרישות מקדימות

✅ שרת Hetzner עם:
- 4 vCPU
- 8 GB RAM
- 80 GB Disk
- Coolify מותקן ופועל

---

## שיטת ההתקנה

Coolify תומך ב-Supabase דרך **Docker Compose**. יש 2 אפשרויות:

### אופציה 1: Template מוכן של Coolify (מומלץ!)
### אופציה 2: Docker Compose ידני

---

## אופציה 1: Supabase Template בCoolify (מומלץ)

### שלב 1: כניסה ל-Coolify Dashboard

1. פתח דפדפן וכנס ל:
   ```
   https://your-hetzner-ip:8000
   # או
   https://coolify.your-domain.com
   ```

2. התחבר עם הסיסמה שלך

---

### שלב 2: יצירת Supabase Service חדש

1. **לחץ על:** `+ New Resource`
2. **בחר:** `Service` → `Supabase`
3. **או חפש:** "Supabase" בחיפוש Templates

---

### שלב 3: הגדרות בסיסיות

```yaml
Service Name: woocommerce-supabase
Environment: production
Destination Server: localhost (השרת הנוכחי)
```

---

### שלב 4: משתני סביבה (CRITICAL!)

Coolify יגדיר את אלה אוטומטית, אבל **תשמור אותם!**

```bash
# PostgreSQL
POSTGRES_PASSWORD=<STRONG_PASSWORD>     # שמור בסיסמה חזקה!
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PORT=5432

# Supabase Studio (Dashboard)
STUDIO_PORT=3000
STUDIO_DEFAULT_ORGANIZATION=WooCommerce SaaS
STUDIO_DEFAULT_PROJECT=Production

# PostgREST (API)
PGRST_DB_URI=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
PGRST_DB_SCHEMA=public,storage,graphql_public
PGRST_DB_ANON_ROLE=anon
PGRST_DB_USE_LEGACY_GUCS=false
PGRST_APP_SETTINGS_JWT_SECRET=<JWT_SECRET>    # שמור!
PGRST_APP_SETTINGS_JWT_EXP=3600

# GoTrue (Auth)
GOTRUE_SITE_URL=https://your-frontend-domain.com
GOTRUE_URI_ALLOW_LIST=https://your-frontend-domain.com
GOTRUE_DISABLE_SIGNUP=false
GOTRUE_JWT_ADMIN_ROLES=service_role
GOTRUE_JWT_AUD=authenticated
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
GOTRUE_JWT_EXP=3600
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_SMTP_HOST=smtp.gmail.com            # אם רוצה email
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=your-email@gmail.com
GOTRUE_SMTP_PASS=your-app-password
GOTRUE_SMTP_ADMIN_EMAIL=admin@yourdomain.com

# Realtime (WebSockets)
REALTIME_DB_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres

# Storage (S3-compatible)
STORAGE_BACKEND=file                        # או 's3' אם רוצה S3
STORAGE_FILE_PATH=/var/lib/storage

# Analytics (optional)
LOGFLARE_API_KEY=                           # אופציונלי
LOGFLARE_SOURCE_TOKEN=                      # אופציונלי

# API Keys (IMPORTANT!)
ANON_KEY=<GENERATE_JWT>                     # תצטרך לגנרט
SERVICE_ROLE_KEY=<GENERATE_JWT>             # תצטרך לגנרט
```

---

### שלב 5: גנרציה של JWT Keys

**חשוב מאוד!** צריך לגנרט `ANON_KEY` ו-`SERVICE_ROLE_KEY`.

**שיטה 1: דרך Supabase CLI (מומלץ)**

```bash
# התקן Supabase CLI
npm install -g supabase

# גנרט JWT secret
supabase gen keys

# תקבל:
# anon key: eyJhbGci...
# service_role key: eyJhbGci...
```

**שיטה 2: דרך JWT.io (ידני)**

1. גש ל: https://jwt.io
2. בחר `HS256` algorithm
3. Payload:
   ```json
   {
     "role": "anon",
     "iss": "supabase",
     "iat": 1234567890,
     "exp": 1999999999
   }
   ```
4. Secret: `<JWT_SECRET>` (אותו מלמעלה)
5. העתק את ה-Encoded JWT → `ANON_KEY`

עבור `SERVICE_ROLE_KEY`:
```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1234567890,
  "exp": 1999999999
}
```

---

### שלב 6: Ports ו-Domains

הגדר את היציאות:

```yaml
PostgreSQL:       5432  (internal only)
PostgREST API:    3000  → expose as: https://api.your-domain.com
GoTrue Auth:      9999  (internal)
Supabase Studio:  3000  → expose as: https://studio.your-domain.com
Realtime:         4000  (internal)
Storage API:      5000  (internal)
```

**Domains (דרך Coolify):**
- API: `https://supabase-api.your-domain.com`
- Studio: `https://supabase-studio.your-domain.com`

---

### שלב 7: Deploy!

1. לחץ `Save`
2. לחץ `Deploy`
3. המתן 5-10 דקות
4. בדוק לוגים: `View Logs`

---

### שלב 8: בדיקה שהכל עובד

**1. בדוק Supabase Studio:**
```
https://supabase-studio.your-domain.com
```
- אמור להיפתח dashboard
- התחבר עם: `postgres` / `<POSTGRES_PASSWORD>`

**2. בדוק API:**
```bash
curl https://supabase-api.your-domain.com
# Response: {"message":"OK"}
```

**3. בדוק PostgreSQL:**
```bash
docker exec -it <supabase-db-container> psql -U postgres
# Inside psql:
\l    # list databases
\dt   # list tables (should be empty for now)
```

---

## אופציה 2: Docker Compose ידני

אם Coolify לא תומך ב-template, יצרתי `docker-compose.yml` ידני:

### שלב 1: צור קובץ Docker Compose

<details>
<summary>לחץ לקובץ המלא</summary>

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: supabase/postgres:15.1.0.117
    container_name: supabase-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Supabase Studio (Dashboard)
  studio:
    image: supabase/studio:20231123-64a766a
    container_name: supabase-studio
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      SUPABASE_URL: http://kong:8000
      SUPABASE_PUBLIC_URL: https://supabase-api.your-domain.com
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
    depends_on:
      - db

  # PostgREST (REST API)
  rest:
    image: postgrest/postgrest:v11.2.0
    container_name: supabase-rest
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
    depends_on:
      - db

  # GoTrue (Auth)
  auth:
    image: supabase/gotrue:v2.99.0
    container_name: supabase-auth
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: https://supabase-api.your-domain.com
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_SITE_URL: https://your-frontend-domain.com
      GOTRUE_URI_ALLOW_LIST: https://your-frontend-domain.com
      GOTRUE_DISABLE_SIGNUP: "false"
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "false"
    depends_on:
      - db

  # Realtime (WebSockets)
  realtime:
    image: supabase/realtime:v2.10.1
    container_name: supabase-realtime
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: postgres
      DB_SSL: "false"
      PORT: 4000
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db

  # Storage API
  storage:
    image: supabase/storage-api:v0.40.4
    container_name: supabase-storage
    restart: unless-stopped
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub
    volumes:
      - storage-data:/var/lib/storage
    depends_on:
      - db
      - rest

  # Kong (API Gateway)
  kong:
    image: kong:2.8.1
    container_name: supabase-kong
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl
    volumes:
      - ./kong.yml:/var/lib/kong/kong.yml
    depends_on:
      - rest
      - auth
      - realtime
      - storage

  # Meta (Database management)
  meta:
    image: supabase/postgres-meta:v0.68.0
    container_name: supabase-meta
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: postgres
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      - db

volumes:
  postgres-data:
  storage-data:
```
</details>

### שלב 2: צור `.env` file

```bash
POSTGRES_PASSWORD=your-strong-password-here
JWT_SECRET=your-jwt-secret-32-chars-minimum
ANON_KEY=your-anon-jwt-key
SERVICE_ROLE_KEY=your-service-role-jwt-key
```

### שלב 3: Deploy ב-Coolify

1. Coolify → `+ New Resource` → `Docker Compose`
2. העלה את `docker-compose.yml` ו-`.env`
3. Deploy

---

## שלב הבא: העברת הנתונים

לאחר ש-Supabase רץ, המשך ל: [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)

---

## Troubleshooting

### בעיה: Supabase Studio לא נפתח

```bash
# בדוק logs
docker logs supabase-studio

# וודא שהפורט פתוח
netstat -tuln | grep 3000
```

### בעיה: PostgreSQL לא מתחבר

```bash
# כנס לcontainer
docker exec -it supabase-db bash

# נסה להתחבר
psql -U postgres

# בדוק password
echo $POSTGRES_PASSWORD
```

### בעיה: Auth לא עובד

```bash
# בדוק GoTrue logs
docker logs supabase-auth

# וודא JWT_SECRET זהה בכל המקומות
```

---

## קישורים שימושיים

- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Coolify Documentation](https://coolify.io/docs)
- [Docker Compose for Supabase](https://github.com/supabase/supabase/tree/master/docker)

---

**עדכון אחרון:** 2025-11-09
