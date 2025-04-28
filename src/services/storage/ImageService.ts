
import { ImageMetadata, ImageStorageProvider, ImageVersion } from "./types";
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
      const fileVersions = await this.storageProvider.generateVersions(file);
      // Initialize with all required properties to fix Type '{}' error
      const uploadedVersions: Record<ImageVersion, string> = {
        thumbnail: '',
        medium: '',
        large: '',
        original: ''
      };
      
      // Upload each version
      for (const [version, versionFile] of Object.entries(fileVersions)) {
        const fileName = `${nanoid()}-${version}-${file.name}`;
        const path = `${storeId}/${productId}/${fileName}`;
        uploadedVersions[version as ImageVersion] = await this.storageProvider.uploadImage(versionFile, path);
      }

      // Save image metadata to the database
      const { data, error } = await supabase
        .from('product_images')
        .insert({
          store_id: storeId,
          product_id: productId,
          original_url: uploadedVersions.original,
          storage_url: uploadedVersions.large, // Default display version
          storage_source: 'supabase',
          type: metadata.type,
          alt_text: metadata.alt_text,
          description: metadata.description,
          display_order: metadata.display_order,
          versions: uploadedVersions,
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

      if (image.storage_source === 'supabase' && image.versions) {
        // Delete all versions of the image
        // Fix the type casting issue by ensuring the value is a string
        for (const url of Object.values(image.versions as Record<ImageVersion, string>)) {
          await this.storageProvider.deleteImage(url);
        }
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
