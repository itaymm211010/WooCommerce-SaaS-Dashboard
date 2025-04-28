
import React, { useState } from 'react';
import { Shell } from "@/components/layout/Shell";
import { ImageUploader } from '@/components/ImageUpload/ImageUploader';
import { ImageGallery } from '@/components/ImageUpload/ImageGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageVersion } from '@/services/storage/types';
import { toast } from 'sonner';

type DemoImage = {
  id: string;
  versions: Record<ImageVersion, string>;
};

export default function ImageManagementDemo() {
  const [images, setImages] = useState<DemoImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const handleUploadComplete = (imageData: any) => {
    setImages((prev) => [...prev, {
      id: imageData.id,
      versions: imageData.versions || {}
    }]);
    toast.success('תמונה הועלתה בהצלחה');
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImageId(imageId);
    toast.success('התמונה נבחרה כתמונה ראשית');
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
