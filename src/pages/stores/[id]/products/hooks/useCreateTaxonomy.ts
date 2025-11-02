import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreateTaxonomyData {
  name: string;
  parent_id?: number;
}

export function useCreateTaxonomy(storeId: string) {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const createTaxonomy = async (
    type: 'category' | 'tag' | 'brand',
    data: CreateTaxonomyData
  ) => {
    setIsCreating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'manage-taxonomy',
        {
          body: {
            storeId,
            type,
            action: 'create',
            data: {
              name: data.name,
              slug: data.name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, ''),
              ...(data.parent_id && { parent_id: data.parent_id }),
            },
          },
        }
      );

      if (error) throw error;

      // Wait a bit for DB to complete all updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Invalidate and refetch queries to refresh data immediately
      const queryKey = type === 'category' 
        ? ['store-categories', storeId]
        : type === 'tag'
        ? ['store-tags', storeId]
        : ['store-brands', storeId];
      
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.refetchQueries({ queryKey });

      toast.success(`${type === 'category' ? 'קטגוריה' : type === 'tag' ? 'תג' : 'מותג'} נוצר בהצלחה`);

      // For categories, calculate hierarchy prefix with retry logic
      if (type === 'category') {
        // Retry logic - wait for category to appear in DB
        let newCat = null;
        let attempts = 0;
        const maxAttempts = 10; // Max 1 second (10 * 100ms)
        
        console.log('🔍 Polling for new category in DB...');
        
        while (!newCat && attempts < maxAttempts) {
          const { data, error } = await supabase
            .from('store_categories')
            .select('woo_id, name, slug, parent_id')
            .eq('woo_id', result.data.woo_id)
            .eq('store_id', storeId)
            .maybeSingle();
          
          if (data) {
            newCat = data;
            console.log(`✅ Category found after ${attempts + 1} attempts`);
            break;
          }
          
          if (error) {
            console.warn('⚠️ Error fetching category:', error);
          }
          
          // Wait 100ms before next attempt
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          console.log(`⏳ Attempt ${attempts}/${maxAttempts}...`);
        }

        if (newCat) {
          // Calculate depth by traversing parents
          let depth = 0;
          let currentParentId = newCat.parent_id;

          while (currentParentId) {
            depth++;
            const { data: parent } = await supabase
              .from('store_categories')
              .select('parent_id')
              .eq('id', currentParentId)
              .eq('store_id', storeId)
              .single();

            if (!parent) break;
            currentParentId = parent.parent_id;
          }

          const prefix = '— '.repeat(depth);

          return {
            id: result.data.woo_id,
            name: `${prefix}${result.data.name}`,
            slug: result.data.slug,
          };
        } else {
          console.warn('⚠️ Category not found after max attempts, returning without prefix');
        }
      }

      return {
        id: result.data.woo_id,
        name: result.data.name,
        slug: result.data.slug,
      };
    } catch (error) {
      console.error('Error creating taxonomy:', error);
      toast.error('שגיאה ביצירת הפריט');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTaxonomy,
    isCreating,
  };
}
