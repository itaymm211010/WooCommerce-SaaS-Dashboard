import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStoreTaxonomies } from '../products/hooks/useStoreTaxonomies';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { RefreshCw, FolderTree, Tag, Package, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Shell } from '@/components/layout/Shell';

export default function StoreTaxonomiesPage() {
  const { id: storeId } = useParams();
  const { data: taxonomies, isLoading } = useStoreTaxonomies(storeId);
  const queryClient = useQueryClient();
  
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  
  const categories = taxonomies?.categories || [];
  const tags = taxonomies?.tags || [];
  const brands = taxonomies?.brands || [];
  
  const handleSync = async () => {
    if (!storeId) return;
    
    setSyncing(true);
    setSyncProgress(0);
    setSyncMessage('מתחיל סנכרון...');
    
    try {
      // סימולציה של progress
      setSyncProgress(10);
      setSyncMessage('טוען נתונים מווקומרס...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setSyncProgress(30);
      
      // קריאה ל-Edge Function
      const { data, error } = await supabase.functions.invoke('sync-taxonomies', {
        body: { storeId }
      });
      
      if (error) throw error;
      
      setSyncProgress(90);
      setSyncMessage('שומר נתונים...');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setSyncProgress(100);
      setSyncMessage('הסנכרון הושלם!');
      
      // הצג תוצאות
      toast.success('הסנכרון הושלם בהצלחה!', {
        description: `נוצרו: ${data.summary.created}, עודכנו: ${data.summary.updated}`,
      });
      
      // רענן את הנתונים
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['store-categories', storeId] }),
        queryClient.invalidateQueries({ queryKey: ['store-tags', storeId] }),
        queryClient.invalidateQueries({ queryKey: ['store-brands', storeId] })
      ]);
      
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('שגיאה בסנכרון', {
        description: error.message
      });
    } finally {
      setSyncing(false);
      setTimeout(() => {
        setSyncProgress(0);
        setSyncMessage('');
      }, 1000);
    }
  };
  
  return (
    <Shell>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">קטגוריות, תגים ומותגים</h1>
            <p className="text-muted-foreground mt-1">
              ניהול טקסונומיות החנות מווקומרס
            </p>
          </div>
          
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            size="lg"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מסנכרן...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                סנכרן מווקומרס
              </>
            )}
          </Button>
        </div>
        
        {/* Progress Bar */}
        {syncing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{syncMessage}</span>
                  <span>{Math.round(syncProgress)}%</span>
                </div>
                <Progress value={syncProgress} />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Tabs */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">
              <FolderTree className="mr-2 h-4 w-4" />
              קטגוריות ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tag className="mr-2 h-4 w-4" />
              תגים ({tags.length})
            </TabsTrigger>
            <TabsTrigger value="brands">
              <Package className="mr-2 h-4 w-4" />
              מותגים ({brands.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>קטגוריות</CardTitle>
                <CardDescription>
                  {categories.length} קטגוריות בחנות
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין קטגוריות</p>
                    <p className="text-sm">לחץ על "סנכרן מווקומרס" כדי לטעון</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div 
                        key={cat.id} 
                        className="flex justify-between items-center p-3 border rounded hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{cat.name}</div>
                            <div className="text-sm text-muted-foreground">{cat.slug}</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cat.id} מוצרים
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>תגים</CardTitle>
                <CardDescription>
                  {tags.length} תגים בחנות
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : tags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין תגים</p>
                    <p className="text-sm">לחץ על "סנכרן מווקומרס" כדי לטעון</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <div 
                        key={tag.id} 
                        className="px-3 py-1 bg-secondary rounded-full text-sm hover:bg-secondary/80 transition-colors"
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>מותגים</CardTitle>
                <CardDescription>
                  {brands.length} מותגים בחנות
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : brands.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין מותגים</p>
                    <p className="text-sm">לחץ על "סנכרן מווקומרס" או ש-WooCommerce שלך אינו תומך במותגים (גרסה 9.0+)</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {brands.map(brand => (
                      <div 
                        key={brand.id} 
                        className="p-4 border rounded text-center hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{brand.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {brand.slug}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
