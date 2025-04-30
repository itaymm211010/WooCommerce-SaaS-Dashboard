
import React, { useCallback, useState } from 'react';
import { ImagePreview } from './ImagePreview';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { ImageService } from '@/services/storage/ImageService';
import { ImageVersion } from '@/services/storage/types';
import { toast } from 'sonner';

interface ImageUploaderProps {
  storeId: string;
  productId: string;
  onUploadComplete?: (imageData: any) => void;
  onError?: (message: string) => void;
}

export function ImageUploader({ storeId, productId, onUploadComplete, onError }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      const errorMsg = 'סוג קובץ לא נתמך. אנא העלה תמונה בפורמט JPEG, PNG, WebP או GIF.';
      onError?.(errorMsg);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'גודל הקובץ גדול מדי. הגודל המקסימלי הוא 10MB.';
      onError?.(errorMsg);
      return;
    }

    try {
      setIsUploading(true);
      setProgress(10);

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      setProgress(30);

      // Upload image with metadata
      const imageService = new ImageService();
      const uploadedImage = await imageService.uploadProductImage(
        file,
        storeId,
        productId,
        {
          type: 'gallery',
          alt_text: file.name,
          description: '',
          display_order: 0
        }
      );

      setProgress(100);
      onUploadComplete?.(uploadedImage);

    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMsg = error instanceof Error ? error.message : 'שגיאה לא ידועה בהעלאת התמונה';
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 500); // Reset progress after a short delay
      
      // Only clear the preview if there was an error
      if (!previewUrl) {
        URL.revokeObjectURL(previewUrl!);
        setPreviewUrl(null);
      }
    }
  }, [storeId, productId, onUploadComplete, onError]);

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">לחץ להעלאת תמונה</span> או גרור לכאן
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG או WebP (מקסימום 10MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-500 text-center">
            מעבד ומעלה את התמונה...
          </p>
        </div>
      )}

      {previewUrl && (
        <div className="relative">
          <img
            src={previewUrl}
            alt="תצוגה מקדימה"
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
