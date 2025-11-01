import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStoreTaxonomies } from '../products/hooks/useStoreTaxonomies';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { RefreshCw, FolderTree, Tag, Package, Loader2, Plus, Edit, Trash } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Shell } from '@/components/layout/Shell';
import { CreateCategoryDialog } from './components/CreateCategoryDialog';
import { CreateTagDialog } from './components/CreateTagDialog';
import { CreateBrandDialog } from './components/CreateBrandDialog';
import { CategoryTreeItem } from './components/CategoryTreeItem';
import { buildCategoryTree } from './utils/categoryTree';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function StoreTaxonomiesPage() {
  const { id: storeId } = useParams();
  const { data: taxonomies, isLoading } = useStoreTaxonomies(storeId);
  const queryClient = useQueryClient();
  
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [createBrandOpen, setCreateBrandOpen] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: string, id: number, name: string} | null>(null);
  
  const categories = taxonomies?.categories || [];
  const tags = taxonomies?.tags || [];
  const brands = taxonomies?.brands || [];
  
  const categoryTree = buildCategoryTree(categories);
  
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
        description: `נוצרו: ${data.summary.created}, עודכנו: ${data.summary.updated}, נמחקו: ${data.summary.deleted || 0}`,
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
  
  const handleCreateTaxonomy = async (type: 'category' | 'tag' | 'brand', data: any) => {
    try {
      const { error } = await supabase.functions.invoke('manage-taxonomy', {
        body: {
          storeId,
          type,
          action: 'create',
          data
        }
      });
      
      if (error) throw error;
      
      toast.success(`${type === 'category' ? 'קטגוריה' : type === 'tag' ? 'תג' : 'מותג'} נוצר בהצלחה`);
      
      // רענן נתונים
      const queryKey = type === 'category' ? 'store-categories' : type === 'tag' ? 'store-tags' : 'store-brands';
      await queryClient.invalidateQueries({ queryKey: [queryKey, storeId] });
    } catch (error: any) {
      toast.error('שגיאה ביצירה', { description: error.message });
      throw error;
    }
  };
  
  const handleDeleteTaxonomy = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase.functions.invoke('manage-taxonomy', {
        body: {
          storeId,
          type: itemToDelete.type,
          action: 'delete',
          data: { id: itemToDelete.id }
        }
      });
      
      if (error) throw error;
      
      toast.success(`${itemToDelete.name} נמחק בהצלחה`);
      
      const queryKey = itemToDelete.type === 'category' ? 'store-categories' : 
                       itemToDelete.type === 'tag' ? 'store-tags' : 'store-brands';
      await queryClient.invalidateQueries({ queryKey: [queryKey, storeId] });
      
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error('שגיאה במחיקה', { description: error.message });
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>קטגוריות</CardTitle>
                    <CardDescription>
                      {categories.length} קטגוריות בחנות
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCreateCategoryOpen(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    קטגוריה חדשה
                  </Button>
                </div>
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
                    <p className="text-sm">לחץ על "סנכרן מווקומרס" או "קטגוריה חדשה" כדי להתחיל</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryTree.map(cat => (
                      <CategoryTreeItem 
                        key={cat.id} 
                        category={cat}
                        onDelete={(cat) => {
                          setItemToDelete({ type: 'category', id: cat.id, name: cat.name });
                          setDeleteDialogOpen(true);
                        }}
                      />
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>תגים</CardTitle>
                    <CardDescription>
                      {tags.length} תגים בחנות
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCreateTagOpen(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    תג חדש
                  </Button>
                </div>
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
                    <p className="text-sm">לחץ על "סנכרן מווקומרס" או "תג חדש" כדי להתחיל</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <div 
                        key={tag.id} 
                        className="group relative px-3 py-1 bg-secondary rounded-full text-sm hover:bg-secondary/80 transition-colors flex items-center gap-2"
                      >
                        <span>{tag.name}</span>
                        <span className="text-muted-foreground">({tag.count})</span>
                        <button
                          onClick={() => {
                            setItemToDelete({ type: 'tag', id: tag.id, name: tag.name });
                            setDeleteDialogOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>מותגים</CardTitle>
                    <CardDescription>
                      {brands.length} מותגים בחנות
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCreateBrandOpen(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    מותג חדש
                  </Button>
                </div>
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
                    <p className="text-sm">לחץ על "סנכרן מווקומרס" או "מותג חדש" כדי להתחיל</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {brands.map(brand => (
                      <div 
                        key={brand.id} 
                        className="group relative p-4 border rounded text-center hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{brand.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {brand.slug}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {brand.count} מוצרים
                        </div>
                        <button
                          onClick={() => {
                            setItemToDelete({ type: 'brand', id: brand.id, name: brand.name });
                            setDeleteDialogOpen(true);
                          }}
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialogs */}
      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        availableCategories={categories}
        onSubmit={(data) => handleCreateTaxonomy('category', data)}
      />
      
      <CreateTagDialog
        open={createTagOpen}
        onOpenChange={setCreateTagOpen}
        onSubmit={(data) => handleCreateTaxonomy('tag', data)}
      />
      
      <CreateBrandDialog
        open={createBrandOpen}
        onOpenChange={setCreateBrandOpen}
        onSubmit={(data) => handleCreateTaxonomy('brand', data)}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את "{itemToDelete?.name}" מווקומרס ומהמערכת.
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTaxonomy}>
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
