# OpenRouter Setup Guide

## Why OpenRouter?

OpenRouter is a unified API gateway for AI models, including Claude, GPT-4, Gemini, and more.

### Benefits:
- 💰 **Cheaper pricing** - Up to 50% less than direct API access
- 🔄 **Multiple models** - Switch between Claude, GPT-4, Gemini with same code
- 📊 **Usage tracking** - Built-in analytics and spending limits
- 💳 **Simple billing** - One credit system for all models
- 🚀 **Fast** - Low latency, global infrastructure

---

## Quick Setup (5 minutes)

### Step 1: Get Your API Key

1. Go to https://openrouter.ai/keys
2. Sign in with GitHub/Google
3. Click "Create Key"
4. Copy your API key (starts with `sk-or-v1-...`)
5. Add credits to your account (minimum $5)

### Step 2: Add to Supabase (Edge Functions Secrets)

**Important**: Edge Functions don't use the local `.env` file. You need to add secrets in Supabase Dashboard.

**Method 1: Via Supabase Dashboard (Easiest)**
1. Go directly to: https://supabase.com/dashboard/project/ddwlhgpugjyruzejggoz/settings/functions
2. Or: Open your Lovable project → Find "Supabase" or "Database" button
3. In Supabase Dashboard: **Settings** (left sidebar) → **Edge Functions** → **Manage secrets**
4. Click **"Add new secret"**
5. Add:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: `sk-or-v1-...` (your key from step 1)
6. Click **Save** or **Create**

**Method 2: Via Supabase CLI**
```bash
# If you have Supabase CLI installed
npx supabase login
npx supabase link --project-ref ddwlhgpugjyruzejggoz
npx supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
```

**Note**: After adding the secret, your Edge Functions will have access to it via `Deno.env.get("OPENROUTER_API_KEY")`

### Step 3: Deploy

```bash
# Your code is already configured to use OpenRouter!
# Just push to GitHub and Lovable will deploy automatically

git add .
git commit -m "feat: Add OpenRouter support for AI agents"
git push origin main
```

### Step 4: Test

1. Go to https://your-app.lovable.app/agents
2. Click "Run Sync Health Check"
3. Check logs in Lovable → Edge Functions → sync-health-agent
4. You should see: `[Sync Health Agent] Using OpenRouter API`

---

## Pricing Comparison

### Claude Sonnet 4.5

| Provider | Input (per 1M tokens) | Output (per 1M tokens) |
|----------|----------------------|------------------------|
| **OpenRouter** | $3.00 | $15.00 |
| Anthropic Direct | $3.00 | $15.00 |

### Claude Sonnet 3.5

| Provider | Input (per 1M tokens) | Output (per 1M tokens) |
|----------|----------------------|------------------------|
| **OpenRouter** | $1.50 | $7.50 |
| Anthropic Direct | $3.00 | $15.00 |

**💡 Use Claude Sonnet 3.5 via OpenRouter for 50% savings!**

---

## Available Models on OpenRouter

All accessible with same API:

### Claude (Anthropic)
- `anthropic/claude-sonnet-4-5` ← Currently used
- `anthropic/claude-sonnet-3.5`
- `anthropic/claude-opus-4`
- `anthropic/claude-haiku-3.5`

### OpenAI
- `openai/gpt-4o`
- `openai/gpt-4-turbo`
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`

### Google
- `google/gemini-2.0-flash-exp`
- `google/gemini-pro-1.5`
- `google/gemini-flash-1.5`

### Others
- `meta-llama/llama-3.3-70b-instruct`
- `anthropic/claude-3-opus` (cheaper alternative)
- `mistralai/mistral-large`

---

## Switching Models

To use a different model, edit the Edge Function:

```typescript
// supabase/functions/sync-health-agent/index.ts

// Current (Claude Sonnet 4.5)
model: "anthropic/claude-sonnet-4-5"

// Change to GPT-4o (faster, cheaper)
model: "openai/gpt-4o"

// Or Gemini 2.0 (very cheap)
model: "google/gemini-2.0-flash-exp"

// Or Claude Sonnet 3.5 (50% cheaper)
model: "anthropic/claude-sonnet-3.5"
```

Then push to deploy:
```bash
git add .
git commit -m "Switch to different AI model"
git push
```

---

## Monitoring Usage

### In OpenRouter Dashboard
1. Go to https://openrouter.ai/activity
2. See:
   - Requests per day
   - Tokens used
   - Cost breakdown by model
   - Error rates

### Set Spending Limits
1. Go to https://openrouter.ai/settings
2. Set monthly budget limit
3. Get alerts at 50%, 75%, 90%

---

## Troubleshooting

### Error: "Insufficient credits"
**Solution**: Add credits at https://openrouter.ai/credits

### Error: "Invalid API key"
**Check**:
1. Key copied correctly (starts with `sk-or-v1-`)
2. No extra spaces
3. Key is active in OpenRouter dashboard

### Not using OpenRouter
**Check Lovable logs**:
1. Edge Functions → sync-health-agent → Logs
2. Look for: `Using OpenRouter API` or `Using Anthropic API`
3. If seeing Anthropic, check `OPENROUTER_API_KEY` is set

### Model not working
**Available models**: https://openrouter.ai/models
- Check model name is correct
- Check model is available
- Some models require special access

---

## Cost Estimation for Your App

### Sync Health Agent (per run)
- Prompt: ~2000 tokens
- Response: ~1000 tokens
- **Cost**: ~$0.03 per run with Claude Sonnet 4.5
- **Cost**: ~$0.015 per run with Claude Sonnet 3.5 (50% cheaper!)

### If running every 6 hours
- 4 runs per day
- ~120 runs per month
- **Monthly cost**: $3.60 (Sonnet 4.5) or $1.80 (Sonnet 3.5)

### Adding more agents
- Bug Detection Agent: +$1.80/month
- Security Audit Agent: +$1.80/month
- **Total**: ~$7.20/month for 3 agents

💡 **Very affordable for a production SaaS!**

---

## Best Practices

### 1. Start with Claude Sonnet 3.5
- 50% cheaper than 4.5
- Still excellent quality
- Upgrade to 4.5 only if needed

### 2. Set Spending Limits
- Prevent unexpected costs
- Get alerts before limit

### 3. Monitor Performance
- Check OpenRouter analytics
- Compare model performance
- Switch if needed

### 4. Use Caching (Future)
- OpenRouter supports prompt caching
- Can reduce costs by 90% for repeated prompts

---

## Migration from Anthropic

If you were using Anthropic direct API:

1. **Keep both keys** (for redundancy)
2. **Add OpenRouter key** - system will use it automatically
3. **Test thoroughly**
4. **Remove Anthropic key** after confirming everything works

**Rollback**: Just remove `OPENROUTER_API_KEY` and it will use `ANTHROPIC_API_KEY`

---

## Support

### OpenRouter
- Docs: https://openrouter.ai/docs
- Discord: https://discord.gg/openrouter
- Email: support@openrouter.ai

### Your App
- Check: [supabase/functions/README-AGENTS.md](supabase/functions/README-AGENTS.md)
- GitHub Issues: https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard/issues

---

## Next Steps

1. ✅ Set up OpenRouter API key
2. ✅ Deploy to production
3. ✅ Test the agents
4. 📊 Monitor usage and costs
5. 🔄 Consider switching to cheaper models if needed
6. 🚀 Add more agents as needed

---

**Happy AI Agent Building!** 🤖

Last Updated: 2025-11-06
