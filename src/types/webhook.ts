
export interface Webhook {
  id: string;
  store_id: string;
  woo_webhook_id: number | null;
  topic: string;
  delivery_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookType {
  value: string;
  label: string;
  description: string;
  category: string;
}

export const webhookCategories = [
  { value: 'orders',    label: 'הזמנות' },
  { value: 'products',  label: 'מוצרים' },
  { value: 'customers', label: 'לקוחות' },
  { value: 'coupons',   label: 'קופונים' },
];

export const webhookTypes: WebhookType[] = [
  // Orders
  { value: 'order.created',   label: 'הזמנה חדשה',            description: 'כאשר נוצרת הזמנה חדשה',            category: 'orders' },
  { value: 'order.updated',   label: 'עדכון הזמנה',            description: 'כאשר סטטוס הזמנה משתנה',            category: 'orders' },
  { value: 'order.deleted',   label: 'מחיקת הזמנה',            description: 'כאשר הזמנה נמחקת',                 category: 'orders' },
  { value: 'order.restored',  label: 'שחזור הזמנה',            description: 'כאשר הזמנה שוחזרת מאשפה',          category: 'orders' },
  // Products
  { value: 'product.created',  label: 'מוצר חדש',              description: 'כאשר מוצר חדש נוצר',               category: 'products' },
  { value: 'product.updated',  label: 'עדכון מוצר',             description: 'כאשר מוצר מעודכן',                 category: 'products' },
  { value: 'product.deleted',  label: 'מחיקת מוצר',             description: 'כאשר מוצר נמחק',                   category: 'products' },
  { value: 'product.restored', label: 'שחזור מוצר',             description: 'כאשר מוצר שוחזר מאשפה',            category: 'products' },
  // Customers
  { value: 'customer.created', label: 'לקוח חדש',              description: 'כאשר לקוח חדש נרשם',               category: 'customers' },
  { value: 'customer.updated', label: 'עדכון לקוח',             description: 'כאשר פרטי לקוח מתעדכנים',          category: 'customers' },
  { value: 'customer.deleted', label: 'מחיקת לקוח',             description: 'כאשר לקוח נמחק',                   category: 'customers' },
  // Coupons
  { value: 'coupon.created',   label: 'קופון חדש',              description: 'כאשר קופון חדש נוצר',               category: 'coupons' },
  { value: 'coupon.updated',   label: 'עדכון קופון',             description: 'כאשר קופון מעודכן',                 category: 'coupons' },
  { value: 'coupon.deleted',   label: 'מחיקת קופון',             description: 'כאשר קופון נמחק',                   category: 'coupons' },
];
