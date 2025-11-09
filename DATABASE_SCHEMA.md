# Database Schema - Complete Inventory

**Generated:** 2025-11-09
**Total Migration Files:** 48
**PostgreSQL Version:** 15+

---

## Summary Statistics

- **Tables:** 32
- **Views:** 4
- **Functions:** 13
- **Triggers:** 29
- **Indexes:** 108+
- **RLS Policies:** 100+
- **Enums:** 3
- **Storage Buckets:** 1

---

## 1. ENUMS (3)

```sql
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE store_role AS ENUM ('owner', 'manager', 'viewer');
CREATE TYPE data_source AS ENUM ('woo', 'local');
```

---

## 2. TABLES BY CATEGORY (32)

### 2.1 User Management (3 tables)

#### **profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **user_roles**
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);
```

#### **store_users**
```sql
CREATE TABLE store_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role store_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, user_id)
);
```

---

### 2.2 Store Management (1 table)

#### **stores**
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  api_key TEXT NOT NULL,        -- WooCommerce Consumer Key (encrypted)
  api_secret TEXT NOT NULL,     -- WooCommerce Consumer Secret (encrypted)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT DEFAULT 'ILS' NOT NULL,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

### 2.3 Product Management (5 tables)

#### **products**
- **Purpose:** Main product catalog
- **WooCommerce Sync:** Bidirectional
- **Key Fields:** woo_id, source, synced_at

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_id BIGINT,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  stock_quantity INTEGER,
  status TEXT DEFAULT 'draft' NOT NULL,
  type TEXT DEFAULT 'simple' NOT NULL,
  sku TEXT,
  weight NUMERIC(10,2),
  length NUMERIC(10,2),
  width NUMERIC(10,2),
  height NUMERIC(10,2),
  categories JSONB,
  tags JSONB DEFAULT '[]'::jsonb,
  brands JSONB DEFAULT '[]'::jsonb NOT NULL,
  featured_image_id UUID,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **product_images**
- **Purpose:** Product image gallery
- **Storage:** Can use Supabase Storage or WooCommerce URLs

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  storage_url TEXT,
  storage_source TEXT DEFAULT 'woocommerce' NOT NULL,
  type TEXT DEFAULT 'gallery' NOT NULL,
  alt_text TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  versions JSONB,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (product_id, original_url)
);
```

#### **product_variations**
- **Purpose:** Variable product variations (Size, Color, etc.)

```sql
CREATE TABLE product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_id BIGINT,
  sku TEXT,
  price NUMERIC,
  regular_price NUMERIC,
  sale_price NUMERIC,
  stock_quantity INTEGER,
  stock_status TEXT DEFAULT 'instock',
  attributes JSONB DEFAULT '[]'::jsonb,
  image_id UUID REFERENCES product_images(id) ON DELETE SET NULL,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **product_attributes**
- **Purpose:** Product-specific attributes

```sql
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  variation BOOLEAN NOT NULL DEFAULT true,
  visible BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  woo_id BIGINT,
  global_attribute_id UUID REFERENCES store_attributes(id) ON DELETE SET NULL,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **store_attributes**
- **Purpose:** Global attributes (shared across products)

```sql
CREATE TABLE store_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT DEFAULT 'select',
  order_by TEXT DEFAULT 'menu_order',
  has_archives BOOLEAN DEFAULT false,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, woo_id)
);
```

---

### 2.4 Taxonomy Management (4 tables)

#### **store_categories**
```sql
CREATE TABLE store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES store_categories(id) ON DELETE SET NULL,
  parent_woo_id BIGINT,
  count INT DEFAULT 0,
  image_url TEXT,
  display TEXT DEFAULT 'default',
  menu_order INT DEFAULT 0,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_error TEXT,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, woo_id),
  UNIQUE(store_id, slug)
);
```

#### **store_tags**
```sql
CREATE TABLE store_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  count INT DEFAULT 0,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_error TEXT,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, woo_id),
  UNIQUE(store_id, slug)
);
```

#### **store_brands**
```sql
CREATE TABLE store_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  count INT DEFAULT 0,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, woo_id),
  UNIQUE(store_id, slug)
);
```

#### **store_attribute_terms**
```sql
CREATE TABLE store_attribute_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  attribute_id UUID REFERENCES store_attributes(id) ON DELETE CASCADE NOT NULL,
  woo_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  count INTEGER DEFAULT 0,
  menu_order INTEGER DEFAULT 0,
  source data_source DEFAULT 'local',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, attribute_id, woo_id)
);
```

---

### 2.5 Order Management (2 tables)

#### **orders**
- **Security:** PII restricted to managers/owners only
- **View:** orders_summary provides masked data for viewers

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, woo_id)
);
```

#### **order_status_logs**
```sql
CREATE TABLE order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  order_id BIGINT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

### 2.6 Webhook Management (2 tables)

#### **webhooks**
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  woo_webhook_id BIGINT,
  topic TEXT NOT NULL,
  delivery_url TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **webhook_logs**
- **Rate Limit:** 1000 logs/hour per store

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

### 2.7 Sync Management (3 tables)

#### **taxonomy_sync_log**
```sql
CREATE TABLE taxonomy_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  taxonomy_type TEXT NOT NULL CHECK (taxonomy_type IN ('category', 'tag', 'brand', 'all')),
  action TEXT NOT NULL CHECK (action IN ('initial_sync', 'incremental_sync', 'webhook_update')),
  items_synced INT DEFAULT 0,
  items_created INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  items_failed INT DEFAULT 0,
  duration_ms INT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **sync_logs**
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'order', 'category', 'tag', 'brand', 'attribute', 'variation')),
  entity_id TEXT,
  woo_id BIGINT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **sync_errors**
```sql
CREATE TABLE sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  woo_id BIGINT,
  error_message TEXT NOT NULL,
  error_code TEXT,
  stack_trace TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.8 Project Management (8 tables)

