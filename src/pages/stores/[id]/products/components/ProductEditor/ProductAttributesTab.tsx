import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GlobalAttribute {
  id: string;
  woo_id: number;
  name: string;
  slug: string;
}

interface Attribute {
  id: string;
  name: string;
  options: string[];
  variation: boolean;
  visible: boolean;
  position: number;
  woo_id?: number;
  global_attribute_id?: string;
  isGlobal?: boolean;
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
  const [globalAttributes, setGlobalAttributes] = useState<GlobalAttribute[]>([]);
  const [newOptions, setNewOptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchAttributes();
    fetchGlobalAttributes();
  }, [storeId, productId]);

  const fetchGlobalAttributes = async () => {
    try {
      console.log('Fetching global attributes for store:', storeId);
      const { data, error } = await supabase
        .from('store_attributes')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching global attributes:', error);
        toast.error(`שגיאה בטעינת תכונות גלובליות: ${error.message}`);
        return;
      }

      console.log('✅ Fetched global attributes:', data);
      console.log('📊 Count:', data?.length || 0);
      setGlobalAttributes(data || []);
    } catch (error: any) {
      console.error('❌ Exception fetching global attributes:', error);
      toast.error(`שגיאה: ${error.message}`);
    }
  };

  const syncGlobalAttributes = async () => {
    try {
      setIsSyncing(true);
      toast.loading('מסנכרן תכונות גלובליות מ-WooCommerce...', { id: 'sync-attrs' });

      // Get store details first
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;

      // Format base URL
      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      // Fetch global attributes from WooCommerce directly
      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/products/attributes?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}&per_page=100`
      );

      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.status}`);
      }

      const attributes = await response.json();
      console.log(`Found ${attributes.length} global attributes`);

      let synced = 0;
      let created = 0;
      let updated = 0;

      // Sync each attribute
      for (const attr of attributes) {
        const { data: existing, error: selectError } = await supabase
          .from('store_attributes')
          .select('id')
          .eq('store_id', storeId)
          .eq('woo_id', attr.id)
          .maybeSingle();

        if (selectError) {
          console.error('Error checking existing attribute:', selectError);
          continue;
        }

        const attributeData = {
          store_id: storeId,
          woo_id: attr.id,
          name: attr.name,
          slug: attr.slug,
          type: attr.type || 'select',
          order_by: attr.order_by || 'menu_order',
          has_archives: attr.has_archives || false,
          updated_at: new Date().toISOString()
        };

        if (existing) {
          const { error: updateError } = await supabase
            .from('store_attributes')
            .update(attributeData)
            .eq('id', existing.id);

          if (updateError) {
            console.error('Error updating attribute:', updateError);
            continue;
          }
          updated++;
        } else {
          const { error: insertError } = await supabase
            .from('store_attributes')
            .insert(attributeData);

          if (insertError) {
            console.error('Error inserting attribute:', attr.name, insertError);
            continue;
          }
          created++;
        }
        synced++;
      }

      toast.success(`סונכרנו ${synced} תכונות (${created} חדשות, ${updated} עודכנו)`, { id: 'sync-attrs' });
      await fetchGlobalAttributes();
    } catch (error: any) {
      console.error('Error syncing global attributes:', error);
      toast.error(`שגיאה בסנכרון: ${error.message}`, { id: 'sync-attrs' });
    } finally {
      setIsSyncing(false);
    }
  };
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
        woo_id: attr.woo_id || undefined,
        global_attribute_id: attr.global_attribute_id || undefined,
        isGlobal: !!attr.global_attribute_id
      }));
      setAttributes(formattedAttributes);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast.error('לא הצלחנו לטעון את התכונות');
    } finally {
      setIsLoading(false);
    }
  };
  const handleAddAttribute = (type: 'global' | 'custom' = 'custom') => {
    const newAttribute: Attribute = {
      id: `temp-${Date.now()}`,
      name: '',
      options: [],
      variation: true,
      visible: true,
      position: attributes.length,
      isGlobal: type === 'global'
    };
    setAttributes([...attributes, newAttribute]);
  };

  const handleSelectGlobalAttribute = async (index: number, globalAttrId: string) => {
    const globalAttr = globalAttributes.find(ga => ga.id === globalAttrId);
    if (!globalAttr) return;

    try {
      toast.loading(`טוען ערכים עבור ${globalAttr.name}...`, { id: 'fetch-terms' });

      // Get store details to fetch terms
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (!store) {
        throw new Error('Store not found');
      }

      // Format base URL
      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      // Fetch terms for this attribute
      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/products/attributes/${globalAttr.woo_id}/terms?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}&per_page=100`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch terms: ${response.status}`);
      }

      const terms = await response.json();
      console.log(`Found ${terms.length} terms for ${globalAttr.name}:`, terms);

      // Extract term names
      const options = terms.map((term: any) => term.name);

      const updatedAttributes = [...attributes];
      updatedAttributes[index] = {
        ...updatedAttributes[index],
        name: globalAttr.name,
        global_attribute_id: globalAttr.id,
        woo_id: globalAttr.woo_id,
        isGlobal: true,
        options: options
      };
      setAttributes(updatedAttributes);

      toast.success(`נטענו ${terms.length} ערכים עבור ${globalAttr.name}`, { id: 'fetch-terms' });
    } catch (error: any) {
      console.error('Error fetching attribute terms:', error);
      toast.error(`שגיאה בטעינת ערכים: ${error.message}`, { id: 'fetch-terms' });

      // Still set the attribute even if terms fail
      const updatedAttributes = [...attributes];
      updatedAttributes[index] = {
        ...updatedAttributes[index],
        name: globalAttr.name,
        global_attribute_id: globalAttr.id,
        woo_id: globalAttr.woo_id,
        isGlobal: true
      };
      setAttributes(updatedAttributes);
    }
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
            position: attribute.position,
            global_attribute_id: attribute.global_attribute_id || null,
            woo_id: attribute.woo_id || 0
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
            position: attribute.position,
            global_attribute_id: attribute.global_attribute_id || null,
            woo_id: attribute.woo_id || 0
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
          <Button onClick={syncGlobalAttributes} variant="outline" size="sm" disabled={isSyncing}>
            {isSyncing ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <RefreshCw className="h-4 w-4 ml-2" />}
            סנכרן תכונות
          </Button>
          <Button onClick={() => handleAddAttribute('custom')} variant="outline" size="sm">
            <Plus className="h-4 w-4 ml-2" />
            תכונה מותאמת
          </Button>
          <Button onClick={handleSaveAttributes} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
            שמור
          </Button>
        </div>
      </div>

      {attributes.length === 0 ? <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              אין תכונות למוצר זה.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => handleAddAttribute('global')} variant="outline" size="sm">
                <Plus className="h-4 w-4 ml-2" />
                בחר תכונה גלובלית
              </Button>
              <Button onClick={() => handleAddAttribute('custom')} variant="outline" size="sm">
                <Plus className="h-4 w-4 ml-2" />
                צור תכונה מותאמת
              </Button>
            </div>
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
                {attribute.isGlobal && !attribute.global_attribute_id ? (
                  <div className="space-y-2">
                    <Label className="text-slate-900 dark:text-slate-100">
                      בחר תכונה גלובלית ({globalAttributes.length} זמינות)
                    </Label>
                    <Select onValueChange={(value) => handleSelectGlobalAttribute(index, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר תכונה קיימת..." />
                      </SelectTrigger>
                      <SelectContent>
                        {globalAttributes.length === 0 ? (
                          <SelectItem value="none" disabled>
                            אין תכונות זמינות
                          </SelectItem>
                        ) : (
                          globalAttributes.map((ga) => (
                            <SelectItem key={ga.id} value={ga.id}>
                              {ga.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {globalAttributes.length === 0 ? 'אין תכונות גלובליות. לחץ על "סנכרן תכונות" כדי לייבא מ-WooCommerce.' : `${globalAttributes.length} תכונות גלובליות זמינות`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-slate-900 dark:text-slate-100">
                      שם התכונה {attribute.global_attribute_id && <Badge variant="secondary" className="mr-2">גלובלית</Badge>}
                    </Label>
                    <Input
                      value={attribute.name}
                      onChange={e => handleUpdateAttribute(index, 'name', e.target.value)}
                      placeholder="שם התכונה"
                      disabled={!!attribute.global_attribute_id}
                    />
                  </div>
                )}

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