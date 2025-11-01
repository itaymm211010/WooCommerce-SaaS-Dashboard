-- =====================================================
-- TAXONOMY TABLES - Lookup/Cache from WooCommerce
-- =====================================================

-- 1. Store Categories
-- =====================================================
create table if not exists store_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  woo_id bigint not null,
  
  -- Basic Info
  name text not null,
  slug text not null,
  description text,
  
  -- Hierarchy
  parent_id uuid references store_categories(id) on delete set null,
  parent_woo_id bigint,
  
  -- Stats
  count int default 0,
  
  -- Media
  image_url text,
  
  -- Display
  display text default 'default',
  menu_order int default 0,
  
  -- Sync Metadata
  sync_status text default 'synced' check (sync_status in ('synced', 'pending', 'error')),
  last_synced_at timestamptz default now(),
  sync_error text,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Constraints
  unique(store_id, woo_id),
  unique(store_id, slug)
);

-- Indexes
create index idx_store_categories_store on store_categories(store_id);
create index idx_store_categories_woo_id on store_categories(woo_id);
create index idx_store_categories_parent on store_categories(parent_id);
create index idx_store_categories_sync on store_categories(sync_status) where sync_status != 'synced';

-- RLS
alter table store_categories enable row level security;

create policy "Users can view their store categories"
  on store_categories for select
  using (
    store_id in (
      select id from stores 
      where user_id = auth.uid()
        or exists (
          select 1 from store_users 
          where store_users.store_id = stores.id 
            and store_users.user_id = auth.uid()
        )
    )
  );

create policy "Store managers can manage categories"
  on store_categories for all
  using (
    store_id in (
      select id from stores 
      where user_id = auth.uid()
        or exists (
          select 1 from store_users 
          where store_users.store_id = stores.id 
            and store_users.user_id = auth.uid()
            and store_users.role in ('owner', 'manager')
        )
    )
  );


-- =====================================================
-- 2. Store Tags
-- =====================================================
create table if not exists store_tags (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  woo_id bigint not null,
  
  -- Basic Info
  name text not null,
  slug text not null,
  description text,
  
  -- Stats
  count int default 0,
  
  -- Sync Metadata
  sync_status text default 'synced' check (sync_status in ('synced', 'pending', 'error')),
  last_synced_at timestamptz default now(),
  sync_error text,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Constraints
  unique(store_id, woo_id),
  unique(store_id, slug)
);

-- Indexes
create index idx_store_tags_store on store_tags(store_id);
create index idx_store_tags_woo_id on store_tags(woo_id);
create index idx_store_tags_sync on store_tags(sync_status) where sync_status != 'synced';

-- RLS
alter table store_tags enable row level security;

create policy "Users can view their store tags"
  on store_tags for select
  using (
    store_id in (
      select id from stores 
      where user_id = auth.uid()
        or exists (
          select 1 from store_users 
          where store_users.store_id = stores.id 
            and store_users.user_id = auth.uid()
        )
    )
  );

create policy "Store managers can manage tags"
  on store_tags for all
  using (
    store_id in (
      select id from stores 
      where user_id = auth.uid()
        or exists (
          select 1 from store_users 
          where store_users.store_id = stores.id 
            and store_users.user_id = auth.uid()
            and store_users.role in ('owner', 'manager')
        )
    )
  );


-- =====================================================
-- 3. Store Brands (WooCommerce 9.0+)
-- =====================================================
create table if not exists store_brands (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  woo_id bigint not null,
  
  -- Basic Info
  name text not null,
  slug text not null,
  description text,
  
  -- Media
  logo_url text,
  
  -- Stats
  count int default 0,
  
  -- Sync Metadata
  sync_status text default 'synced' check (sync_status in ('synced', 'pending', 'error')),
  last_synced_at timestamptz default now(),
  sync_error text,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Constraints
  unique(store_id, woo_id),
  unique(store_id, slug)
);

-- Indexes
create index idx_store_brands_store on store_brands(store_id);
create index idx_store_brands_woo_id on store_brands(woo_id);
create index idx_store_brands_sync on store_brands(sync_status) where sync_status != 'synced';

-- RLS
alter table store_brands enable row level security;

create policy "Users can view their store brands"
  on store_brands for select
  using (
    store_id in (
      select id from stores 
      where user_id = auth.uid()
        or exists (
          select 1 from store_users 
          where store_users.store_id = stores.id 
            and store_users.user_id = auth.uid()
        )
    )
  );

create policy "Store managers can manage brands"
  on store_brands for all
  using (
    store_id in (
      select id from stores 
      where user_id = auth.uid()
        or exists (
          select 1 from store_users 
          where store_users.store_id = stores.id 
            and store_users.user_id = auth.uid()
            and store_users.role in ('owner', 'manager')
        )
    )
  );


-- =====================================================
-- 4. Taxonomy Sync Log (for monitoring)
-- =====================================================
create table if not exists taxonomy_sync_log (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  
  taxonomy_type text not null check (taxonomy_type in ('category', 'tag', 'brand', 'all')),
  action text not null check (action in ('initial_sync', 'incremental_sync', 'webhook_update')),
  
  -- Stats
  items_synced int default 0,
  items_created int default 0,
  items_updated int default 0,
  items_failed int default 0,
  duration_ms int,
  
  -- Errors
  error_details jsonb,
  
  -- Timestamps
  created_at timestamptz default now()
);

-- Index
create index idx_taxonomy_sync_log_store on taxonomy_sync_log(store_id, created_at desc);

-- RLS
alter table taxonomy_sync_log enable row level security;

create policy "Users can view their taxonomy sync logs"
  on taxonomy_sync_log for select
  using (
    store_id in (
      select id from stores 
      where user_id = auth.uid()
        or exists (
          select 1 from store_users 
          where store_users.store_id = stores.id 
            and store_users.user_id = auth.uid()
        )
    )
  );

-- =====================================================
-- Auto-cleanup function for old sync logs
-- =====================================================
create or replace function cleanup_old_taxonomy_sync_logs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from taxonomy_sync_log
  where created_at < now() - interval '30 days';
end;
$$;