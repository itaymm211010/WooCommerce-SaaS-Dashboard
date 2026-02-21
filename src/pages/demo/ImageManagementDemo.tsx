
import React, { useState } from 'react';
import { Shell } from "@/components/layout/Shell";
import { ImageUploader } from '@/components/ImageUpload/ImageUploader';
import { ImageGallery } from '@/components/ImageUpload/ImageGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageVersion } from '@/services/storage/types';
import { GalleryImage } from '@/components/ImageUpload/ImageGallery';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageService } from '@/services/storage/ImageService';

type DemoImage = GalleryImage & {
  versions: Record<ImageVersion, string>;
};

export default function ImageManagementDemo() {
  const [images, setImages] = useState<DemoImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUploadComplete = (imageData: any) => {
    console.log('Upload complete, received data:', imageData);
    
    if (!imageData || !imageData.id || !imageData.versions) {
      setError('התקבל מידע חסר מתהליך העלאת התמונה');
      return;
    }

    const versions = imageData.versions || {};
    setImages((prev) => [...prev, {
      id: imageData.id,
      versions,
      url: versions.medium || versions.original || versions.thumbnail || '',
      alt_text: '',
      isFeatured: prev.length === 0,
      storageSource: 'supabase',
    }]);
    
    setError(null);
    toast.success('תמונה הועלתה בהצלחה');
  };

  const handleSetFeatured = (imageId: string) => {
    setSelectedImageId(imageId);
    setImages(prev => prev.map(img => ({ ...img, isFeatured: img.id === imageId })));
    toast.success('התמונה נבחרה כתמונה ראשית');
  };

  const handleDeleteImage = async (imageId: string, _storageSource?: string) => {
    try {
      setIsDeleting(true);
      const imageService = new ImageService();
      await imageService.deleteProductImage(imageId);
      
      setImages(prev => prev.filter(img => img.id !== imageId));
      
      if (selectedImageId === imageId) {
        setSelectedImageId(null);
      }
      
      toast.success('התמונה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(`שגיאה במחיקת תמונה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadError = (errorMessage: string) => {
    console.error('Upload error:', errorMessage);
    setError(errorMessage);
    toast.error(`שגיאה בהעלאת תמונה: ${errorMessage}`);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול תמונות</h1>
          <p className="text-muted-foreground">
            העלאת וניהול תמונות מוצר עם אופטימיזציה אוטומטית
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>העלאת תמונה חדשה</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader 
                storeId="demo-store"
                productId="demo-product"
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            </CardContent>
          </Card>

          {images.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>גלריית תמונות</CardTitle>
                {selectedImageId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteImage(selectedImageId)}
                    disabled={isDeleting}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    מחק תמונה נבחרת
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ImageGallery
                  images={images}
                  onSetFeatured={handleSetFeatured}
                  onDeleteImage={handleDeleteImage}
                  isDeleting={isDeleting ? selectedImageId : null}
                />
              </CardContent>
            </Card>
          )}

          {selectedImageId && (
            <div className="p-4 bg-green-100 rounded-lg">
              <p className="text-green-800">
                התמונה הראשית שנבחרה: {selectedImageId}
              </p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
