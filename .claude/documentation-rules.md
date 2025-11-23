# Documentation Update Rules for Claude Code

> **Purpose:** This file defines when and how Claude Code should automatically update project documentation files.

---

## 📋 Automatic Update Requirements

Claude Code **MUST** update documentation when performing these actions:

### 1. Creating New Infrastructure

**Triggers:**
- Creating Dockerfile, docker-compose.yml, or container configs
- Creating nginx.conf, Apache configs, or reverse proxy configs
- Adding new build systems (Webpack, Vite configs, etc.)
- Setting up new deployment targets (Coolify, Vercel, Railway, etc.)

**Update Required:**
- ✅ `DEVELOPMENT.md` → Add deployment/infrastructure section
- ✅ `PROJECT_STRUCTURE.md` → Add to infrastructure/deployment
- ✅ `CHANGELOG.md` → Add to Infrastructure section

**Example:** Adding Coolify deployment with Dockerfile and nginx.conf

---

### 2. Adding External Service Integration

**Triggers:**
- Integrating new third-party API (Stripe, SendGrid, Twilio, etc.)
- Adding new backend service (Supabase, Firebase, etc.)
- Connecting to deployment platform (Coolify, Heroku, etc.)
- Adding monitoring/analytics service

**Update Required:**
- ✅ `DEVELOPMENT.md` → Add to External Services section
- ✅ `PROJECT_STRUCTURE.md` → Add to integrations/services
- ✅ `CHANGELOG.md` → Add integration entry
- ⚠️ **Consider:** Creating `[SERVICE]-SETUP.md` if setup is complex (>20 steps)

**Example:** Coolify integration requires DEVELOPMENT.md + PROJECT_STRUCTURE.md + CHANGELOG.md updates

---

### 3. Creating Edge Functions

**Triggers:**
- Creating new file in `supabase/functions/[name]/`
- Creating new serverless function
- Creating new API endpoint

**Update Required:**
- ✅ `DEVELOPMENT.md` → Update Edge Functions section with new function
- ✅ `PROJECT_STRUCTURE.md` → Add to directory structure
- ✅ `CHANGELOG.md` → Add to Added section
- ✅ `supabase/functions/README.md` → Add to functions list

**Example:** Creating `coolify-proxy` Edge Function

---

### 4. Creating Database Migrations

**Triggers:**
- Creating new file in `supabase/migrations/`
- Adding/modifying database tables
- Creating RLS policies
- Creating database functions/triggers

**Update Required:**
- ✅ `CHANGELOG.md` → Add to Migration Tracking section
- ✅ `PROJECT_STRUCTURE.md` → Update database schema if tables changed

**Example:** Adding `20251105000003_secure_sensitive_fields.sql`

---

### 5. Adding Environment Variables

**Triggers:**
- Adding new `VITE_*` variables
- Adding new secrets/credentials
- Adding new configuration variables

**Update Required:**
- ✅ `DEVELOPMENT.md` → Update Environment Variables section
- ✅ `.env.example` → Add variable with placeholder
- ✅ `CHANGELOG.md` → Mention in relevant feature

**Example:** Adding `VITE_COOLIFY_URL` and `VITE_COOLIFY_TOKEN`

---

### 6. Major Troubleshooting Discovery

**Triggers:**
- Solving complex bug with non-obvious solution
- Discovering Docker cache issues
- Finding Build Pack configuration issues
- Resolving Mixed Content security issues

**Update Required:**
- ✅ `DEVELOPMENT.md` → Add to Troubleshooting section

**Example:** Docker cache preventing deployments → Add solution to DEVELOPMENT.md

---

### 7. Changing Project Architecture

**Triggers:**
- Changing directory structure
- Refactoring major components
- Changing data flow patterns
- Changing authentication/authorization patterns

**Update Required:**
- ✅ `PROJECT_STRUCTURE.md` → Update architecture sections
- ✅ `CHANGELOG.md` → Document breaking changes
- ✅ `DEVELOPMENT.md` → Update relevant workflows

---

### 8. Security Improvements

**Triggers:**
- Adding RLS policies
- Implementing new authentication
- Adding input validation
- Fixing security vulnerabilities

**Update Required:**
- ✅ `CHANGELOG.md` → Add to Security section
- ✅ `DEVELOPMENT.md` → Update Security Guidelines if pattern changes
- ✅ `CONTRIBUTING.md` → Update Security Standards if new requirements

**Example:** Adding Zod validation to Edge Functions

---

## 📝 Metadata Update Protocol

After updating **any** `.md` file, Claude Code **MUST**:

### 1. Update Maintenance Header
Every documentation file should have this at the bottom:

```markdown
---

**📌 Maintenance Info**

**Last Updated:** 2025-11-23
**Last Commit:** `abc123` - Add Coolify integration
**Updated By:** Claude Code

**Update History:**
| Date | Commit | Changes | Updated By |
|------|--------|---------|------------|
| 2025-11-23 | `abc123` | Added Coolify integration docs | Claude Code |
| 2025-11-08 | `xyz789` | Added Edge Functions section | Claude Code |

---
```

