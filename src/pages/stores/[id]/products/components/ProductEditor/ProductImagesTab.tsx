
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from '@/components/ImageUpload/ImageUploader';
import { ImageGallery, GalleryImage } from '@/components/ImageUpload/ImageGallery';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { imageService } from "@/services/storage/ImageService";
import { ProductNotSavedAlert } from "./ProductNotSavedAlert";

interface ProductImagesTabProps {
  storeId: string;
  productId: string;
}

export function ProductImagesTab({ storeId, productId }: ProductImagesTabProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchImages = async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const [{ data: imagesData, error: imagesError }, { data: productData }] = await Promise.all([
        supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .eq('store_id', storeId)
          .order('display_order', { ascending: true }),
        supabase
          .from('products')
          .select('featured_image_id')
          .eq('id', productId)
          .single()
      ]);

      if (imagesError) throw imagesError;

      const featured = productData?.featured_image_id || null;
      setFeaturedImageId(featured);

      const formatted: GalleryImage[] = (imagesData || []).map(img => ({
        id: img.id,
        url: img.storage_url || img.original_url,
        alt_text: img.alt_text || '',
        isFeatured: img.id === featured,
        storageSource: img.storage_source || 'woocommerce',
      }));

      setImages(formatted);
    } catch (err: any) {
      console.error('Error fetching product images:', err);
      toast.error('שגיאה בטעינת תמונות המוצר');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [storeId, productId]);

  const handleUploadComplete = async (imageData: any) => {
    if (!imageData?.id) return;

    const newImage: GalleryImage = {
      id: imageData.id,
      url: imageData.storage_url || imageData.original_url || (imageData.versions?.large),
      alt_text: imageData.alt_text || '',
      isFeatured: images.length === 0,
      storageSource: imageData.storage_source || 'supabase',
    };

    setImages(prev => [...prev, newImage]);

    // Auto-set as featured if first image
    if (images.length === 0) {
      await handleSetFeatured(imageData.id, false);
    }

    // Sync to WooCommerce
    try {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (product?.woo_id) {
        toast.loading('מסנכרן תמונה עם WooCommerce...', { id: 'woo-img-sync' });
        const { error } = await supabase.functions.invoke('update-woo-product', {
          body: { product, store_id: storeId }
        });
        if (error) {
          toast.error('שגיאה בסנכרון לWooCommerce', { id: 'woo-img-sync' });
        } else {
          toast.success('התמונה סונכרנה לWooCommerce', { id: 'woo-img-sync' });
        }
      }
    } catch (err) {
      console.error('WooCommerce sync error:', err);
    }
  };

  const handleSetFeatured = async (imageId: string, showToast = true) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured_image_id: imageId, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('store_id', storeId);

      if (error) throw error;

      setFeaturedImageId(imageId);
      setImages(prev => prev.map(img => ({ ...img, isFeatured: img.id === imageId })));
      if (showToast) toast.success('התמונה נקבעה כתמונה ראשית');
      queryClient.invalidateQueries({ queryKey: ['product', storeId, productId] });
    } catch (err: any) {
      toast.error(`שגיאה בהגדרת תמונה ראשית: ${err.message}`);
    }
  };

  const handleDeleteImage = async (imageId: string, storageSource: string) => {
    setIsDeletingId(imageId);
    try {
      if (storageSource === 'supabase') {
        // Delete files from storage + DB row
        await imageService.deleteProductImage(imageId);
      } else {
        // WooCommerce image — only delete from DB (not stored in Supabase storage)
        const { error } = await supabase
          .from('product_images')
          .delete()
          .eq('id', imageId);
        if (error) throw error;
      }

      const wasFeature = featuredImageId === imageId;
      const remaining = images.filter(img => img.id !== imageId);
      setImages(remaining);

      // If deleted image was featured, promote first remaining image
      if (wasFeature && remaining.length > 0) {
        await handleSetFeatured(remaining[0].id, false);
        toast.success('התמונה נמחקה. התמונה הראשית עודכנה.');
      } else if (wasFeature) {
        await supabase
          .from('products')
          .update({ featured_image_id: null })
          .eq('id', productId);
        setFeaturedImageId(null);
        toast.success('התמונה נמחקה');
      } else {
        toast.success('התמונה נמחקה');
      }

      // Sync deletion to WooCommerce
      try {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (product?.woo_id) {
          await supabase.functions.invoke('update-woo-product', {
            body: { product, store_id: storeId }
          });
        }
      } catch (err) {
        console.error('WooCommerce sync after delete error:', err);
      }
    } catch (err: any) {
      console.error('Error deleting image:', err);
      toast.error(`שגיאה במחיקת התמונה: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!productId || productId === "new") {
    return <ProductNotSavedAlert />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>העלאת תמונה חדשה</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            storeId={storeId}
            productId={productId}
            onUploadComplete={handleUploadComplete}
            onError={(msg) => toast.error(msg)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            גלריית תמונות
            {images.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground mr-2">
                ({images.length} תמונות)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-8 text-muted-foreground">טוען תמונות...</div>
          ) : (
            <ImageGallery
              images={images}
              onSetFeatured={handleSetFeatured}
              onDeleteImage={handleDeleteImage}
              isDeleting={isDeletingId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
