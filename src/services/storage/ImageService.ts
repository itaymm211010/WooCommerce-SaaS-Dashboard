
import { ImageMetadata, ImageStorageProvider } from "./types";
import { SupabaseStorageProvider } from "./SupabaseStorageProvider";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export class ImageService {
  private storageProvider: ImageStorageProvider;

  constructor() {
    this.storageProvider = new SupabaseStorageProvider();
  }

  async uploadProductImage(
    file: File,
    storeId: string,
    productId: string,
    metadata: ImageMetadata
  ) {
    try {
      // Generate a unique path for the image
      const fileName = `${nanoid()}-${file.name}`;
      const path = `${storeId}/${productId}/${fileName}`;

      // Optimize and upload the image
      const optimizedFile = await this.storageProvider.optimizeImage?.(file) ?? file;
      const storageUrl = await this.storageProvider.uploadImage(optimizedFile, path);

      // Save image metadata to the database
      const { data, error } = await supabase
        .from('product_images')
        .insert({
          store_id: storeId,
          product_id: productId,
          original_url: storageUrl, // For now, same as storage_url
          storage_url: storageUrl,
          storage_source: 'supabase',
          type: metadata.type,
          alt_text: metadata.alt_text,
          description: metadata.description,
          display_order: metadata.display_order
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  async deleteProductImage(imageId: string) {
    try {
      const { data: image, error: fetchError } = await supabase
        .from('product_images')
        .select()
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      if (image.storage_source === 'supabase') {
        await this.storageProvider.deleteImage(image.storage_url);
      }

      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting product image:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService();
