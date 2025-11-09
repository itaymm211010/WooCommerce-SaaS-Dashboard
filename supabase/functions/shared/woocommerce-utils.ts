/**
 * WooCommerce API Utilities
 * Reusable functions for interacting with WooCommerce REST API
 */

export interface WooAuthParams {
  consumer_key: string
  consumer_secret: string
}

export interface FetchPagedOptions {
  baseUrl: string
  endpoint: string
  auth: WooAuthParams
  perPage?: number
  additionalParams?: Record<string, string>
}

/**
 * Fetches all pages from a WooCommerce API endpoint
 * Handles pagination automatically using x-wp-totalpages header
 *
 * @example
 * const products = await fetchAllPaged({
 *   baseUrl: 'https://example.com',
 *   endpoint: '/wp-json/wc/v3/products',
 *   auth: { consumer_key: 'xxx', consumer_secret: 'yyy' },
 *   perPage: 100
 * })
 */
export async function fetchAllPaged<T = any>(
  options: FetchPagedOptions
): Promise<T[]> {
  const {
    baseUrl,
    endpoint,
    auth,
    perPage = 100,
    additionalParams = {}
  } = options

  let allItems: T[] = []
  let page = 1
  let totalPages = 1

  do {
    console.log(`📄 Fetching page ${page} of ${totalPages}...`)

    // Build URL with query parameters
    const params = new URLSearchParams({
      consumer_key: auth.consumer_key,
      consumer_secret: auth.consumer_secret,
      per_page: perPage.toString(),
      page: page.toString(),
      ...additionalParams
    })

    const url = `${baseUrl}${endpoint}?${params.toString()}`

    try {
      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `WooCommerce API error (${response.status}): ${errorText}`
        )
      }

      const items: T[] = await response.json()
      allItems.push(...items)

      // Get total pages from header
      const totalPagesHeader = response.headers.get('x-wp-totalpages')
      if (totalPagesHeader) {
        totalPages = parseInt(totalPagesHeader, 10)
      }

      console.log(`✓ Fetched ${items.length} items from page ${page}`)
      page++
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error)
      throw error
    }
  } while (page <= totalPages)

  console.log(`✅ Total items fetched: ${allItems.length}`)
  return allItems
}

/**
 * Builds a WooCommerce API URL with authentication
 */
export function buildWooUrl(
  baseUrl: string,
  endpoint: string,
  auth: WooAuthParams,
  params: Record<string, string> = {}
): string {
  const queryParams = new URLSearchParams({
    consumer_key: auth.consumer_key,
    consumer_secret: auth.consumer_secret,
    ...params
  })

  return `${baseUrl}${endpoint}?${queryParams.toString()}`
}

/**
 * Validates WooCommerce store credentials
 */
export function validateWooAuth(auth: WooAuthParams): void {
  if (!auth.consumer_key || !auth.consumer_secret) {
    throw new Error('Missing WooCommerce authentication credentials')
  }
}

/**
 * Parses WooCommerce API error response
 */
export async function parseWooError(response: Response): Promise<string> {
  try {
    const error = await response.json()
    return error.message || error.code || 'Unknown WooCommerce API error'
  } catch {
    return await response.text()
  }
}
