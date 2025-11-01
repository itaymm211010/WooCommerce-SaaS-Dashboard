import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryItem {
  id: string;
  woo_id: number;
  name: string;
  slug: string;
  parent_id?: string | null;
  parent_woo_id?: number | null;
  image_url?: string | null;
  count: number;
}

export interface TagItem {
  id: string;
  woo_id: number;
  name: string;
  slug: string;
  count: number;
}

export interface BrandItem {
  id: string;
  woo_id: number;
  name: string;
  slug: string;
  logo_url?: string | null;
  count: number;
}

/**
 * טוען קטגוריות, תגים ומותגים מהטבלאות הייעודיות (לא מהמוצרים!)
 * זה מבטיח שהמשתמש רואה את כל הטקסונומיות מווקומרס, 
 * גם אלו שעדיין לא משוייכות לאף מוצר.
 */
/**
 * בונה עץ קטגוריות עם hierarchy indicators (prefix של "—")
 */
function buildCategoryTree(categories: CategoryItem[]) {
  if (!categories || categories.length === 0) return [];
  
  // יצירת map למציאת קטגוריות לפי ID
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  // פונקציה רקורסיבית למציאת עומק הקטגוריה
  const getDepth = (cat: CategoryItem): number => {
    if (!cat.parent_id) return 0;
    const parent = categoryMap.get(cat.parent_id);
    return parent ? getDepth(parent) + 1 : 0;
  };
  
  // מיון: parent לפני children, ואז לפי שם
  const sorted = [...categories].sort((a, b) => {
    const aDepth = getDepth(a);
    const bDepth = getDepth(b);
    
    // אם לאחד יש parent_id שהוא ה-ID של השני, הוא child
    if (b.parent_id === a.id) return -1;
    if (a.parent_id === b.id) return 1;
    
    // אם שניהם באותו רמה ואותו parent, לפי שם
    if (aDepth === bDepth && a.parent_id === b.parent_id) {
      return a.name.localeCompare(b.name, 'he');
    }
    
    // אם רמות שונות, הרמה הנמוכה לפני
    if (aDepth !== bDepth) return aDepth - bDepth;
    
    // default: לפי שם
    return a.name.localeCompare(b.name, 'he');
  });
  
  // הוספת prefix לפי עומק
  return sorted.map(cat => {
    const depth = getDepth(cat);
    const prefix = '— '.repeat(depth);
    
    return {
      id: cat.woo_id,
      name: `${prefix}${cat.name}`,
      slug: cat.slug,
      count: cat.count,
      parent_id: cat.parent_id,
      parent_woo_id: cat.parent_woo_id,
      image_url: cat.image_url
    };
  });
}

export function useStoreTaxonomies(storeId: string | undefined) {
  // Categories
  const { 
    data: categories, 
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['store-categories', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .eq('store_id', storeId!)
        .order('name');
      
      if (error) throw error;
      return data as CategoryItem[];
    },
    staleTime: 5 * 60 * 1000,    // 5 דקות - לא יטען מחדש בתוך הזמן הזה
    gcTime: 10 * 60 * 1000,      // 10 דקות - זמן cache בזיכרון
    enabled: !!storeId
  });
  
  // Tags
  const { 
    data: tags, 
    isLoading: tagsLoading,
    error: tagsError
  } = useQuery({
    queryKey: ['store-tags', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_tags')
        .select('*')
        .eq('store_id', storeId!)
        .order('name');
      
      if (error) throw error;
      return data as TagItem[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!storeId
  });
  
  // Brands
  const { 
    data: brands, 
    isLoading: brandsLoading,
    error: brandsError
  } = useQuery({
    queryKey: ['store-brands', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_brands')
        .select('*')
        .eq('store_id', storeId!)
        .order('name');
      
      if (error) throw error;
      return data as BrandItem[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!storeId
  });
  
  return {
    data: {
      categories: buildCategoryTree(categories || []),
      tags: (tags || []).map(tag => ({
        id: tag.woo_id,
        name: tag.name,
        slug: tag.slug,
        count: tag.count
      })),
      brands: (brands || []).map(brand => ({
        id: brand.woo_id,
        name: brand.name,
        slug: brand.slug,
        count: brand.count,
        logo_url: brand.logo_url
      })),
    },
    isLoading: categoriesLoading || tagsLoading || brandsLoading,
    errors: {
      categories: categoriesError,
      tags: tagsError,
      brands: brandsError
    }
  };
}
