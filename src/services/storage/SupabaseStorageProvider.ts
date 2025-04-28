
import { supabase } from "@/lib/supabase";
import { ImageStorageProvider } from "./types";

export class SupabaseStorageProvider implements ImageStorageProvider {
  private bucket = 'product-images';

  async uploadImage(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  }

  async deleteImage(url: string): Promise<void> {
    const path = url.split('/').slice(-2).join('/');
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([path]);

    if (error) throw error;
  }

  async optimizeImage(file: File): Promise<File> {
    // For now, return the original file
    // We'll implement WebP conversion later
    return file;
  }
}
