-- Remove duplicate product images, keeping only the oldest entry for each product_id + original_url
DELETE FROM product_images
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY product_id, original_url 
             ORDER BY created_at ASC, id ASC
           ) as row_num
    FROM product_images
    WHERE product_id IS NOT NULL
  ) duplicates
  WHERE row_num > 1
);

-- Now add the unique index to prevent future duplicates
CREATE UNIQUE INDEX product_images_product_url_unique 
ON product_images (product_id, original_url) 
WHERE product_id IS NOT NULL;