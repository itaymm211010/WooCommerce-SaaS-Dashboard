## 📝 Description

<!-- Provide a clear and concise description of your changes -->

## 🔗 Related Issues

<!-- Link to related issues using keywords like Fixes, Closes, Resolves -->
<!-- Example: Fixes #123, Closes #456 -->

## 🔄 Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration/build changes
- [ ] ♻️ Code refactoring
- [ ] 🔒 Security improvement
- [ ] 🗄️ Database migration

## 🧪 Testing

<!-- Describe how you tested your changes -->

**Test environment:**
- [ ] Local development
- [ ] Staging/Preview deployment
- [ ] Production (hotfix only)

**Test cases:**
1. Test case 1: ...
2. Test case 2: ...
3. Test case 3: ...

**Test results:**
- [ ] All existing tests pass
- [ ] New tests added (if applicable)
- [ ] Manual testing completed
- [ ] No console errors or warnings

## 📸 Screenshots/Videos

<!-- If applicable, add screenshots or videos to demonstrate the changes -->

**Before:**
<!-- Screenshot/description of the old behavior -->

**After:**
<!-- Screenshot/description of the new behavior -->

## 🔐 Security Checklist

<!-- For security-related changes, ensure all items are checked -->

- [ ] No credentials exposed in code or URLs
- [ ] All API calls use `woo-proxy` or authenticated Edge Functions
- [ ] RLS policies updated for new/modified tables
- [ ] `withAuth` and `verifyStoreAccess` middleware used
- [ ] Input validation implemented
- [ ] No sensitive data in error messages
- [ ] Audit logging added where appropriate
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

## 📦 Database Changes

<!-- If this PR includes database changes -->

- [ ] Migration file created (format: `YYYYMMDDHHMMSS_description.sql`)
- [ ] RLS policies added/updated
- [ ] Indexes created for performance
- [ ] TypeScript types regenerated
- [ ] Rollback plan documented

**Migration file:** `supabase/migrations/___________`

## 📚 Documentation

<!-- Mark all items that apply -->

- [ ] Code comments added for complex logic
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] DEVELOPMENT.md updated (if workflow changes)
- [ ] PROJECT_STRUCTURE.md updated (if architecture changes)
- [ ] API documentation updated (if applicable)

## ✅ Pre-submission Checklist

<!-- Ensure all items are checked before submitting -->

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have tested my changes locally
- [ ] Any dependent changes have been merged and published
- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide

## 🔍 Code Review Focus Areas

<!-- Highlight specific areas where you'd like reviewers to focus -->

- Area 1: ...
- Area 2: ...
- Area 3: ...

## 📌 Additional Notes

<!-- Any additional information that reviewers should know -->

## 🚀 Deployment Notes

<!-- Special considerations for deployment -->

- [ ] No special deployment steps required
- [ ] Requires database migration (documented above)
- [ ] Requires environment variable changes
- [ ] Requires manual testing after deployment
- [ ] Other: ___________

## ☑️ Final Checklist

<!-- Final checks before merge -->

- [ ] All CI checks pass
- [ ] Code reviewed and approved
- [ ] No merge conflicts
- [ ] Ready to merge and deploy

---

**Thank you for your contribution! 🙏**
