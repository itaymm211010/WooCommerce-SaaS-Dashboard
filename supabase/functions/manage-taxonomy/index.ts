import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { storeId, type, action, data } = await req.json() as ManageTaxonomyRequest;

    // Fetch store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

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
    const auth = btoa(`${store.api_key}:${store.api_secret}`);

    let result;

    switch (action) {
      case 'create': {
        console.log('Creating taxonomy with data:', data);
        
        // POST to WooCommerce
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
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
                  'Authorization': `Basic ${auth}`,
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
        const { data: existing } = await supabase
          .from(table)
          .select('*')
          .eq('woo_id', created.id)
          .eq('store_id', storeId)
          .single();

        if (!existing) {
          // Insert to local DB
          const insertData: any = {
            store_id: storeId,
            woo_id: created.id,
            name: created.name,
            slug: created.slug,
            count: created.count || 0
          };

          if (type === 'category') {
            insertData.parent_woo_id = created.parent || null;
            insertData.image_url = created.image?.src || null;
          } else if (type === 'brand') {
            insertData.logo_url = null;
          }

          const { error: insertError } = await supabase.from(table).insert(insertData);
          
          if (insertError) {
            console.error('Error inserting to local DB:', insertError);
            throw insertError;
          }
          
          console.log('Inserted to local DB:', insertData);
          
          // Update parent_id after insert if this is a category
          if (type === 'category' && created.parent) {
            const { data: parentCategory } = await supabase
              .from('store_categories')
              .select('id')
              .eq('woo_id', created.parent)
              .eq('store_id', storeId)
              .single();
            
            if (parentCategory) {
              await supabase
                .from('store_categories')
                .update({ parent_id: parentCategory.id })
                .eq('woo_id', created.id)
                .eq('store_id', storeId);
              
              console.log('Updated parent_id to:', parentCategory.id);
            }
          }
        } else {
          console.log(`Item already exists in local DB, skipping insert`);
        }

        result = created;
        break;
      }

      case 'update': {
        // PUT to WooCommerce
        const response = await fetch(`${baseUrl}${endpoint}/${data.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
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
            'Authorization': `Basic ${auth}`,
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
