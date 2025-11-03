import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
interface Attribute {
  id: string;
  name: string;
  options: string[];
  variation: boolean;
  visible: boolean;
  position: number;
  woo_id?: number;
}
interface ProductAttributesTabProps {
  storeId: string;
  productId: string;
}
export function ProductAttributesTab({
  storeId,
  productId
}: ProductAttributesTabProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newOptions, setNewOptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    fetchAttributes();
  }, [storeId, productId]);
  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.from('product_attributes').select('*').eq('product_id', productId).eq('store_id', storeId).order('position', {
        ascending: true
      });
      if (error) throw error;
      const formattedAttributes = (data || []).map(attr => ({
        id: attr.id,
        name: attr.name,
        options: Array.isArray(attr.options) ? (attr.options as any[]).map(opt => String(opt)) : [],
        variation: attr.variation,
        visible: attr.visible,
        position: attr.position,
        woo_id: attr.woo_id || undefined
      }));
      setAttributes(formattedAttributes);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast.error('לא הצלחנו לטעון את התכונות');
    } finally {
      setIsLoading(false);
    }
  };
  const handleAddAttribute = () => {
    const newAttribute: Attribute = {
      id: `temp-${Date.now()}`,
      name: '',
      options: [],
      variation: true,
      visible: true,
      position: attributes.length
    };
    setAttributes([...attributes, newAttribute]);
  };
  const handleUpdateAttribute = (index: number, field: keyof Attribute, value: any) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = {
      ...updatedAttributes[index],
      [field]: value
    };
    setAttributes(updatedAttributes);
  };
  const handleAddOption = (index: number, option: string) => {
    if (!option.trim()) return;
    const updatedAttributes = [...attributes];
    const currentOptions = updatedAttributes[index].options || [];
    updatedAttributes[index].options = [...currentOptions, option.trim()];
    setAttributes(updatedAttributes);
  };
  const handleRemoveOption = (attrIndex: number, optionIndex: number) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[attrIndex].options = updatedAttributes[attrIndex].options.filter((_, i) => i !== optionIndex);
    setAttributes(updatedAttributes);
  };
  const handleRemoveAttribute = async (index: number) => {
    const attribute = attributes[index];
    if (!attribute.id.startsWith('temp-')) {
      try {
        const {
          error
        } = await supabase.from('product_attributes').delete().eq('id', attribute.id);
        if (error) throw error;
        toast.success('התכונה נמחקה בהצלחה');
      } catch (error) {
        console.error('Error deleting attribute:', error);
        toast.error('לא הצלחנו למחוק את התכונה');
        return;
      }
    }
    const updatedAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(updatedAttributes);
  };
  const handleSaveAttributes = async () => {
    try {
      setIsSaving(true);
      for (const attribute of attributes) {
        if (!attribute.name.trim()) {
          toast.error('כל התכונות חייבות לכלול שם');
          setIsSaving(false);
          return;
        }
        if (attribute.id.startsWith('temp-')) {
          const {
            error
          } = await supabase.from('product_attributes').insert({
            product_id: productId,
            store_id: storeId,
            name: attribute.name,
            options: attribute.options,
            variation: attribute.variation,
            visible: attribute.visible,
            position: attribute.position
          });
          if (error) throw error;
        } else {
          const {
            error
          } = await supabase.from('product_attributes').update({
            name: attribute.name,
            options: attribute.options,
            variation: attribute.variation,
            visible: attribute.visible,
            position: attribute.position
          }).eq('id', attribute.id);
          if (error) throw error;
        }
      }
      toast.success('התכונות נשמרו בהצלחה');
      await fetchAttributes();

      // Sync to WooCommerce
      toast.loading("מסנכרן תכונות עם WooCommerce...", { id: 'woo-attributes-sync' });

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
            store_id: storeId
          }
        });

        if (error) {
          toast.error("שגיאה בסנכרון ל-WooCommerce", { id: 'woo-attributes-sync' });
        } else {
          toast.success("התכונות סונכרנו בהצלחה ל-WooCommerce", { id: 'woo-attributes-sync' });
        }
      } else {
        toast.info("התכונות יסונכרנו כשהמוצר יתווסף ל-WooCommerce", { id: 'woo-attributes-sync' });
      }
    } catch (error) {
      console.error('Error saving attributes:', error);
      toast.error('לא הצלחנו לשמור את התכונות');
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">תכונות מוצר</h3>
          <p className="text-sm text-muted-foreground">
            הגדר תכונות (כמו צבע, גודל) שישמשו ליצירת וריאציות
          </p>
        </div>
        <div className="space-x-2 space-x-reverse">
          <Button onClick={handleAddAttribute} variant="outline" size="sm">
            <Plus className="h-4 w-4 ml-2" />
            הוסף תכונה
          </Button>
          <Button onClick={handleSaveAttributes} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
            שמור
          </Button>
        </div>
      </div>

      {attributes.length === 0 ? <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            אין תכונות למוצר זה. לחץ על "הוסף תכונה" כדי להתחיל.
          </CardContent>
        </Card> : <div className="space-y-4">
          {attributes.map((attribute, index) => <Card key={attribute.id} className={index % 2 === 0 ? "bg-[#f3f3f3]" : "bg-[#fbf9ed]"}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base text-slate-950">תכונה #{index + 1}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAttribute(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-slate-100">שם התכונה (למשל: צבע, גודל)</Label>
                  <Input value={attribute.name} onChange={e => handleUpdateAttribute(index, 'name', e.target.value)} placeholder="שם התכונה" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-slate-100">אפשרויות</Label>
                  <div className="flex gap-2">
                    <Input value={newOptions[attribute.id] || ''} onChange={e => setNewOptions({
                ...newOptions,
                [attribute.id]: e.target.value
              })} onKeyPress={e => {
                if (e.key === 'Enter') {
                  handleAddOption(index, newOptions[attribute.id] || '');
                  setNewOptions({
                    ...newOptions,
                    [attribute.id]: ''
                  });
                }
              }} placeholder="הוסף אפשרות (למשל: אדום)" />
                    <Button type="button" size="sm" onClick={() => {
                handleAddOption(index, newOptions[attribute.id] || '');
                setNewOptions({
                  ...newOptions,
                  [attribute.id]: ''
                });
              }}>
                      הוסף
                    </Button>
                  </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attribute.options.map((option, optionIndex) => <Badge key={optionIndex} variant="outline" className="gap-1">
                          {option}
                          <button type="button" onClick={() => handleRemoveOption(index, optionIndex)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>)}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`variation-${index}`} checked={attribute.variation} onCheckedChange={checked => handleUpdateAttribute(index, 'variation', checked)} />
                      <Label htmlFor={`variation-${index}`} className="cursor-pointer text-slate-900 dark:text-slate-100">
                        משמש לוריאציות
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id={`visible-${index}`} checked={attribute.visible} onCheckedChange={checked => handleUpdateAttribute(index, 'visible', checked)} />
                      <Label htmlFor={`visible-${index}`} className="cursor-pointer text-slate-900 dark:text-slate-100">
                        מוצג בדף המוצר
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
        </div>}
    </div>;
}