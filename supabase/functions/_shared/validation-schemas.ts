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
    message: "Invalid HTTP method"
  }),
  body: z.record(z.unknown()).optional(),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// ============================================================================
// manage-taxonomy validation
// ============================================================================

export const manageTaxonomyRequestSchema = z.object({
  storeId: uuidSchema,
  type: z.enum(['category', 'tag', 'brand'], {
    message: "Type must be 'category', 'tag', or 'brand'"
  }),
  action: z.enum(['create', 'update', 'delete'], {
    message: "Action must be 'create', 'update', or 'delete'"
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
  product_id: uuidSchema,
  woo_id: z.number().int().positive().optional(),
  data: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(10000).optional(),
    short_description: z.string().max(1000).optional(),
    price: z.union([z.string(), z.number()]).optional(),
    sale_price: z.union([z.string(), z.number()]).optional(),
    regular_price: z.union([z.string(), z.number()]).optional(),
    stock_quantity: z.number().int().nonnegative().optional(),
    manage_stock: z.boolean().optional(),
    stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
    status: z.enum(['draft', 'pending', 'private', 'publish']).optional(),
    type: z.enum(['simple', 'grouped', 'external', 'variable']).optional(),
    sku: z.string().max(100).optional(),
    weight: z.union([z.string(), z.number()]).optional(),
    dimensions: z.object({
      length: z.union([z.string(), z.number()]).optional(),
      width: z.union([z.string(), z.number()]).optional(),
      height: z.union([z.string(), z.number()]).optional(),
    }).optional(),
    categories: z.array(z.object({
      id: z.number().int().positive(),
      name: z.string().optional(),
    })).optional(),
    images: z.array(z.object({
      id: z.number().int().positive().optional(),
      src: z.string().url().optional(),
      name: z.string().optional(),
      alt: z.string().optional(),
    })).optional(),
  }).optional(),
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
  }),
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
