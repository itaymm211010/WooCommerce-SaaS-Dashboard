-- Create enum for app roles
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Create enum for store roles
CREATE TYPE store_role AS ENUM ('owner', 'manager', 'viewer');

-- Create profiles table
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

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT DEFAULT 'ILS' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create store_users table
CREATE TABLE store_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role store_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, user_id)
);

-- Create products table
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
  featured_image_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create product_images table
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create orders table
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

-- Create order_status_logs table
CREATE TABLE order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  order_id BIGINT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create webhooks table
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

-- Create indexes
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_woo_id ON products(woo_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_store_id ON product_images(store_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_woo_id ON orders(woo_id);
CREATE INDEX idx_order_status_logs_store_id ON order_status_logs(store_id);
CREATE INDEX idx_order_status_logs_order_id ON order_status_logs(order_id);
CREATE INDEX idx_webhooks_store_id ON webhooks(store_id);

-- Create function to check user role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for stores
CREATE POLICY "Users can view their stores"
  ON stores FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM store_users 
      WHERE store_users.store_id = stores.id 
      AND store_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store owners can update stores"
  ON stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Store owners can delete stores"
  ON stores FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for store_users
CREATE POLICY "Users can view store memberships"
  ON store_users FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_users.store_id 
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can manage users"
  ON store_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_users.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- RLS Policies for products
CREATE POLICY "Users can view products from accessible stores"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = products.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Store managers can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = products.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
          AND store_users.role IN ('owner', 'manager')
        )
      )
    )
  );

-- RLS Policies for product_images
CREATE POLICY "Users can view images from accessible stores"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = product_images.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Store managers can manage images"
  ON product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = product_images.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
          AND store_users.role IN ('owner', 'manager')
        )
      )
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view orders from accessible stores"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Store managers can manage orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
          AND store_users.role IN ('owner', 'manager')
        )
      )
    )
  );

-- RLS Policies for order_status_logs
CREATE POLICY "Users can view logs from accessible stores"
  ON order_status_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = order_status_logs.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Store managers can create logs"
  ON order_status_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = order_status_logs.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
          AND store_users.role IN ('owner', 'manager')
        )
      )
    )
  );

-- RLS Policies for webhooks
CREATE POLICY "Users can view webhooks from accessible stores"
  ON webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = webhooks.store_id 
      AND (
        stores.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM store_users 
          WHERE store_users.store_id = stores.id 
          AND store_users.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Store owners can manage webhooks"
  ON webhooks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = webhooks.store_id 
      AND stores.user_id = auth.uid()
    )
  );

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- RLS Policies for storage
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );