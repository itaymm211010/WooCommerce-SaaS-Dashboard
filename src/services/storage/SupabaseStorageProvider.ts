
import { supabase } from "@/lib/supabase";
import { ImageOptimizationOptions, ImageStorageProvider, ImageVersion } from "./types";

export class SupabaseStorageProvider implements ImageStorageProvider {
  private bucket = 'product-images';
  private readonly defaultVersionConfig = {
    thumbnail: { maxWidth: 150, maxHeight: 150, quality: 80 },
    medium: { maxWidth: 600, maxHeight: 600, quality: 85 },
    large: { maxWidth: 1200, maxHeight: 1200, quality: 90 },
    original: { quality: 95 }
  };

  async uploadImage(file: File, path: string, options?: ImageOptimizationOptions): Promise<string> {
    try {
      console.log(`Uploading to bucket: ${this.bucket}, path: ${path}`);
      
      // Upload to the storage bucket
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`העלאת התמונה נכשלה: ${error.message}`);
      }

      if (!data) {
        throw new Error('לא התקבל מידע מהשרת לאחר העלאת התמונה');
      }

      // Get the public URL for the uploaded file
      const { data: publicUrl } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(data.path);

      if (!publicUrl || !publicUrl.publicUrl) {
        throw new Error('לא ניתן לקבל כתובת ציבורית לתמונה');
      }

      console.log('Uploaded successfully, public URL:', publicUrl.publicUrl);
      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('שגיאה לא ידועה בהעלאת התמונה');
      }
    }
  }

  async deleteImage(url: string): Promise<void> {
    try {
      // Extract path from URL
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
      if (!pathMatch || !pathMatch[1]) {
        throw new Error('לא ניתן לחלץ את הנתיב מה-URL');
      }
      
      const path = decodeURIComponent(pathMatch[1]);
      console.log(`Deleting from bucket: ${this.bucket}, path: ${path}`);
      
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        throw new Error(`מחיקת התמונה נכשלה: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async optimizeImage(file: File, options?: ImageOptimizationOptions): Promise<File> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const img = await createImageBitmap(file);
      const { width, height } = this.calculateDimensions(img, options);

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const format = options?.format || 'webp';
      const quality = options?.quality ? options.quality / 100 : 0.9;

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), `image/${format}`, quality);
      });

      return new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), {
        type: `image/${format}`
      });
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw error;
    }
  }

  async generateVersions(file: File): Promise<Record<ImageVersion, File>> {
    try {
      const versions: Partial<Record<ImageVersion, File>> = {};
      
      for (const [version, config] of Object.entries(this.defaultVersionConfig)) {
        versions[version as ImageVersion] = await this.optimizeImage(file, {
          ...config,
          format: this.isWebPSupported() ? 'webp' : 'jpeg'
        });
      }

      return versions as Record<ImageVersion, File>;
    } catch (error) {
      console.error('Error generating versions:', error);
      throw error;
    }
  }

  private calculateDimensions(
    img: ImageBitmap,
    options?: ImageOptimizationOptions
  ): { width: number; height: number } {
    const maxWidth = options?.maxWidth || img.width;
    const maxHeight = options?.maxHeight || img.height;
    
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
    
    return { width, height };
  }

  private isWebPSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    const cached = localStorage.getItem('webpSupport');
    if (cached !== null) return cached === 'true';
    
    const canvas = document.createElement('canvas');
    const isSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    
    localStorage.setItem('webpSupport', isSupported.toString());
    return isSupported;
  }
}
