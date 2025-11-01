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
 * משתמש ב-DFS (Depth-First Search) כדי לשמור על סדר היררכי מלא
 */
function buildCategoryTree(categories: CategoryItem[]) {
  if (!categories || categories.length === 0) return [];
  
  // יצירת map למציאת קטגוריות לפי woo_id
  const categoryMap = new Map(categories.map(c => [c.woo_id, c]));
  
  // מציאת root categories (ללא parent)
  const roots = categories.filter(cat => !cat.parent_woo_id);
  
  // פונקציה רקורסיבית למציאת children של קטגוריה
  const getChildren = (parentWooId: number): CategoryItem[] => {
    return categories
      .filter(cat => cat.parent_woo_id === parentWooId)
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  };
  
  // פונקציה רקורסיבית לשטוח את העץ ב-DFS
  const flattenTree = (items: CategoryItem[], depth: number = 0): any[] => {
    const result: any[] = [];
    
    for (const item of items) {
      const prefix = '— '.repeat(depth);
      
      // הוסף את הקטגוריה הנוכחית
      result.push({
        id: item.woo_id,
        name: `${prefix}${item.name}`,
        slug: item.slug,
        count: item.count,
        parent_id: item.parent_id,
        parent_woo_id: item.parent_woo_id,
        image_url: item.image_url
      });
      
      // הוסף את כל ה-children רקורסיבית
      const children = getChildren(item.woo_id);
      if (children.length > 0) {
        result.push(...flattenTree(children, depth + 1));
      }
    }
    
    return result;
  };
  
  // מיון root categories לפי שם
  const sortedRoots = roots.sort((a, b) => a.name.localeCompare(b.name, 'he'));
  
  // בנה את הרשימה המשוטחת
  return flattenTree(sortedRoots);
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
