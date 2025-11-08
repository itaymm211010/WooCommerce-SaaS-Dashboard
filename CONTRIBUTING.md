# Contributing to WooCommerce SaaS Dashboard

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Community](#community)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for everyone, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race or ethnicity
- Age
- Religion or nationality

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Harassment, trolling, or derogatory comments
- Personal or political attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Enforcement

Instances of unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Node.js v20+** installed
2. **Git** configured with your credentials
3. A **GitHub account**
4. Basic knowledge of **React**, **TypeScript**, and **Supabase**

### Setup Development Environment

```bash
# 1. Fork the repository on GitHub
# Click "Fork" at https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/WooCommerce-SaaS-Dashboard.git
cd WooCommerce-SaaS-Dashboard

# 3. Add upstream remote
git remote add upstream https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard.git

# 4. Install dependencies
npm install

# 5. Create .env file (contact maintainers for credentials)
cp .env.example .env

# 6. Start development server
npm run dev
```

### Stay Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

---

## 💡 How to Contribute

There are many ways to contribute:

### 1. Code Contributions

- Fix bugs
- Implement new features
- Improve performance
- Refactor code
- Add tests

### 2. Documentation

- Fix typos or clarify instructions
- Add examples or tutorials
- Translate documentation
- Improve API documentation

### 3. Testing & Bug Reports

- Report bugs with detailed reproduction steps
- Test pull requests
- Verify bug fixes

### 4. Design & UX

- Suggest UI/UX improvements
- Create mockups or prototypes
- Improve accessibility

### 5. Community Support

- Answer questions in issues
- Help new contributors
- Review pull requests

---

## 🔄 Development Process

### 1. Choose an Issue

- Browse [open issues](https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it

### 2. Create a Branch

```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 3. Make Changes

- Write clean, well-documented code
- Follow our [Code Standards](#code-standards)
- Test your changes locally
- Commit frequently with clear messages

### 4. Test Your Changes

```bash
# Run linter
npm run lint

# Build project
npm run build

# Test locally
npm run dev
```

### 5. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add user profile page"

# Push to your fork
git push origin feature/your-feature-name
```

### 6. Submit Pull Request

- Open PR on GitHub
- Fill out the PR template completely
- Link related issues
- Wait for review

---

## 📐 Code Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Proper typing
interface Product {
  id: string
  name: string
  price: number
  stock?: number
}

const createProduct = (data: Product): Promise<Product> => {
  // Implementation
}

// ❌ Bad: Using 'any'
const createProduct = (data: any): any => {
  // Implementation
}
```

### React Component Guidelines

```typescript
// ✅ Good: Functional component with TypeScript
interface ProductCardProps {
  product: Product
  onEdit: (id: string) => void
}

export const ProductCard = ({ product, onEdit }: ProductCardProps) => {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <button onClick={() => onEdit(product.id)}>Edit</button>
    </div>
  )
}

// ❌ Bad: No types, inline styles
export const ProductCard = ({ product, onEdit }) => {
  return (
    <div style={{ padding: '10px' }}>  {/* Use Tailwind classes */}
      <h3>{product.name}</h3>
    </div>
  )
}
```

### File Naming Conventions

```
✅ Good:
- components/ProductCard.tsx
- hooks/useProducts.ts
- utils/formatCurrency.ts
- pages/stores/[id]/products/index.tsx

❌ Bad:
- components/product-card.tsx  (kebab-case for components)
- hooks/Products.ts  (PascalCase for hooks)
- utils/format_currency.ts  (snake_case)
```

### Code Organization

```typescript
// Component file structure:
// 1. Imports (grouped)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { ProductCard } from './ProductCard'
import type { Product } from '@/types'

// 2. Types/Interfaces
interface ProductListProps {
  storeId: string
}

// 3. Component
export const ProductList = ({ storeId }: ProductListProps) => {
  // 4. Hooks
  const [selected, setSelected] = useState<string | null>(null)
  const { data: products } = useQuery({
    queryKey: ['products', storeId],
    queryFn: () => fetchProducts(storeId)
  })

  // 5. Event handlers
  const handleSelect = (id: string) => {
    setSelected(id)
  }

  // 6. Render
  return (
    <div>
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// 7. Helper functions (outside component if reusable)
const fetchProducts = async (storeId: string) => {
  // Implementation
}
```

### Edge Function Guidelines

```typescript
// ✅ Good: Secure, well-structured
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withAuth, verifyStoreAccess } from '../_shared/auth-middleware.ts'
import { getStoreCredentials } from '../_shared/store-utils.ts'

serve(withAuth(async (req, auth) => {
  try {
    const { storeId } = await req.json()

    await verifyStoreAccess(auth.userId, storeId)
    const credentials = await getStoreCredentials(storeId)

    // Business logic

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[function-name] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}))

// ❌ Bad: No auth, credentials exposed
serve(async (req) => {
  const { storeId, apiKey } = await req.json()  // Never pass credentials from client!
  // Insecure implementation
})
```

### Security Standards

**Must follow:**

1. ✅ Never commit credentials or secrets
2. ✅ Always use `withAuth` middleware in Edge Functions
3. ✅ Always use `woo-proxy` for WooCommerce API calls
4. ✅ Enable RLS on all database tables
5. ✅ Validate and sanitize user input
6. ✅ Use parameterized queries (never string concatenation)
7. ✅ Log security events (credential access, failed auth)

**Never do:**

1. ❌ Expose credentials in client-side code
2. ❌ Pass credentials in URL parameters
3. ❌ Disable RLS policies
4. ❌ Skip authentication checks
5. ❌ Return sensitive data in error messages
6. ❌ Use `eval()` or execute dynamic code

### Commit Message Standards

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process or tooling changes
- `security:` - Security improvements
- `migration:` - Database migrations

**Examples:**

```bash
feat(products): Add bulk export functionality

Implemented CSV export for products with support for:
- Product variations
- Custom attributes
- Images URLs

Closes #123

---

fix(auth): Resolve token refresh issue

Fixed race condition in token refresh logic that caused
intermittent 401 errors.

Fixes #456

---

security(rls): Add missing policies for webhook_logs table

Added RLS policies to prevent cross-tenant data access.
All webhook logs now properly filtered by store_id.
```

---

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests pass locally
- [ ] CHANGELOG.md updated (for notable changes)

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Testing
Describe how you tested these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests (if applicable)
- [ ] All tests pass
- [ ] Updated CHANGELOG.md
```

### Review Process

1. **Automated Checks** - Linter and build must pass
2. **Code Review** - At least one maintainer approval required
3. **Testing** - Changes tested in development environment
4. **Documentation** - Verify docs are updated
5. **Merge** - Maintainer merges after approval

### After Merge

- PR author or maintainer deletes the feature branch
- Changes auto-deploy via Lovable Cloud
- Verify deployment in production

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check [existing issues](https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard/issues)
2. Ensure you're using the latest version
3. Try to reproduce in a clean environment

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable, add screenshots

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Version: [e.g., 1.2.0]

## Additional Context
Any other relevant information

## Possible Fix
(Optional) Suggest a fix if you have one
```

### Security Vulnerabilities

**Do NOT create public issues for security vulnerabilities!**

Instead:
1. Email: [your-security-email@example.com]
2. Use GitHub Security Advisories
3. We'll respond within 48 hours

---

## 💭 Suggesting Features

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Problem It Solves
What problem does this feature address?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Mockups, diagrams, or examples

## Implementation Ideas
(Optional) Technical suggestions
```

### Feature Discussion

1. Create issue with `feature request` label
2. Discuss with maintainers and community
3. If approved, issue gets `approved` label
4. Contributors can pick up approved features

---

## 👥 Community

### Communication Channels

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - General questions, ideas
- **Pull Requests** - Code contributions

### Getting Help

**For development questions:**
- Check [DEVELOPMENT.md](./DEVELOPMENT.md)
- Search existing issues
- Ask in GitHub Discussions

**For usage questions:**
- Check [README.md](./README.md)
- Check [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- Create a discussion post

### Recognition

Contributors are recognized:
- Listed in project README
- Mentioned in release notes
- Tagged in related pull requests

---

## 📚 Additional Resources

- [Development Guide](./DEVELOPMENT.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Changelog](./CHANGELOG.md)
- [Code of Conduct](#code-of-conduct)

---

## 🙏 Thank You!

Every contribution makes a difference, whether it's:
- A single line bug fix
- Documentation improvements
- Feature implementations
- Helping others in discussions

We appreciate your time and effort in making this project better!

---

**Questions?** Feel free to reach out by creating a discussion post.

**Happy Contributing! 🚀**

*Last Updated: 2025-11-08*
