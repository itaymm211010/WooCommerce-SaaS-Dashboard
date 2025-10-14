
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
}).refine((data) => {
  // If sale_price is set and greater than 0, it must be less than the regular price
  if (data.sale_price && data.sale_price > 0) {
    return data.sale_price < data.price;
  }
  return true;
}, {
  message: "מחיר מבצע חייב להיות נמוך מהמחיר הרגיל",
  path: ["sale_price"], // Show error on sale_price field
});

export type ProductFormData = z.infer<typeof productSchema>;
