import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

export interface SyncLogData {
  store_id: string
  entity_type: string
  action: string
  entity_id?: string | null
  woo_id?: number | null
  status?: string
  metadata?: any
  duration_ms?: number
}

export interface SyncErrorData {
  store_id: string
  entity_type: string
  error_message: string
  error_code?: string
  stack_trace?: string
  entity_id?: string | null
  woo_id?: number | null
  metadata?: any
}

export async function logSyncStart(
  supabase: SupabaseClient,
  data: SyncLogData
): Promise<string | null> {
  try {
    const { data: logData, error } = await supabase
      .from('sync_logs')
      .insert({
        store_id: data.store_id,
        entity_type: data.entity_type,
        action: data.action,
        entity_id: data.entity_id || null,
        woo_id: data.woo_id || null,
        status: 'pending',
        metadata: data.metadata || {}
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create sync log:', error)
      return null
    }

    return logData.id
  } catch (err) {
    console.error('Exception creating sync log:', err)
    return null
  }
}

export async function logSyncSuccess(
  supabase: SupabaseClient,
  logId: string,
  data: { duration_ms: number; metadata?: any; woo_id?: number }
): Promise<void> {
  try {
    const updateData: any = {
      status: 'success',
      duration_ms: data.duration_ms,
      metadata: data.metadata || {}
    }

    if (data.woo_id) {
      updateData.woo_id = data.woo_id
    }

    const { error } = await supabase
      .from('sync_logs')
      .update(updateData)
      .eq('id', logId)

    if (error) {
      console.error('Failed to update sync log:', error)
    }
  } catch (err) {
    console.error('Exception updating sync log:', err)
  }
}

export async function logSyncError(
  supabase: SupabaseClient,
  data: SyncErrorData,
  logId?: string
): Promise<void> {
  try {
    // Create error entry
    const { error: errorInsertError } = await supabase
      .from('sync_errors')
      .insert({
        store_id: data.store_id,
        entity_type: data.entity_type,
        error_message: data.error_message,
        error_code: data.error_code || null,
        stack_trace: data.stack_trace || null,
        entity_id: data.entity_id || null,
        woo_id: data.woo_id || null,
        metadata: data.metadata || {},
        retry_count: 0
      })

    if (errorInsertError) {
      console.error('Failed to create sync error:', errorInsertError)
    }

    // Update sync log if logId provided
    if (logId) {
      const { error: logUpdateError } = await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          metadata: { ...data.metadata, error: data.error_message }
        })
        .eq('id', logId)

      if (logUpdateError) {
        console.error('Failed to update sync log status:', logUpdateError)
      }
    }
  } catch (err) {
    console.error('Exception logging sync error:', err)
  }
}
