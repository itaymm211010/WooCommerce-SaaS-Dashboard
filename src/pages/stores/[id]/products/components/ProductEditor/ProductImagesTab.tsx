
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from '@/components/ImageUpload/ImageUploader';
import { ImageGallery } from '@/components/ImageUpload/ImageGallery';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ImageVersion } from "@/services/storage/types";
import { ProductNotSavedAlert } from "./ProductNotSavedAlert";
import { AlertCircle } from "lucide-react";

interface ProductImagesTabProps {
  storeId: string;
  productId: string;
}

export function ProductImagesTab({ storeId, productId }: ProductImagesTabProps) {
  const [images, setImages] = useState<Array<{
    id: string;
    versions: Record<ImageVersion, string>;
  }>>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProductImages = async () => {
      if (!productId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .eq('store_id', storeId);

        if (error) {
          throw error;
        }

        // Transform the data to match our expected format
        const formattedImages = data.map(img => ({
          id: img.id,
          versions: img.versions || {
            thumbnail: img.storage_url || img.original_url,
            medium: img.storage_url || img.original_url,
            large: img.storage_url || img.original_url,
            original: img.original_url
          },
        }));

        setImages(formattedImages);

        // Fetch the product to get the featured image ID
        const { data: productData } = await supabase
          .from('products')
          .select('featured_image_id')
          .eq('id', productId)
          .single();

        if (productData && productData.featured_image_id) {
          setSelectedImageId(productData.featured_image_id);
        }
      } catch (err: any) {
        console.error('Error fetching product images:', err);
        setError(err.message || 'אירעה שגיאה בטעינת התמונות');
        toast.error('שגיאה בטעינת תמונות המוצר');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductImages();
  }, [storeId, productId]);

  const handleUploadComplete = (imageData: any) => {
    if (!imageData || !imageData.id) {
      setError('התקבל מידע חסר מתהליך העלאת התמונה');
      return;
    }

    // Add the new image to the list
    setImages(prev => [...prev, {
      id: imageData.id,
      versions: imageData.versions || {}
    }]);
    
    // If this is the first image, set it as featured
    if (images.length === 0) {
      handleImageSelect(imageData.id);
    }

    toast.success('תמונה הועלתה בהצלחה');
  };

  const handleImageSelect = async (imageId: string) => {
    if (!productId || productId === "new") {
      toast.error('יש לשמור את המוצר תחילה לפני הגדרת תמונה ראשית');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          featured_image_id: imageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('store_id', storeId);

      if (error) throw error;

      setSelectedImageId(imageId);
      toast.success('התמונה נקבעה כתמונה ראשית');
      
      // Invalidate the product query to update the UI
      queryClient.invalidateQueries({ queryKey: ['product', storeId, productId] });
    } catch (err: any) {
      console.error('Error setting featured image:', err);
      toast.error(`שגיאה בהגדרת תמונה ראשית: ${err.message}`);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    // This will be implemented in Phase 2
    toast.info('מחיקת תמונות תהיה זמינה בשלב הבא');
  };

  if (!productId || productId === "new") {
    return (
      <ProductNotSavedAlert />
    );
  }

  if (error && error.includes("infinite recursion")) {
    return (
      <ProductNotSavedAlert 
        title="שגיאת הרשאות" 
        description="נראה שיש בעיה בהרשאות הגישה למערכת. אנא צור קשר עם מנהל המערכת." 
        variant="warning"
      />
    );
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
            onError={(msg) => {
              setError(msg);
              toast.error(msg);
            }}
          />
        </CardContent>
      </Card>

      {error && (
        <ProductNotSavedAlert 
          title="שגיאה" 
          description={error} 
          variant="warning" 
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>גלריית תמונות מוצר</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-8">טוען תמונות...</div>
          ) : images.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              אין תמונות למוצר זה עדיין
            </div>
          ) : (
            <ImageGallery
              images={images}
              onImageSelect={handleImageSelect}
              selectedImageId={selectedImageId || undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
