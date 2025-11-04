import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Save, Layers } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Variation = Database['public']['Tables']['product_variations']['Row'];

interface Attribute {
  id: string;
  name: string;
  options: string[];
  variation: boolean;
}

interface ProductVariationsTabProps {
  storeId: string;
  productId: string;
}

export function ProductVariationsTab({ storeId, productId }: ProductVariationsTabProps) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [storeId, productId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch variations
      const { data: variationsData, error: variationsError } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

      if (variationsError) throw variationsError;
      setVariations(variationsData || []);

      // Fetch attributes
      const { data: attributesData, error: attributesError } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('product_id', productId)
        .eq('store_id', storeId)
        .eq('variation', true)
        .order('position', { ascending: true });

      if (attributesError) throw attributesError;
      
      const formattedAttributes = (attributesData || []).map(attr => ({
        id: attr.id,
        name: attr.name,
        options: Array.isArray(attr.options) 
          ? (attr.options as any[]).map(opt => String(opt))
          : [],
        variation: attr.variation,
      }));
      
      setAttributes(formattedAttributes);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('לא הצלחנו לטעון את הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  const getVariationName = (variation: Variation) => {
    if (!variation.attributes || !Array.isArray(variation.attributes)) {
      return 'ללא תכונות';
    }

    const attrs = variation.attributes as any[];
    if (attrs.length === 0) return 'ללא תכונות';

    // Try to get the readable name from the attributes
    // WooCommerce variation attributes have: name (attribute name) and option (value)
    return attrs
      .map((attr: any) => {
        // Decode URL-encoded strings (like %d7%9c%d7%91%d7%9f)
        const value = attr.option || attr.value || '';
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      })
      .filter(Boolean)
      .join(' / ');
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

  const handleGenerateVariations = () => {
    // Filter attributes that are used for variations
    const variationAttributes = attributes.filter(attr => attr.variation);

    if (variationAttributes.length === 0) {
      toast.error('אין תכונות שמסומנות כ"משמש לוריאציות"');
      return;
    }

    // Generate cartesian product of all attribute options
    const generateCombinations = (attrs: Attribute[]): any[][] => {
      if (attrs.length === 0) return [[]];

      const [first, ...rest] = attrs;
      const restCombinations = generateCombinations(rest);

      return first.options.flatMap(option =>
        restCombinations.map(combo => [
          { name: first.name, option },
          ...combo
        ])
      );
    };

    const combinations = generateCombinations(variationAttributes);

    const newVariations = combinations.map((combo, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      sku: '',
      price: 0,
      regular_price: 0,
      stock_quantity: 0,
      stock_status: 'instock',
      attributes: combo,
    }));

    setVariations(newVariations);
    toast.success(`נוצרו ${newVariations.length} וריאציות מכל הצירופים האפשריים!`);
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
        toast.success('הוריאציה נמחקה בהצלחה');
      } catch (error) {
        console.error('Error deleting variation:', error);
        toast.error('לא הצלחנו למחוק את הוריאציה');
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

      // Validate all variations before saving
      for (const variation of variations) {
        if (variation.sale_price && variation.regular_price &&
            variation.sale_price >= variation.regular_price) {
          toast.error('מחיר מבצע חייב להיות נמוך ממחיר רגיל בכל הוריאציות');
          setIsSaving(false);
          return;
        }
      }

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

      toast.success('הוריאציות נשמרו בהצלחה');

      // Refresh data
      await fetchData();

      // Sync to WooCommerce
      toast.loading("מסנכרן וריאציות עם WooCommerce...", { id: 'woo-variations-sync' });

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (product && product.woo_id) {
        const { error } = await supabase.functions.invoke('update-woo-product', {
          body: {
            product,
            store_id: storeId,
          },
        });

        if (error) {
          toast.error("שגיאה בסנכרון ל-WooCommerce", { id: 'woo-variations-sync' });
        } else {
          toast.success("הוריאציות סונכרנו בהצלחה ל-WooCommerce", { id: 'woo-variations-sync' });
        }
      } else {
        toast.info("הוריאציות יסונכרנו כשהמוצר יתווסף ל-WooCommerce", { id: 'woo-variations-sync' });
      }
    } catch (error) {
      console.error('Error saving variations:', error);
      toast.error('לא הצלחנו לשמור את הוריאציות');
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">וריאציות מוצר</h3>
            <p className="text-sm text-muted-foreground">
              {attributes.length === 0 
                ? 'יש להגדיר תכונות בטאב "תכונות" לפני יצירת וריאציות'
                : 'נהל וריאציות שונות של המוצר על בסיס התכונות שהוגדרו'
              }
            </p>
          </div>
        </div>
        <div className="space-x-2 space-x-reverse">
          {attributes.some(a => a.variation) && (
            <Button
              onClick={handleGenerateVariations}
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Layers className="h-4 w-4 ml-2" />
              צור וריאציות מכל התכונות
            </Button>
          )}
          <Button
            onClick={handleAddVariation}
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף וריאציה ידנית
          </Button>
          <Button
            onClick={handleSaveVariations}
            disabled={isSaving}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
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
            <Card key={variation.id} className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500 to-pink-500">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-base">
                      {getVariationName(variation) || `וריאציה #{index + 1}`}
                      {variation.woo_id && (
                        <span className="text-xs text-muted-foreground mr-2">
                          (WooCommerce ID: {variation.woo_id})
                        </span>
                      )}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVariation(index)}
                    className="hover:bg-destructive/10"
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
                      className={
                        variation.sale_price && variation.regular_price &&
                        variation.sale_price >= variation.regular_price
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {variation.sale_price && variation.regular_price &&
                     variation.sale_price >= variation.regular_price && (
                      <p className="text-xs text-destructive">
                        ⚠️ מחיר מבצע צריך להיות נמוך ממחיר רגיל
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>מחיר מוצג (אוטומטי)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variation.price}
                      readOnly
                      disabled
                      placeholder="מחיר מוצג (מחושב אוטומטית)"
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      מחיר זה מחושב אוטומטית ע"י WooCommerce (מחיר מבצע אם קיים, אחרת מחיר רגיל)
                    </p>
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
