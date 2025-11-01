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
      await queryClient.invalidateQueries({
        queryKey: [`store-${type === 'category' ? 'categories' : type === 'tag' ? 'tags' : 'brands'}`, storeId],
      });
      
      await queryClient.refetchQueries({
        queryKey: [`store-${type === 'category' ? 'categories' : type === 'tag' ? 'tags' : 'brands'}`, storeId],
      });

      toast.success(`${type === 'category' ? 'קטגוריה' : type === 'tag' ? 'תג' : 'מותג'} נוצר בהצלחה`);

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
