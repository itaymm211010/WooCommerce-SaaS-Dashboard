# 🚀 WooPilot - Step-by-Step Coolify Installation

**Goal:** Install Supabase on Coolify for WooPilot

**Time Required:** 2-3 hours

**Prerequisites:**
- ✅ Coolify installed on Hetzner
- ✅ DNS configured (api/studio/app.ssw-ser.com)
- ✅ SSH access to server

---

## Part 1: Access Coolify (5 minutes)

### Step 1.1: Open Coolify Dashboard

1. Open your web browser
2. Navigate to: `http://91.99.207.249:8000`
3. You should see the Coolify login page

**If you see a connection error:**
```bash
# SSH into your server
ssh root@91.99.207.249

# Check if Coolify is running
docker ps | grep coolify

# If not running, start Coolify
cd /data/coolify
docker compose up -d
```

### Step 1.2: Log in to Coolify

- Enter your Coolify username (usually: `admin` or email)
- Enter your Coolify password
- Click **Login**

---

## Part 2: Create New Project (10 minutes)

### Step 2.1: Create Project

1. Once logged in, you'll see the Coolify Dashboard
2. Click **+ New** (top right corner)
3. Select **Project**
4. Enter project details:
   - **Name:** `WooPilot`
   - **Description:** `Multi-Tenant WooCommerce SaaS Platform`
5. Click **Create**

### Step 2.2: Select Server

1. In your new project, click **+ Add Resource**
2. Select **Service**
3. Choose your server from the list (usually `localhost` or your Hetzner server name)

---

## Part 3: Install Supabase (30-45 minutes)

### Step 3.1: Choose Supabase Template

Coolify has **two ways** to install Supabase:

#### Option A: Use Coolify's Supabase Template (RECOMMENDED)

1. In **Add Resource** → **Service**
2. Search for: `Supabase`
3. Click on **Supabase** template
4. Click **Deploy**

#### Option B: Docker Compose (If template not available)

1. In **Add Resource** → **Docker Compose**
2. You'll need to paste a Docker Compose file
3. Use the one from `COOLIFY_SUPABASE_SETUP.md`

**Let's assume Option A (Template) works. If not, we'll use Option B.**

---

### Step 3.2: Configure Supabase Service

You'll be taken to the Supabase configuration page.

**IMPORTANT: Write down these values - you'll need them!**

#### A. General Settings

```
Service Name: woopilot-supabase
Environment: production
```

#### B. Domains

Click **Add Domain** for each:

1. **API Domain:**
   - Domain: `api.ssw-ser.com`
   - Port: `8000` (Kong API Gateway)

2. **Studio Domain:**
   - Domain: `studio.ssw-ser.com`
   - Port: `3000` (Supabase Studio)

**Enable SSL for both:**
- ✅ Check "Enable SSL/TLS"
- ✅ Choose "Let's Encrypt"

#### C. Environment Variables

Click **Environment Variables** tab.

Coolify may auto-generate some. You need to set/verify these:

**Required Variables:**

```bash
# PostgreSQL
POSTGRES_PASSWORD=<GENERATE_STRONG_PASSWORD>
# Example: gH9pX2mK4nQ7wE5rT8yU1iO6aS3dF0jL
# Keep this safe!

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PORT=5432

# JWT Secret (32+ characters)
JWT_SECRET=<GENERATE_RANDOM_STRING>
# Example: vN7kR4wQ9mP2xE5tY8uI1oL6aS3dF0jH
# Keep this safe!

# Supabase URLs
SITE_URL=https://app.ssw-ser.com
API_EXTERNAL_URL=https://api.ssw-ser.com

# API Keys (we'll generate these below)
ANON_KEY=<TO_BE_GENERATED>
SERVICE_ROLE_KEY=<TO_BE_GENERATED>
```

**Optional Variables:**

```bash
# Email (if you want email auth)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_ADMIN_EMAIL=admin@yourdomain.com

# Analytics (optional)
LOGFLARE_API_KEY=
LOGFLARE_SOURCE_TOKEN=
```

---

### Step 3.3: Generate JWT Keys

**This is CRITICAL!** You need to generate `ANON_KEY` and `SERVICE_ROLE_KEY`.

#### Method 1: Using Online Tool (Easiest)

1. Go to: https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
2. Click the "Generate JWT" tool
3. Enter your `JWT_SECRET` from above
4. Copy the generated keys

#### Method 2: Using Node.js (Secure)

SSH into your server:

```bash
ssh root@91.99.207.249

# Install Supabase CLI
npm install -g supabase

# Generate keys
supabase gen keys --jwt-secret "YOUR_JWT_SECRET_HERE"

# You'll get:
# anon key: eyJhbGci...
# service_role key: eyJhbGci...
```

#### Method 3: Manual (Most Secure)

Create a file `generate-jwt.js`:

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'YOUR_JWT_SECRET_HERE'; // Replace with your JWT_SECRET

const anonKey = jwt.sign(
  {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
  },
  JWT_SECRET
);

const serviceRoleKey = jwt.sign(
  {
    role: 'service_role',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
  },
  JWT_SECRET
);

