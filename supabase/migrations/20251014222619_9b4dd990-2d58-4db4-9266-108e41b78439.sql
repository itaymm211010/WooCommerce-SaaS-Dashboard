-- Create function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create product_variations table
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  woo_id BIGINT,
  sku TEXT,
  price NUMERIC,
  regular_price NUMERIC,
  sale_price NUMERIC,
  stock_quantity INTEGER,
  stock_status TEXT DEFAULT 'instock',
  attributes JSONB DEFAULT '[]'::jsonb,
  image_id UUID REFERENCES public.product_images(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on product_id for faster queries
CREATE INDEX idx_product_variations_product_id ON public.product_variations(product_id);

-- Create index on store_id for faster queries
CREATE INDEX idx_product_variations_store_id ON public.product_variations(store_id);

-- Enable Row Level Security
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view variations from accessible stores
CREATE POLICY "Users can view variations from accessible stores"
ON public.product_variations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_variations.store_id
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

-- RLS Policy: Store managers can manage variations
CREATE POLICY "Store managers can manage variations"
ON public.product_variations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = product_variations.store_id
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

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_variations_updated_at
BEFORE UPDATE ON public.product_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();