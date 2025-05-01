
import { z } from "zod";

// Schema for inventory validation
export const inventorySchema = z.object({
  stock_quantity: z.coerce.number().int().min(0, { message: "כמות מלאי לא יכולה להיות שלילית" }),
  sku: z.string().optional(),
  weight: z.coerce.number().min(0, { message: "משקל לא יכול להיות שלילי" }).optional(),
  length: z.coerce.number().min(0, { message: "אורך לא יכול להיות שלילי" }).optional(),
  width: z.coerce.number().min(0, { message: "רוחב לא יכול להיות שלילי" }).optional(),
  height: z.coerce.number().min(0, { message: "גובה לא יכול להיות שלילי" }).optional(),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;
