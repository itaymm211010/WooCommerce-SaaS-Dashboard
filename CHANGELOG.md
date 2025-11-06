# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Migration `20251105000003_secure_sensitive_fields.sql` - Security for sensitive credentials
- Migration `20251105000001_add_sync_tracking_fields.sql` - Sync tracking with `source` and `synced_at`
- Webhook Logs Viewer component for monitoring webhook activity
- Webhook Secret Manager component
- `get_store_credentials` RPC function for secure credential access
- Credential access audit logging
- Shared store utilities in `supabase/functions/_shared/`
- PROJECT_STRUCTURE.md - Complete project documentation

### Changed
- All Edge Functions now use secure RPC for credential access
- `update-woo-product` - Uses `getStoreDetails` from shared utils
- `sync-woo-products` - Uses `getStoreDetails` from shared utils
- `sync-taxonomies` - Uses `getStoreDetails` from shared utils
- `sync-global-attributes` - Uses `getStoreDetails` from shared utils
- `manage-taxonomy` - Uses `getStoreDetails` from shared utils
- `woocommerce-order-status` - Uses `getStoreDetails` from shared utils
- Webhook middleware now uses RPC for webhook secret verification

### Fixed
- Security vulnerability: Sensitive fields no longer exposed via direct database access
- Edge Functions now properly authenticate and authorize credential access

### Deprecated
- Direct access to `api_key`, `api_secret`, `webhook_secret` fields in stores table

### Removed
- N/A

### Security
- Implemented Row Level Security (RLS) on stores table
- Added credential access logging for audit trail
- Webhook signature verification using HMAC SHA256

---

## [1.0.0] - 2025-01-05

### Added
- Initial project setup with React, TypeScript, Vite
- Supabase integration for backend
- WooCommerce REST API integration
- Product management (CRUD operations)
- Product variations support
- Product images management
- Taxonomy management (categories, tags, brands)
- Store attributes and terms
- Order management
- User management per store
- Webhook system for real-time sync
- Authentication and authorization
- Multi-tenant architecture
- Dashboard with analytics

### Infrastructure
- Lovable Cloud deployment
- Supabase database (PostgreSQL)
- Edge Functions (Deno) for serverless operations
- GitHub integration for version control

---

## Release Process

### Version Numbering
- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (0.X.0)**: New features, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, minor improvements

### Release Checklist
1. [ ] Update CHANGELOG.md with all changes
2. [ ] Update version in package.json
3. [ ] Run tests: `npm run lint`
4. [ ] Build project: `npm run build`
5. [ ] Test locally with `npm run preview`
6. [ ] Commit changes: `git commit -m "chore: release vX.Y.Z"`
7. [ ] Tag release: `git tag vX.Y.Z`
8. [ ] Push to GitHub: `git push && git push --tags`
9. [ ] Lovable will auto-deploy from GitHub
10. [ ] Verify Edge Functions are deployed in Supabase
11. [ ] Run database migrations if needed
12. [ ] Test in production environment
13. [ ] Update PROJECT_STRUCTURE.md if architecture changed

---

## Migration Tracking

### Pending Migrations
- [ ] `20251105000001_add_sync_tracking_fields.sql` - Run in production
- [ ] `20251105000003_secure_sensitive_fields.sql` - Run in production

### Applied Migrations
- [x] Initial schema setup
- [x] `20251105000000_add_product_images_unique_constraint.sql`
- [x] `20251105000002_add_webhook_secret.sql`
- [x] `20251105000004_fix_webhook_logs_rls.sql`

---

## Known Issues

### Current Bugs
- [ ] Duplicate image uploads - need to check `synced_at` before uploading
- [ ] `generate-webhook-secret` Edge Function not deployed yet
- [ ] Update to WooCommerce needs testing after credential security changes

### Feature Requests
- [ ] Bulk product operations
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Enhanced webhook filtering
- [ ] Product import/export (CSV)
- [ ] Automated backups

---

## Contributors

- Itay (@itaymm211010) - Project Owner
- Claude (AI Assistant) - Development Support

---

## Links

- [GitHub Repository](https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard)
- [Lovable Project](https://lovable.dev/projects/bf95ed21-9695-47bb-bea2-c1f45246d48b)
- [WooCommerce API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
