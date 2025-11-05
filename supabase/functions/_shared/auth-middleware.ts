/**
 * Authentication Middleware for Edge Functions
 * Ensures JWT verification and tenant isolation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthenticatedRequest extends Request {
  userId?: string
  userEmail?: string
}

export interface AuthResult {
  success: boolean
  userId?: string
  userEmail?: string
  error?: string
  status?: number
}

/**
 * Verifies JWT token from Authorization header
 * Returns user information if valid, error if invalid
 *
 * @example
 * const auth = await verifyJWT(req)
 * if (!auth.success) {
 *   return new Response(JSON.stringify({ error: auth.error }), {
 *     status: auth.status || 401
 *   })
 * }
 */
export async function verifyJWT(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return {
      success: false,
      error: 'Missing Authorization header',
      status: 401
    }
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return {
      success: false,
      error: 'Invalid Authorization header format',
      status: 401
    }
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Verify the JWT and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('JWT verification failed:', error)
      return {
        success: false,
        error: 'Invalid or expired token',
        status: 401
      }
    }

    return {
      success: true,
      userId: user.id,
      userEmail: user.email
    }
  } catch (error) {
    console.error('Error verifying JWT:', error)
    return {
      success: false,
      error: 'Token verification failed',
      status: 500
    }
  }
}

/**
 * Middleware wrapper that enforces JWT authentication
 * Use this to wrap your handler function
 *
 * @example
 * serve(withAuth(async (req, auth) => {
 *   // auth.userId is guaranteed to exist here
 *   return new Response(JSON.stringify({ userId: auth.userId }))
 * }))
 */
export function withAuth(
  handler: (req: Request, auth: { userId: string; userEmail?: string }) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // Skip auth for OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    const auth = await verifyJWT(req)

    if (!auth.success) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status || 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Call the handler with authenticated user info
    return handler(req, {
      userId: auth.userId!,
      userEmail: auth.userEmail
    })
  }
}

/**
 * Verifies that the authenticated user has access to the specified store
 * Uses the user_has_store_access RLS function
 */
export async function verifyStoreAccess(
  userId: string,
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user has access to store
    const { data, error } = await supabase.rpc('user_has_store_access', {
      user_id: userId,
      store_id: storeId
    })

    if (error) {
      console.error('Error checking store access:', error)
      return {
        success: false,
        error: 'Failed to verify store access'
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Access denied: You do not have permission to access this store'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error verifying store access:', error)
    return {
      success: false,
      error: 'Store access verification failed'
    }
  }
}
