
import { z } from "zod";

// Schema for product validation
export const productSchema = z.object({
  name: z.string().min(1, { message: "נדרש שם מוצר" }),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, { message: "מחיר לא יכול להיות שלילי" }),
  sale_price: z.coerce.number().min(0, { message: "מחיר מבצע לא יכול להיות שלילי" }).optional(),
  status: z.enum(["publish", "draft", "pending", "private"], {
    required_error: "נדרש סטטוס מוצר",
  }),
});

export type ProductFormData = z.infer<typeof productSchema>;
