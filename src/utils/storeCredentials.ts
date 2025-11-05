/**
 * Secure utilities for accessing store credentials
 * Uses RPC functions to prevent direct exposure of sensitive data
 */

import { supabase } from "@/integrations/supabase/client";

export interface StoreCredentials {
  api_key: string;
  api_secret: string;
  webhook_secret: string | null;
}

/**
 * Securely retrieves store credentials using RPC function
 * This logs the access and enforces proper authorization
 */
export async function getStoreCredentials(
  storeId: string
): Promise<StoreCredentials | null> {
  try {
    const { data, error } = await supabase.rpc('get_store_credentials', {
      store_uuid: storeId
    }).single();

    if (error) {
      console.error('Error fetching store credentials:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return data as StoreCredentials;
  } catch (error) {
    console.error('Failed to get store credentials:', error);
    throw error;
  }
}

/**
 * Logs credential access for audit trail
 */
export async function logCredentialAccess(storeId: string): Promise<void> {
  try {
    // Get client info for audit
    const userAgent = navigator.userAgent;

    await supabase.rpc('log_credential_access', {
      store_uuid: storeId,
      ip: null, // IP is handled server-side
      agent: userAgent
    });
  } catch (error) {
    // Don't throw - logging failure shouldn't block the operation
    console.error('Failed to log credential access:', error);
  }
}

/**
 * Wrapper function that gets credentials and logs the access
 */
export async function getAndLogStoreCredentials(
  storeId: string
): Promise<StoreCredentials | null> {
  const credentials = await getStoreCredentials(storeId);

  if (credentials) {
    // Log the access asynchronously
    logCredentialAccess(storeId).catch(console.error);
  }

  return credentials;
}
