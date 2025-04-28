
import React from 'react';
import { ImagePreview } from './ImagePreview';
import { ImageVersion } from '@/services/storage/types';

interface ImageGalleryProps {
  images: Array<{
    id: string;
    versions: Record<ImageVersion, string>;
  }>;
  onImageSelect?: (imageId: string) => void;
}

export function ImageGallery({ images, onImageSelect }: ImageGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image.id} className="space-y-4">
          <ImagePreview
            url={image.versions.large}
            version="large"
            onClick={() => onImageSelect?.(image.id)}
          />
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
