# Coolify Proxy Edge Function

This Supabase Edge Function acts as a proxy for Coolify API requests to solve Mixed Content security issues (HTTPS → HTTP).

## Why is this needed?

The application runs on HTTPS (`https://app.ssw-ser.com`), but Coolify API runs on HTTP (`http://91.99.207.249:8000`). Browsers block Mixed Content requests for security reasons.

This Edge Function runs on HTTPS and proxies requests to the HTTP Coolify API.

## Setup

### 1. Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ddwlhgpugjyruzejggoz

# Deploy the function
supabase functions deploy coolify-proxy
```

### 2. Set Environment Variables

In your Supabase Dashboard:

1. Go to **Project Settings** → **Edge Functions**
2. Click on **`coolify-proxy`**
3. Add these secrets:

```bash
COOLIFY_API_URL=http://91.99.207.249:8000
COOLIFY_API_TOKEN=3|fqVuVKAxetDENEPVOPtKRo3ovXE2IESLWuDqwdRL113aafda
```

### 3. Test the Function

```bash
# Health check
curl https://ddwlhgpugjyruzejggoz.supabase.co/functions/v1/coolify-proxy?path=/api/health

# Get applications
curl https://ddwlhgpugjyruzejggoz.supabase.co/functions/v1/coolify-proxy?path=/api/v1/applications
```

## How it works

```
Client (HTTPS)
    ↓
Edge Function (HTTPS)
    ↓
Coolify API (HTTP)
```

1. Your app sends requests to the Edge Function (HTTPS)
2. Edge Function proxies the request to Coolify API (HTTP)
3. Response is returned to your app (HTTPS)

## Parameters

- `path` (query param): The Coolify API endpoint to call (e.g., `/api/v1/applications`)

## Example Usage

```typescript
const response = await fetch(
  `https://ddwlhgpugjyruzejggoz.supabase.co/functions/v1/coolify-proxy?path=/api/v1/applications`
);
const data = await response.json();
```
