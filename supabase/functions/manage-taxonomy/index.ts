/**
 * Manage Taxonomy Edge Function
 * Handles creation, update, and deletion of WooCommerce taxonomies
 * Last deployment: 2025-11-09
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getStoreDetails } from "../_shared/store-utils.ts";
import { withAuth, verifyStoreAccess } from "../_shared/auth-middleware.ts";
import { manageTaxonomyRequestSchema, validateRequest } from "../_shared/validation-schemas.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageTaxonomyRequest {
  storeId: string;
  type: 'category' | 'tag' | 'brand';
  action: 'create' | 'update' | 'delete';
  data: {
    name?: string;
    parent_id?: number;
    id?: number;
  };
}

serve(withAuth(async (req, auth) => {
  try {
    const body = await req.json();

    // Validate request body
    const validation = validateRequest(manageTaxonomyRequestSchema, body);
    if (!validation.success) {
      return new Response(JSON.stringify({
        error: validation.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { storeId, type, action, data } = validation.data;

    // Verify user has access to this store
    const accessCheck = await verifyStoreAccess(auth.userId, storeId);
    if (!accessCheck.success) {
      return new Response(JSON.stringify({
        error: accessCheck.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store details with credentials
    const store = await getStoreDetails(storeId);

    let baseUrl = store.url.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }

    const endpointMap = {
      category: '/wp-json/wc/v3/products/categories',
      tag: '/wp-json/wc/v3/products/tags',
      brand: '/wp-json/wc/v3/products/brands'
    };

    const tableMap = {
      category: 'store_categories',
      tag: 'store_tags',
      brand: 'store_brands'
    };

    const endpoint = endpointMap[type];
    const table = tableMap[type];
    const basicAuth = btoa(`${store.api_key}:${store.api_secret}`);

    let result;

    switch (action) {
      case 'create': {
        console.log('Creating taxonomy with data:', data);
        
        // POST to WooCommerce
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: data.name,
            ...(type === 'category' && data.parent_id ? { parent: data.parent_id } : {})
          })
        });

        let created;
        
        if (!response.ok) {
          const errorText = await response.text();
          
          // Check if the error is because the term already exists
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.code === 'term_exists' && errorJson.data?.resource_id) {
              // Term exists, fetch it from WooCommerce
              console.log(`Term already exists with ID: ${errorJson.data.resource_id}, fetching it...`);
              
              const fetchResponse = await fetch(`${baseUrl}${endpoint}/${errorJson.data.resource_id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Basic ${basicAuth}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (fetchResponse.ok) {
                created = await fetchResponse.json();
              } else {
                throw new Error(`WooCommerce error: ${errorText}`);
              }
            } else {
              throw new Error(`WooCommerce error: ${errorText}`);
            }
          } catch (parseError) {
            throw new Error(`WooCommerce error: ${errorText}`);
          }
        } else {
          created = await response.json();
        }

        console.log('Created/fetched from WooCommerce:', created);

        // Check if already exists in local DB
        const { data: existing, error: existingError } = await supabase
          .from(table)
          .select('*')
          .eq('woo_id', created.id)
          .eq('store_id', storeId)
          .maybeSingle();

        console.log('Existing in DB:', existing, 'Error:', existingError);

        // Find parent_id BEFORE insert/update (for categories with parent)
        let parentId: string | null = null;
        if (type === 'category' && created.parent) {
          console.log('🔍 Looking for parent category with woo_id:', created.parent);
          
          const { data: parentCategory, error: parentError } = await supabase
            .from('store_categories')
            .select('id, name, woo_id')
            .eq('woo_id', created.parent)
            .eq('store_id', storeId)
            .single();
          
          console.log('Found parent category:', parentCategory, 'Error:', parentError);
          
          if (parentCategory) {
            parentId = parentCategory.id;
            console.log('✅ Found parent_id:', parentId, 'for parent name:', parentCategory.name);
          } else {
            console.warn('⚠️ Parent category not found for woo_id:', created.parent);
          }
        }

        if (!existing) {
          // Insert to local DB with correct parent_id from the start
          const insertData: any = {
            store_id: storeId,
            woo_id: created.id,
            name: created.name,
            slug: created.slug,
            count: created.count || 0
          };

          if (type === 'category') {
            insertData.parent_id = parentId;  // ✅ Already correct!
            insertData.parent_woo_id = created.parent || null;
            insertData.image_url = created.image?.src || null;
            console.log('📦 Category insert data with parent_id:', insertData);
          } else if (type === 'brand') {
            insertData.logo_url = null;
          }

          const { error: insertError, data: insertedData } = await supabase
            .from(table)
            .insert(insertData)
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Error inserting to local DB:', insertError);
            throw insertError;
          }
          
          console.log('✅ Inserted to local DB with parent_id:', parentId || 'null (root)');
          
          // ✅ No separate UPDATE needed anymore - parent_id is already correct!
          
        } else {
          console.log(`ℹ️ Item already exists in local DB with woo_id ${created.id}, updating it...`);
          
          // Update existing entry with correct parent_id
          const updateData: any = {
            name: created.name,
            slug: created.slug,
            count: created.count || 0
          };

          if (type === 'category') {
            updateData.parent_id = parentId;  // ✅ Already correct!
            updateData.parent_woo_id = created.parent || null;
            updateData.image_url = created.image?.src || null;
            console.log('📦 Category update data with parent_id:', updateData);
          }

          const { error: updateError } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', existing.id);

          if (updateError) {
            console.error('❌ Error updating existing entry:', updateError);
            throw updateError;
          }

          console.log('✅ Updated existing entry with parent_id:', parentId || 'null (root)');
          
          // ✅ No separate UPDATE needed anymore - parent_id is already correct!
        }

        result = created;
        break;
      }

      case 'update': {
        // PUT to WooCommerce
        const response = await fetch(`${baseUrl}${endpoint}/${data.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: data.name,
            ...(type === 'category' && data.parent_id !== undefined ? { parent: data.parent_id } : {})
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`WooCommerce error: ${error}`);
        }

        const updated = await response.json();

        // Update local DB
        const updateData: any = {
          name: updated.name,
          slug: updated.slug
        };

        if (type === 'category') {
          updateData.parent_woo_id = updated.parent || null;
          
          // Find parent_id if needed
          let parentId: string | null = null;
          if (updated.parent) {
            const { data: parentCategory } = await supabase
              .from('store_categories')
              .select('id')
              .eq('woo_id', updated.parent)
              .eq('store_id', storeId)
              .single();
            
            if (parentCategory) {
              parentId = parentCategory.id;
            }
          }
          
          updateData.parent_id = parentId;
        }

        await supabase
          .from(table)
          .update(updateData)
          .eq('woo_id', data.id);

        result = updated;
        break;
      }

      case 'delete': {
        // DELETE from WooCommerce
        const response = await fetch(`${baseUrl}${endpoint}/${data.id}?force=true`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`WooCommerce error: ${error}`);
        }

        // Delete from local DB
        await supabase
          .from(table)
          .delete()
          .eq('woo_id', data.id);

        result = { success: true };
        break;
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in manage-taxonomy:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