### 2. Commit Message Format

```bash
docs: Update [FILENAME] - [concise description]

# Examples:
git commit -m "docs: Update DEVELOPMENT.md - Add Coolify deployment section"
git commit -m "docs: Update CHANGELOG.md - Add Coolify integration entry"
git commit -m "docs: Create documentation-rules.md - Auto-update guidelines"
```

### 3. Cross-Reference Updates

When updating one file, check if these need updates too:

| Updated File | Check These Files |
|--------------|-------------------|
| `DEVELOPMENT.md` | `PROJECT_STRUCTURE.md`, `CHANGELOG.md` |
| `PROJECT_STRUCTURE.md` | `DEVELOPMENT.md`, `CHANGELOG.md` |
| Edge Function code | `supabase/functions/README.md`, `DEVELOPMENT.md` |
| Migration file | `CHANGELOG.md`, `PROJECT_STRUCTURE.md` |

---

## 🎯 Documentation File Purposes

### Primary Documentation (Update Frequently)

#### `CHANGELOG.md`
**Purpose:** Version history and release notes
**Update:** Every notable change (features, fixes, security)
**Audience:** All users and developers

#### `DEVELOPMENT.md`
**Purpose:** Day-to-day development guide
**Update:** New tools, workflows, troubleshooting, infrastructure
**Audience:** Developers working on the project

#### `PROJECT_STRUCTURE.md`
**Purpose:** Architecture and system design
**Update:** Structural changes, new services, data flow changes
**Audience:** New developers, architects, reviewers

### Secondary Documentation (Update When Relevant)

#### `CONTRIBUTING.md`
**Purpose:** Contribution guidelines
**Update:** Code standards, PR process, security requirements
**Audience:** External contributors

#### `[SERVICE]-SETUP.md` files
**Purpose:** Service-specific setup guides
**Update:** Only for that specific service
**Audience:** Developers setting up that service

#### `SECURITY_FIXES_README.md` and similar
**Purpose:** Historical snapshots of specific fixes
**Update:** Never (one-time documentation)
**Audience:** Historical reference

---

## ✅ Update Checklist

Before considering documentation complete, verify:

- [ ] All relevant .md files updated (see cross-reference table)
- [ ] Maintenance Header updated with current date
- [ ] Update History table has new entry
- [ ] Commit message follows `docs:` format
- [ ] Cross-references between files are accurate
- [ ] Code examples are tested and working
- [ ] Links are valid (no broken links)

---

## 🚫 When NOT to Update Documentation

**Don't update for:**
- ❌ Trivial code refactoring (no user-facing changes)
- ❌ Fixing typos in code comments
- ❌ Temporary debugging code
- ❌ Work-in-progress features (update when complete)
- ❌ Internal implementation details (unless architecturally significant)

**Update only when:**
- ✅ Changes affect how developers use/understand the system
- ✅ New capabilities or infrastructure added
- ✅ Workflow or process changes
- ✅ Important troubleshooting discovered

---

## 💡 Best Practices

### 1. Update Documentation IMMEDIATELY
Don't batch documentation updates. Update as soon as the feature/fix is complete.

### 2. Be Specific
Bad: "Updated Coolify stuff"
Good: "Added Coolify deployment with nginx reverse proxy for Mixed Content security"

### 3. Include Examples
Always include code examples, commands, or configuration snippets when documenting new features.

### 4. Link Related Files
Use relative links to connect related documentation:
```markdown
See [Edge Functions Guide](./DEVELOPMENT.md#working-with-edge-functions)
```

### 5. Test Documentation
If documenting a command or code snippet, **run it first** to ensure it works.

---

## 📚 Documentation Hierarchy

```
README.md (project overview)
    ↓
DEVELOPMENT.md (day-to-day guide)
    ↓
PROJECT_STRUCTURE.md (architecture deep-dive)
    ↓
[SERVICE]-SETUP.md (service-specific guides)
    ↓
CHANGELOG.md (version history)
    ↓
CONTRIBUTING.md (for external contributors)
```

**Navigation Rule:** Each file should link to related files to create a documentation web.

---

## 🤖 Claude Code Automation

When Claude Code performs these actions, it **automatically** triggers documentation updates:

| Action | Auto-Update |
|--------|-------------|
| `Write` new Dockerfile | → DEVELOPMENT.md, PROJECT_STRUCTURE.md, CHANGELOG.md |
| `Write` new Edge Function | → DEVELOPMENT.md, supabase/functions/README.md, CHANGELOG.md |
| `Write` new migration | → CHANGELOG.md, PROJECT_STRUCTURE.md (if schema change) |
| `Edit` .env.example | → DEVELOPMENT.md (Environment Variables) |
| Major debugging solution | → DEVELOPMENT.md (Troubleshooting) |

**No manual intervention needed** - Claude Code handles it automatically following these rules.

---

**Version:** 1.0.0
**Created:** 2025-11-23
**Created By:** Claude Code
**Purpose:** Ensure consistent, up-to-date documentation across the project
