-- Add tags and brand fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS brand text;