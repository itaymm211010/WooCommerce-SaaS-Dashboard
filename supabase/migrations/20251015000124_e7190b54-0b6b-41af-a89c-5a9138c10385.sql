-- ========================================
-- חלק א': תיקון Brands - שינוי מ-text ל-jsonb
-- ========================================

-- צור עמודה זמנית לשמירת הנתונים הקיימים
ALTER TABLE products ADD COLUMN brands_temp jsonb;

-- המר נתונים קיימים: אם יש brand (text), המר למערך עם אובייקט אחד
UPDATE products 
SET brands_temp = 
  CASE 
    WHEN brand IS NOT NULL AND brand != '' 
    THEN jsonb_build_array(
      jsonb_build_object(
        'id', extract(epoch from now())::bigint * 1000 + floor(random() * 1000)::bigint,
        'name', brand,
        'slug', lower(regexp_replace(brand, '\s+', '-', 'g'))
      )
    )
    ELSE '[]'::jsonb
  END;

-- מחק את העמודה הישנה
ALTER TABLE products DROP COLUMN brand;

-- שנה את שם העמודה החדשה
ALTER TABLE products RENAME COLUMN brands_temp TO brands;

-- הגדר ברירת מחדל
ALTER TABLE products ALTER COLUMN brands SET DEFAULT '[]'::jsonb;
ALTER TABLE products ALTER COLUMN brands SET NOT NULL;

-- ========================================
-- חלק ב': יצירת טבלת product_attributes
-- ========================================

CREATE TABLE product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  store_id uuid NOT NULL,
  name text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  variation boolean NOT NULL DEFAULT true,
  visible boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  woo_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- אינדקסים לביצועים טובים
CREATE INDEX idx_product_attributes_product_id ON product_attributes(product_id);
CREATE INDEX idx_product_attributes_store_id ON product_attributes(store_id);

-- RLS policies
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

-- Users can view attributes from accessible stores
CREATE POLICY "Users can view attributes from accessible stores"
ON product_attributes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_attributes.store_id
    AND (
      stores.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM store_users
        WHERE store_users.store_id = stores.id
        AND store_users.user_id = auth.uid()
      )
    )
  )
);

-- Store managers can manage attributes
CREATE POLICY "Store managers can manage attributes"
ON product_attributes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_attributes.store_id
    AND (
      stores.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM store_users
        WHERE store_users.store_id = stores.id
        AND store_users.user_id = auth.uid()
        AND store_users.role IN ('owner', 'manager')
      )
    )
  )
);

-- Trigger לעדכון updated_at
CREATE TRIGGER update_product_attributes_updated_at
BEFORE UPDATE ON product_attributes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();