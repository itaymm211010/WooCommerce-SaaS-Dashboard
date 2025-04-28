
export type ImageVersion = 'thumbnail' | 'medium' | 'large' | 'original';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageMetadata {
  alt_text?: string;
  description?: string;
  type: 'gallery' | 'featured' | 'variation';
  display_order: number;
  dimensions?: ImageDimensions;
  format?: string;
  size?: number;
  versions?: Record<ImageVersion, string>;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

export interface ImageStorageProvider {
  uploadImage: (file: File, path: string, options?: ImageOptimizationOptions) => Promise<string>;
  deleteImage: (url: string) => Promise<void>;
  optimizeImage: (file: File, options?: ImageOptimizationOptions) => Promise<File>;
  generateVersions: (file: File) => Promise<Record<ImageVersion, File>>;
}