console.log('ANON_KEY:', anonKey);
console.log('SERVICE_ROLE_KEY:', serviceRoleKey);
```

Run it:
```bash
npm install jsonwebtoken
node generate-jwt.js
```

**Copy both keys and paste them in Coolify's environment variables.**

---

### Step 3.4: Save Configuration

1. Double-check all environment variables
2. **Write down:**
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `ANON_KEY`
   - `SERVICE_ROLE_KEY`
3. Click **Save**

---

### Step 3.5: Deploy Supabase

1. Click **Deploy** button
2. Coolify will:
   - Pull Docker images (this takes 5-10 minutes)
   - Create containers
   - Configure networking
   - Set up SSL certificates
3. Watch the **Logs** tab for progress

**Expected logs:**
```
Pulling images...
Creating supabase_db...
Creating supabase_rest...
Creating supabase_auth...
Creating supabase_studio...
Creating supabase_kong...
Containers started successfully
```

---

### Step 3.6: Verify Installation

#### A. Check Supabase Studio

1. Open browser: `https://studio.ssw-ser.com`
2. You should see **Supabase Studio** login
3. Login with:
   - **Email:** (your Supabase account or use postgres connection string)
   - **Or connect via:** `postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres`

**If you see the Studio UI → SUCCESS! ✅**

#### B. Check API Endpoint

Open browser: `https://api.ssw-ser.com`

You should see:
```json
{"message":"OK"}
```

or Supabase API documentation.

**If you see a response → SUCCESS! ✅**

#### C. Check SSL Certificates

Both domains should show a **green padlock** (HTTPS):
- ✅ `https://api.ssw-ser.com`
- ✅ `https://studio.ssw-ser.com`

---

## Part 4: Test Database Connection (10 minutes)

### Step 4.1: SSH into Server

```bash
ssh root@91.99.207.249
```

### Step 4.2: Connect to PostgreSQL

```bash
# Find the PostgreSQL container
docker ps | grep postgres

# Connect to PostgreSQL
docker exec -it <postgres-container-id> psql -U postgres

# Inside psql:
\l      # List databases
\dt     # List tables (should be empty for now)
\q      # Quit
```

**If you can connect → SUCCESS! ✅**

---

## Part 5: Save Configuration (CRITICAL!)

### Create a secure file with all your credentials:

```bash
# On your local machine, create:
# ~/woopilot-credentials.txt

WooPilot - Supabase Credentials
================================

Server IP: 91.99.207.249

Domains:
- API: https://api.ssw-ser.com
- Studio: https://studio.ssw-ser.com
- App: https://app.ssw-ser.com (to be deployed)

PostgreSQL:
- Host: localhost (within Docker network)
- Port: 5432
- Database: postgres
- User: postgres
- Password: <YOUR_POSTGRES_PASSWORD>

Supabase:
- JWT Secret: <YOUR_JWT_SECRET>
- Anon Key: <YOUR_ANON_KEY>
- Service Role Key: <YOUR_SERVICE_ROLE_KEY>

Connection String:
postgresql://postgres:<PASSWORD>@localhost:5432/postgres

Supabase URL: https://api.ssw-ser.com
```

**Keep this file SAFE and SECURE!** 🔒

---

## Troubleshooting

### Problem: Can't access studio.ssw-ser.com

**Check DNS:**
```bash
nslookup studio.ssw-ser.com
# Should return: 91.99.207.249
```

**Check Docker containers:**
```bash
ssh root@91.99.207.249
docker ps
# Should see: supabase_studio, supabase_rest, supabase_db, etc.
```

**Check Coolify logs:**
1. Go to Coolify Dashboard
2. Click on WooPilot project
3. Click on Supabase service
4. Click **Logs** tab
5. Look for errors

---

### Problem: SSL certificate not working

**Wait 5-10 minutes** - Let's Encrypt takes time.

**Force renewal:**
1. Coolify Dashboard → WooPilot → Supabase
2. Domains tab
3. Click **Renew Certificate** for each domain

---

### Problem: Can't connect to PostgreSQL

**Check container is running:**
```bash
docker ps | grep postgres
```

**Check logs:**
```bash
docker logs <postgres-container-id>
```

**Try connecting with correct password:**
```bash
docker exec -it <postgres-container-id> psql -U postgres -W
# Enter password when prompted
```

---

## Next Steps

Once Supabase is installed and accessible:

1. ✅ Supabase Studio working
2. ✅ API endpoint responding
3. ✅ SSL certificates active
4. ✅ Database connection working

**Proceed to:**
- [Part 2: Export Database from LOVABLE](./STEP_BY_STEP_DB_MIGRATION.md)
- Or run: `./scripts/backup-lovable-db.sh`

---

## Summary Checklist

Before moving forward, verify:

- [ ] Coolify Dashboard accessible
- [ ] WooPilot project created
- [ ] Supabase service deployed
- [ ] `studio.ssw-ser.com` → Shows Supabase Studio
- [ ] `api.ssw-ser.com` → Shows API response
- [ ] Both domains have HTTPS (green padlock)
- [ ] Can connect to PostgreSQL via SSH
- [ ] All credentials saved securely

**If all checkboxes are ✅ → Ready for database migration!** 🎉

---

**Need help?** Review:
- [COOLIFY_SUPABASE_SETUP.md](../COOLIFY_SUPABASE_SETUP.md)
- [WOOPILOT_CONFIG.md](../WOOPILOT_CONFIG.md)
- [Coolify Docs](https://coolify.io/docs)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
