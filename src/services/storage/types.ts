
export interface ImageMetadata {
  alt_text?: string;
  description?: string;
  type: 'gallery' | 'featured' | 'variation';
  display_order: number;
}

export interface ImageStorageProvider {
  uploadImage: (file: File, path: string) => Promise<string>;
  deleteImage: (url: string) => Promise<void>;
  optimizeImage?: (file: File) => Promise<File>;
}
