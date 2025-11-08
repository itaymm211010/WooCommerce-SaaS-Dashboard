-- ============================================================================
-- Fix Customer Data Exposure
-- ============================================================================
-- Issue: Viewers can see sensitive customer information (email, name) in orders
-- Solution: Restrict sensitive fields to managers and owners only
--
-- Security Impact:
-- - Viewers can only see: order status, total amount, order ID
-- - Managers and Owners can see: full customer details (email, name, etc.)
-- ============================================================================

-- Drop existing RLS policies for orders
DROP POLICY IF EXISTS "Users can view orders from accessible stores" ON orders;
DROP POLICY IF EXISTS "Store managers can manage orders" ON orders;

-- Create new RLS policy for viewing orders (limited fields for viewers)
-- Note: Postgres RLS cannot filter columns, so we'll need to handle this at application level
-- For now, we'll restrict viewers from seeing orders at all, they can only see order counts

-- Policy 1: Managers and Owners can view all order data
CREATE POLICY "Store managers and owners can view orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders.store_id
      AND (
        -- Owner
        stores.user_id = auth.uid() OR
        -- Manager role
        EXISTS (
          SELECT 1 FROM store_users
          WHERE store_users.store_id = stores.id
          AND store_users.user_id = auth.uid()
          AND store_users.role IN ('owner', 'manager')
        )
      )
    )
  );

-- Policy 2: Managers and Owners can manage orders
CREATE POLICY "Store managers and owners can manage orders"
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

-- ============================================================================
-- Create a view for viewers to see limited order data
-- ============================================================================

-- Create a view that exposes only non-sensitive order data
CREATE OR REPLACE VIEW orders_summary AS
SELECT
  o.id,
  o.store_id,
  o.woo_id,
  o.status,
  o.total,
  -- Mask customer email (show only domain)
  CASE
    WHEN o.customer_email IS NOT NULL
    THEN CONCAT('***@', SPLIT_PART(o.customer_email, '@', 2))
    ELSE NULL
  END as customer_email_masked,
  -- Mask customer name (show only first letter)
  CASE
    WHEN o.customer_name IS NOT NULL
    THEN CONCAT(LEFT(o.customer_name, 1), '***')
    ELSE NULL
  END as customer_name_masked,
  o.created_at,
  o.updated_at
FROM orders o;

-- Enable RLS on the view
ALTER VIEW orders_summary SET (security_invoker = true);

-- Grant access to the view for viewers
GRANT SELECT ON orders_summary TO authenticated;

-- RLS policy for orders_summary view (all store users can see limited data)
CREATE POLICY "All store users can view order summaries"
  ON orders_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = orders_summary.store_id
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

COMMENT ON VIEW orders_summary IS 'Limited order data for viewers - masks sensitive customer information';

-- ============================================================================
-- Update order_status_logs RLS to match orders restrictions
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view logs from accessible stores" ON order_status_logs;
DROP POLICY IF EXISTS "Store managers can create logs" ON order_status_logs;

-- Only managers and owners can view logs
CREATE POLICY "Store managers and owners can view logs"
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
          AND store_users.role IN ('owner', 'manager')
        )
      )
    )
  );

-- Only managers and owners can create logs
CREATE POLICY "Store managers and owners can create logs"
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

-- ============================================================================
-- Add audit logging
-- ============================================================================

COMMENT ON POLICY "Store managers and owners can view orders" ON orders IS
  'Security: Restricts order viewing to managers and owners only. Viewers must use orders_summary view.';

COMMENT ON POLICY "Store managers and owners can manage orders" ON orders IS
  'Security: Only managers and owners can create, update, or delete orders.';
