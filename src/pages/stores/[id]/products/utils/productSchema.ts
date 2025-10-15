
import { z } from "zod";

// Schema for product validation
export const productSchema = z.object({
  name: z.string().min(1, { message: "נדרש שם מוצר" }),
  short_description: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["simple", "variable"], {
    required_error: "נדרש סוג מוצר",
  }),
  price: z.coerce.number().min(0, { message: "מחיר לא יכול להיות שלילי" }).optional(),
  sale_price: z.coerce.number().min(0, { message: "מחיר מבצע לא יכול להיות שלילי" }).optional(),
  status: z.enum(["publish", "draft", "pending", "private"], {
    required_error: "נדרש סטטוס מוצר",
  }),
}).refine((data) => {
  // For simple products, price is required
  if (data.type === "simple" && (!data.price || data.price <= 0)) {
    return false;
  }
  return true;
}, {
  message: "מחיר נדרש למוצר רגיל",
  path: ["price"],
}).refine((data) => {
  // If sale_price is set and greater than 0, it must be less than the regular price
  if (data.type === "simple" && data.sale_price && data.sale_price > 0 && data.price) {
    return data.sale_price < data.price;
  }
  return true;
}, {
  message: "מחיר מבצע חייב להיות נמוך מהמחיר הרגיל",
  path: ["sale_price"],
});

export type ProductFormData = z.infer<typeof productSchema>;