#### **sprints**
```sql
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **tasks**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'feature' CHECK (type IN ('feature', 'bug', 'improvement', 'refactor', 'documentation')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'testing', 'done', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_files TEXT[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);
```

#### **work_logs**
```sql
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hours NUMERIC NOT NULL CHECK (hours > 0),
  description TEXT,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **task_comments**
```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **project_alerts**
```sql
CREATE TABLE project_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('overdue', 'budget_exceeded', 'sprint_delay', 'bug_critical', 'deployment_failed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **task_logs**
```sql
CREATE TABLE task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  file_path TEXT,
  line_number INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **bug_reports**
```sql
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical', 'blocker')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  introduced_by_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  resolved_by_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  affected_files TEXT[],
  steps_to_reproduce TEXT,
  root_cause TEXT,
  resolution_notes TEXT,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);
```

#### **deployments**
```sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  version TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'success', 'failed', 'rolled_back')),
  deployed_tasks UUID[],
  git_commit_hash TEXT,
  deployed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);
```

---

### 2.9 AI Agent System (3 tables)

#### **agent_insights**
```sql
CREATE TABLE agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  analysis TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **agent_alerts**
```sql
CREATE TABLE agent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  insight_id UUID REFERENCES agent_insights(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_by UUID REFERENCES auth.users(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **agent_execution_log**
```sql
CREATE TABLE agent_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('scheduled', 'manual', 'triggered')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  duration_ms INTEGER,
  insights_generated INTEGER DEFAULT 0,
  alerts_generated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

### 2.10 Security & Audit (4 tables)

#### **credential_access_logs**
```sql
CREATE TABLE credential_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);
```

#### **webhook_log_rate_limit**
```sql
CREATE TABLE webhook_log_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL,
  log_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, hour_bucket)
);
```

#### **audit_logs**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### **anomaly_response_actions**
```sql
CREATE TABLE anomaly_response_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('email_sent', 'user_suspended', 'log_created', 'notification_sent')),
  target_user_id UUID REFERENCES auth.users(id),
  target_email TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);
```

---

## 3. VIEWS (4)

### **orders_summary**
- **Purpose:** Masked customer data for viewer role
- **Security:** Replaces PII with 'XXXX' for viewers

### **stores_public**
- **Purpose:** Non-sensitive store information

### **store_basic_info**
- **Purpose:** Basic store data (security_invoker)

### **audit_critical_changes**
- **Purpose:** Recent critical changes (7 days)

### **audit_user_activity**
- **Purpose:** User activity summary (30 days)

---

## 4. FUNCTIONS (13)

1. **has_role(user_id, role) → BOOLEAN**
2. **user_has_store_access(user_id, store_id) → BOOLEAN**
3. **handle_new_user() → TRIGGER**
4. **update_updated_at_column() → TRIGGER**
5. **update_agent_insights_updated_at() → TRIGGER**
6. **cleanup_old_taxonomy_sync_logs() → VOID**
7. **cleanup_old_sync_logs() → VOID**
8. **cleanup_old_audit_logs() → VOID**
9. **get_store_credentials(store_id) → TABLE**
10. **log_credential_access(store_id, ip, user_agent) → VOID**
11. **validate_webhook_log() → TRIGGER**
12. **check_webhook_log_rate_limit(store_id) → BOOLEAN**
13. **audit_log_changes() → TRIGGER**

---

## 5. RLS POLICIES (100+)

All 32 tables have RLS enabled with role-based access control:

### **Key Security Rules:**
- **Admins:** Full access to all tables
- **Store Owners:** Full access to their stores
- **Managers:** Read/write to products/orders, cannot modify store credentials
- **Viewers:** Read-only to products, NO access to customer PII
- **Service Role:** Automated system operations

### **Critical Policies:**
- Stores table: Only owners can access API credentials
- Orders table: Managers+ only, viewers get masked data via orders_summary view
- Webhook logs: Anonymous insert allowed (for WooCommerce webhooks)
- Audit logs: Admins read-only

---

## 6. STORAGE

### **Buckets:**
- **product-images** (Public)
  - Anyone can SELECT
  - Authenticated users can INSERT/UPDATE/DELETE

---

## 7. MIGRATION NOTES

### **Important for Migration:**

1. **48 Migration Files** must be executed in order
2. **3 Enums** must be created first
3. **RLS Policies** are critical - don't skip!
4. **Triggers** auto-maintain timestamps and audit logs
5. **Functions** have `SET search_path = public` for security
6. **Indexes** are performance-critical (108+ indexes)

### **Cleanup Schedules:**
- Taxonomy sync logs: 30 days
- Sync logs: 30 days
- Audit logs: 365 days

---

## 8. SECURITY SUMMARY

✅ **All 32 tables have RLS enabled**
✅ **14 tables have audit logging**
✅ **Webhook rate limiting (1000/hour)**
✅ **Credential access logging**
✅ **PII masking for viewer role**
✅ **SQL injection prevention (search_path)**
✅ **Multi-tenant isolation**

---

**Last Updated:** 2025-11-09
**Schema Version:** Production (from 48 migrations)
