/**
 * Shared Zod validation schemas for Edge Functions
 * Prevents injection attacks and ensures data integrity
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().uuid({
  message: "Invalid UUID format"
});

export const storeIdSchema = z.object({
  storeId: uuidSchema,
});

export const wooIdSchema = z.number().int().positive({
  message: "WooCommerce ID must be a positive integer"
});

// ============================================================================
// woo-proxy validation
// ============================================================================

export const wooProxyRequestSchema = z.object({
  storeId: uuidSchema,
  endpoint: z.string().regex(/^\/wp-json\/wc\/v3\//, {
    message: "Endpoint must start with /wp-json/wc/v3/"
  }),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], {
    invalid_type_error: "Invalid HTTP method"
  }).default('GET'),
  body: z.record(z.unknown()).optional(),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// ============================================================================
// manage-taxonomy validation
// ============================================================================

export const manageTaxonomyRequestSchema = z.object({
  storeId: uuidSchema,
  type: z.enum(['category', 'tag', 'brand'], {
    invalid_type_error: "Type must be 'category', 'tag', or 'brand'"
  }),
  action: z.enum(['create', 'update', 'delete'], {
    invalid_type_error: "Action must be 'create', 'update', or 'delete'"
  }),
  data: z.object({
    name: z.string().min(1).max(200).optional(),
    parent_id: z.number().int().nonnegative().optional(),
    id: z.number().int().positive().optional(),
  }).refine(
    (data) => {
      // Create requires name
      // Update requires id and name
      // Delete requires id
      return true; // Additional validation can be added here
    },
    { message: "Invalid data for the specified action" }
  ),
});

// ============================================================================
// sync-woo-products validation
// ============================================================================

export const syncWooProductsRequestSchema = z.object({
  store_id: uuidSchema,
  force_sync: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(100).optional(),
});

// ============================================================================
// update-woo-product validation
// ============================================================================

export const updateWooProductRequestSchema = z.object({
  store_id: uuidSchema,
  product: z.object({
    id: uuidSchema,
    store_id: uuidSchema.optional(),
    woo_id: z.union([z.number().int(), z.null()]).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(10000).nullable().optional(),
    short_description: z.string().max(1000).nullable().optional(),
    price: z.union([z.string(), z.number(), z.null()]).optional(),
    sale_price: z.union([z.string(), z.number(), z.null()]).optional(),
    regular_price: z.union([z.string(), z.number(), z.null()]).optional(),
    stock_quantity: z.union([z.number().int().nonnegative(), z.null()]).optional(),
    manage_stock: z.boolean().nullable().optional(),
    stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).nullable().optional(),
    status: z.string().optional(), // Allow any status string
    type: z.string().optional(), // Allow any type string
    sku: z.string().max(100).nullable().optional(),
    weight: z.union([z.string(), z.number(), z.null()]).optional(),
    length: z.union([z.string(), z.number(), z.null()]).optional(),
    width: z.union([z.string(), z.number(), z.null()]).optional(),
    height: z.union([z.string(), z.number(), z.null()]).optional(),
    categories: z.any().optional(), // JSONB field
    images: z.any().optional(), // Related table
    featured_image_id: z.union([uuidSchema, z.null()]).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }).passthrough(), // Allow additional fields from database
});

// ============================================================================
// sync-taxonomies validation
// ============================================================================

export const syncTaxonomiesRequestSchema = z.object({
  store_id: uuidSchema,
  taxonomy_type: z.enum(['categories', 'tags', 'brands']).optional(),
  force_sync: z.boolean().optional(),
});

// ============================================================================
// bulk-sync-to-woo validation
// ============================================================================

export const bulkSyncToWooRequestSchema = z.object({
  store_id: uuidSchema,
  product_ids: z.array(uuidSchema).min(1).max(100, {
    message: "Cannot sync more than 100 products at once"
  }).optional(), // Optional - if not provided, syncs all products
  force_update: z.boolean().optional(),
});

// ============================================================================
// generate-webhook-secret validation
// ============================================================================

export const generateWebhookSecretRequestSchema = z.object({
  store_id: uuidSchema,
  regenerate: z.boolean().optional(),
});

// ============================================================================
// AI/Agent validation (for ai-chat, agent-coordinator, etc.)
// ============================================================================

export const aiChatRequestSchema = z.object({
  store_id: uuidSchema,
  message: z.string().min(1).max(5000, {
    message: "Message must be between 1 and 5000 characters"
  }),
  context: z.record(z.unknown()).optional(),
  conversation_id: uuidSchema.optional(),
});

export const agentCoordinatorRequestSchema = z.object({
  store_id: uuidSchema,
  task: z.string().min(1).max(1000),
  task_type: z.enum(['sync', 'analysis', 'bug_detection', 'optimization']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// ============================================================================
// Helper function to validate request
// ============================================================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return { success: false, error: `Validation failed: ${errorMessages}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
