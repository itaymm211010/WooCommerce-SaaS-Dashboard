
import React, { useState } from 'react';
import { Shell } from "@/components/layout/Shell";
import { ImageUploader } from '@/components/ImageUpload/ImageUploader';
import { ImageGallery } from '@/components/ImageUpload/ImageGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageVersion } from '@/services/storage/types';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

type DemoImage = {
  id: string;
  versions: Record<ImageVersion, string>;
};

export default function ImageManagementDemo() {
  const [images, setImages] = useState<DemoImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (imageData: any) => {
    if (!imageData || !imageData.id || !imageData.versions) {
      setError('התקבל מידע חסר מתהליך העלאת התמונה');
      return;
    }

    setImages((prev) => [...prev, {
      id: imageData.id,
      versions: imageData.versions || {}
    }]);
    
    setError(null);
    toast.success('תמונה הועלתה בהצלחה');
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImageId(imageId);
    toast.success('התמונה נבחרה כתמונה ראשית');
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
              <CardHeader>
                <CardTitle>גלריית תמונות</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGallery 
                  images={images}
                  onImageSelect={handleImageSelect}
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
