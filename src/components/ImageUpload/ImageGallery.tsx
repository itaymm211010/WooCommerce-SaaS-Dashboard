
import React from 'react';
import { ImagePreview } from './ImagePreview';
import { ImageVersion } from '@/services/storage/types';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    id: string;
    versions: Record<ImageVersion, string>;
  }>;
  onImageSelect?: (imageId: string) => void;
  selectedImageId?: string;
}

export function ImageGallery({ images, onImageSelect, selectedImageId }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        אין תמונות בגלריה עדיין
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {images.map((image) => (
        <div key={image.id} className="space-y-4">
          <div 
            className={`cursor-pointer relative group ${selectedImageId === image.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => onImageSelect?.(image.id)}
          >
            <ImagePreview
              url={image.versions.large || image.versions.original}
              version="large"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="secondary" size="sm">
                <Check className="h-4 w-4 mr-2" />
                {selectedImageId === image.id ? 'תמונה ראשית' : 'בחר כתמונה ראשית'}
              </Button>
            </div>
            {selectedImageId === image.id && (
              <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ImagePreview url={image.versions.thumbnail} version="thumbnail" />
            <ImagePreview url={image.versions.medium} version="medium" />
            <ImagePreview url={image.versions.original} version="original" />
          </div>
        </div>
      ))}
    </div>
  );
}
