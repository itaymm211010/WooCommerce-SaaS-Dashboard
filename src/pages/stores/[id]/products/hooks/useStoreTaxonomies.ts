import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
}

export function useStoreTaxonomies(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-taxonomies', storeId],
    queryFn: async () => {
      if (!storeId) return { categories: [], tags: [], brands: [] };

      // Get all products from this store
      const { data: products, error } = await supabase
        .from('products')
        .select('categories, tags, brands')
        .eq('store_id', storeId);

      if (error) throw error;

      // Collect unique items from all products
      const categoriesMap = new Map<number, TaxonomyItem>();
      const tagsMap = new Map<number, TaxonomyItem>();
      const brandsMap = new Map<number, TaxonomyItem>();

      products?.forEach((product) => {
        // Process categories
        if (Array.isArray(product.categories)) {
          product.categories.forEach((cat: any) => {
            if (cat?.id && cat?.name) {
              categoriesMap.set(cat.id, {
                id: cat.id,
                name: cat.name,
                slug: cat.slug || '',
              });
            }
          });
        }

        // Process tags
        if (Array.isArray(product.tags)) {
          product.tags.forEach((tag: any) => {
            if (tag?.id && tag?.name) {
              tagsMap.set(tag.id, {
                id: tag.id,
                name: tag.name,
                slug: tag.slug || '',
              });
            }
          });
        }

        // Process brands
        if (Array.isArray(product.brands)) {
          product.brands.forEach((brand: any) => {
            if (brand?.id && brand?.name) {
              brandsMap.set(brand.id, {
                id: brand.id,
                name: brand.name,
                slug: brand.slug || '',
              });
            }
          });
        }
      });

      return {
        categories: Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        tags: Array.from(tagsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        brands: Array.from(brandsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      };
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
