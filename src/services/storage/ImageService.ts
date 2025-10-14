
import { ImageMetadata, ImageStorageProvider, ImageVersion } from "./types";
import { SupabaseStorageProvider } from "./SupabaseStorageProvider";
import { supabase } from "@/integrations/supabase/client";
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
      console.log('Generating image versions...');
      const fileVersions = await this.storageProvider.generateVersions(file);
      
      // Initialize with all required properties
      const uploadedVersions: Record<ImageVersion, string> = {
        thumbnail: '',
        medium: '',
        large: '',
        original: ''
      };
      
      console.log('Uploading each version...');
      // Upload each version
      for (const [version, versionFile] of Object.entries(fileVersions)) {
        const fileName = `${storeId}/${productId}/${nanoid()}-${version}-${file.name.replace(/\s+/g, '-')}`;
        console.log(`Uploading ${version} version: ${fileName}`);
        uploadedVersions[version as ImageVersion] = await this.storageProvider.uploadImage(versionFile, fileName);
      }
      
      console.log('All versions uploaded successfully:', uploadedVersions);

      // For demo purposes, we'll just return the data without saving to the database
      // In a real application, you would save this to the database
      if (storeId === 'demo-store') {
        const demoImageData = {
          id: nanoid(),
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
        };
        
        console.log('Demo image data created:', demoImageData);
        return demoImageData;
      }

      // Save image metadata to the database for real applications
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
        })
        .select()
        .single();

      if (error) {
        console.error('Database error while saving image metadata:', error);
        throw error;
      }
      
      // Update the versions field separately
      const { error: updateError } = await supabase
        .from('product_images')
        .update({ versions: uploadedVersions })
        .eq('id', data.id);
        
      if (updateError) {
        console.error('Error updating versions:', updateError);
        throw updateError;
      }
      
      // Return the complete data with versions
      return { ...data, versions: uploadedVersions };
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  async deleteProductImage(imageId: string) {
    try {
      // For demo purposes
      if (imageId.startsWith('demo-') || !imageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Demo image deletion, no database interaction needed');
        return;
      }
      
      const { data: image, error: fetchError } = await supabase
        .from('product_images')
        .select('versions, storage_source')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        console.error('Error fetching image for deletion:', fetchError);
        throw fetchError;
      }

      if (image.storage_source === 'supabase' && image.versions) {
        console.log('Deleting image files from storage:', image.versions);
        // Delete all versions of the image
        for (const url of Object.values(image.versions as Record<ImageVersion, string>)) {
          if (url) {
            await this.storageProvider.deleteImage(url);
          }
        }
      }

      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('Error deleting image from database:', deleteError);
        throw deleteError;
      }
    } catch (error) {
      console.error('Error deleting product image:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService();
