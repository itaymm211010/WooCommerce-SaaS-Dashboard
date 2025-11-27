# WooCommerce SaaS Dashboard

A comprehensive SaaS dashboard for managing multiple WooCommerce stores with advanced features including product management, order tracking, analytics, and AI-powered tools.

## 🚀 Features

- **Multi-Store Management**: Manage multiple WooCommerce stores from a single dashboard
- **Product Management**: Full product CRUD with image management and WooCommerce sync
- **Order Tracking**: Real-time order monitoring and status updates
- **Taxonomies Management**: Categories, tags, and brands management
- **Webhooks Integration**: Automated webhook handling for real-time updates
- **Analytics & Monitoring**: Comprehensive sync monitoring and audit logs
- **AI Chat**: AI-powered assistance for store management
- **Project Management**: Built-in task, bug, and sprint management tools
- **User Management**: Role-based access control (Admin/User)
- **Hebrew Language Support**: Full RTL support

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn-ui + Tailwind CSS
- **Backend**: Self-Hosted Supabase on Coolify (PostgreSQL + Edge Functions)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **API Integration**: WooCommerce REST API
- **Hosting**: Coolify @ https://api.ssw-ser.com

## 📋 Prerequisites

- Node.js 18+ & npm
- Self-Hosted Supabase (Coolify) with PostgreSQL access
- WooCommerce store(s) with REST API enabled

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/itaymm211010/WooCommerce-SaaS-Dashboard.git
cd WooCommerce-SaaS-Dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_PROJECT_ID="ddwlhgpugjyruzejggoz"
VITE_SUPABASE_URL="https://api.ssw-ser.com"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

**Note**: This project uses **Self-Hosted Supabase** on Coolify, not Supabase.com

### 4. Set up Supabase

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref your-project-id

# Push migrations
npx supabase db push
```

#### Option B: Manual Setup via Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Run all migration files from `supabase/migrations/` in order (by timestamp)

### 5. Assign Admin Role to First User

**IMPORTANT**: The first user needs to be manually assigned the admin role.

After signing up with your email (e.g., `maor.itay@gmail.com`), run this SQL in Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Get user ID by email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'your-email@example.com'
  LIMIT 1;

  -- Assign admin role
  IF user_id_var IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (user_id_var, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role assigned to: %', user_id_var;
  ELSE
    RAISE EXCEPTION 'User not found';
  END IF;
END $$;
```

Or use the automated script:

```bash
# Run the fix_admin_access.sql file in Supabase Dashboard
# This assigns admin role to the first registered user
```

### 6. Deploy Supabase Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy individually
npx supabase functions deploy sync-woo-products
npx supabase functions deploy update-woo-product
npx supabase functions deploy ai-chat
# ... etc
```

### 7. Start development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
WooCommerce-SaaS-Dashboard/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External integrations (Supabase)
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin panel pages
│   │   ├── auth/         # Authentication pages
│   │   ├── stores/       # Store management pages
│   │   ├── audit-logs/   # Audit logs and analytics
│   │   └── project-management/ # PM tools
│   └── lib/              # Utility functions
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## 🔐 User Roles & Permissions

### App Roles
- **admin**: Full system access, can manage all users and settings
- **user**: Standard user access, can manage own stores

### Store Roles
- **owner**: Full store access, can manage everything
- **manager**: Can manage products, orders, but not store settings
- **viewer**: Read-only access

## 🚢 Deployment

### Frontend Deployment

Deploy to your preferred hosting platform:

**Netlify:**
```bash
npm run build
# Deploy the 'dist' folder
```

**Vercel:**
```bash
npm run build
# Deploy the 'dist' folder
```

### Backend (Supabase)

Supabase is already hosted. Just ensure:
1. All migrations are applied
2. All Edge Functions are deployed
3. Environment variables are set in your hosting platform

## 🐛 Troubleshooting

### Issue: Can't access admin features

**Solution**: Make sure you've assigned the admin role to your user. See step 5 in Installation.

### Issue: Products not syncing with WooCommerce

**Solution**:
1. Check your WooCommerce API credentials in store settings
2. Verify the store URL is accessible
3. Check Supabase Edge Functions logs

### Issue: Authentication errors

**Solution**:
1. Verify Supabase credentials in `.env`
2. Check RLS policies in Supabase dashboard
3. Clear browser cache and cookies

## 📚 Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [shadcn-ui Components](https://ui.shadcn.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👤 Author

**Itay Maor**
- Email: maor.itay@gmail.com
- GitHub: [@itaymm211010](https://github.com/itaymm211010)

## 🙏 Acknowledgments

- Originally bootstrapped with Lovable.dev
- UI components from shadcn-ui
- Backend powered by Supabase
