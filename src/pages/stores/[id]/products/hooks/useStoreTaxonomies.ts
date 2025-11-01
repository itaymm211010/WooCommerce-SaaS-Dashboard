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
      categories: (categories || []).map(cat => ({
        id: cat.woo_id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
        parent_id: cat.parent_id,
        parent_woo_id: cat.parent_woo_id,
        image_url: cat.image_url
      })),
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
