
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Trash2, GripVertical } from 'lucide-react';
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

export interface GalleryImage {
  id: string;
  url: string;
  alt_text: string;
  isFeatured: boolean;
  storageSource: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  onSetFeatured: (imageId: string) => void;
  onDeleteImage: (imageId: string, storageSource: string) => void;
  isDeleting?: string | null;
}

export function ImageGallery({ images, onSetFeatured, onDeleteImage, isDeleting }: ImageGalleryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        אין תמונות בגלריה עדיין
      </div>
    );
  }

  const imageToDelete = images.find(img => img.id === confirmDeleteId);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
              image.isFeatured
                ? 'border-primary shadow-md'
                : 'border-transparent hover:border-muted-foreground/30'
            }`}
          >
            {/* Image */}
            <div className="aspect-square bg-muted">
              <img
                src={image.url}
                alt={image.alt_text || 'תמונת מוצר'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>

            {/* Featured badge */}
            {image.isFeatured && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                ראשית
              </div>
            )}

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!image.isFeatured && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onSetFeatured(image.id)}
                  title="הגדר כתמונה ראשית"
                  className="h-8 px-2 text-xs"
                >
                  <Star className="h-3.5 w-3.5 mr-1" />
                  ראשית
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmDeleteId(image.id)}
                disabled={isDeleting === image.id}
                title="מחק תמונה"
                className="h-8 px-2 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תמונה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק תמונה זו?
              {imageToDelete?.isFeatured && (
                <span className="block mt-2 font-semibold text-destructive">
                  זוהי התמונה הראשית של המוצר.
                </span>
              )}
              פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId && imageToDelete) {
                  onDeleteImage(confirmDeleteId, imageToDelete.storageSource);
                  setConfirmDeleteId(null);
                }
              }}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
