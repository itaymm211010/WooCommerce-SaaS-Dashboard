import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Variation = Database['public']['Tables']['product_variations']['Row'];

interface ProductVariationsTabProps {
  storeId: string;
  productId: string;
}

export function ProductVariationsTab({ storeId, productId }: ProductVariationsTabProps) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVariations();
  }, [storeId, productId]);

  const fetchVariations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVariations(data || []);
    } catch (error) {
      console.error('Error fetching variations:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את הוריאציות',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariation = () => {
    const newVariation: any = {
      id: `temp-${Date.now()}`,
      sku: '',
      price: 0,
      regular_price: 0,
      stock_quantity: 0,
      stock_status: 'instock',
      attributes: [],
    };
    setVariations([...variations, newVariation]);
  };

  const handleUpdateVariation = (index: number, field: string, value: any) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value,
    };
    setVariations(updatedVariations);
  };

  const handleRemoveVariation = async (index: number) => {
    const variation = variations[index];
    
    // If it's a persisted variation, delete from database
    if (!variation.id.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('product_variations')
          .delete()
          .eq('id', variation.id);

        if (error) throw error;
        toast({
          title: 'הצלחה',
          description: 'הוריאציה נמחקה בהצלחה',
        });
      } catch (error) {
        console.error('Error deleting variation:', error);
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו למחוק את הוריאציה',
          variant: 'destructive',
        });
        return;
      }
    }

    // Remove from local state
    const updatedVariations = variations.filter((_, i) => i !== index);
    setVariations(updatedVariations);
  };

  const handleSaveVariations = async () => {
    try {
      setIsSaving(true);

      for (const variation of variations) {
        if (variation.id.startsWith('temp-')) {
          // Insert new variation
          const { error } = await supabase
            .from('product_variations')
            .insert({
              product_id: productId,
              store_id: storeId,
              sku: variation.sku,
              price: variation.price,
              regular_price: variation.regular_price,
              sale_price: variation.sale_price,
              stock_quantity: variation.stock_quantity,
              stock_status: variation.stock_status,
              attributes: variation.attributes,
            });

          if (error) throw error;
        } else {
          // Update existing variation
          const { error } = await supabase
            .from('product_variations')
            .update({
              sku: variation.sku,
              price: variation.price,
              regular_price: variation.regular_price,
              sale_price: variation.sale_price,
              stock_quantity: variation.stock_quantity,
              stock_status: variation.stock_status,
              attributes: variation.attributes,
            })
            .eq('id', variation.id);

          if (error) throw error;
        }
      }

      toast({
        title: 'הצלחה',
        description: 'הוריאציות נשמרו בהצלחה',
      });

      // Refresh variations
      await fetchVariations();

      // Sync to WooCommerce
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (product && product.woo_id) {
        await supabase.functions.invoke('update-woo-product', {
          body: {
            product,
            store_id: storeId,
          },
        });
        toast({
          title: 'הצלחה',
          description: 'הוריאציות סונכרנו לווקומרס',
        });
      }
    } catch (error) {
      console.error('Error saving variations:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לשמור את הוריאציות',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">וריאציות מוצר</h3>
        <div className="space-x-2 space-x-reverse">
          <Button onClick={handleAddVariation} variant="outline" size="sm">
            <Plus className="h-4 w-4 ml-2" />
            הוסף וריאציה
          </Button>
          <Button onClick={handleSaveVariations} disabled={isSaving} size="sm">
            {isSaving ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            שמור
          </Button>
        </div>
      </div>

      {variations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            אין וריאציות למוצר זה. לחץ על "הוסף וריאציה" כדי להתחיל.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {variations.map((variation, index) => (
            <Card key={variation.id} className={index % 2 === 0 ? "bg-[#f3f3f3]" : "bg-[#fbf9ed]"}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    וריאציה #{index + 1}
                    {variation.woo_id && ` (WooCommerce ID: ${variation.woo_id})`}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVariation(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>מק״ט (SKU)</Label>
                    <Input
                      value={variation.sku}
                      onChange={(e) => handleUpdateVariation(index, 'sku', e.target.value)}
                      placeholder="מק״ט"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מלאי</Label>
                    <Input
                      type="number"
                      value={variation.stock_quantity}
                      onChange={(e) =>
                        handleUpdateVariation(index, 'stock_quantity', parseInt(e.target.value) || 0)
                      }
                      placeholder="כמות במלאי"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>מחיר רגיל</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variation.regular_price}
                      onChange={(e) =>
                        handleUpdateVariation(index, 'regular_price', parseFloat(e.target.value) || 0)
                      }
                      placeholder="מחיר רגיל"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מחיר מבצע</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variation.sale_price || ''}
                      onChange={(e) =>
                        handleUpdateVariation(
                          index,
                          'sale_price',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="מחיר מבצע (אופציונלי)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מחיר מוצג</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variation.price}
                      onChange={(e) =>
                        handleUpdateVariation(index, 'price', parseFloat(e.target.value) || 0)
                      }
                      placeholder="מחיר מוצג"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
