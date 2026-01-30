# Janibear - Janitorial Quality Management SaaS

A comprehensive, mobile-first janitorial quality inspection and management platform built with Next.js 14, TypeScript, TailwindCSS, and Supabase.

<!-- Trigger Vercel deploy -->

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Each organization has isolated data with role-based access control
- **User Authentication**: Secure email/password and magic link authentication via Supabase Auth
- **Organization Management**: Onboarding flow for new organizations
- **Location Management**: CRUD operations for buildings/accounts with optional areas/sub-areas
- **Inspection System**: 
  - Template builder with sections and items
  - Multiple item types (yes/no, scale, text, photo, etc.)
  - Real-time scoring with weights and required flags
  - GPS tagging and photo capture
  - Mobile-optimized inspection flow
- **Issue Tracking**: Create issues from failed inspection items with status tracking, assignments, and comments
- **Team Management**: Crews, crew members, and assignments to locations
- **Task Management**: Individual task assignments with real-time completion tracking
- **Scheduling**: One-time and recurring (weekly) inspection schedules
- **Reporting**: Printable reports and shareable public links
- **Bid Calculator**: Calculate fair market value for cleaning bids based on square footage, facilities, and usage
- **Contract Management**: Upload and assign service contracts to locations
- **Multi-language Support**: English and Spanish UI support per user

### Marketing & Payments
- **Professional Landing Page**: Modern, responsive marketing site
- **Pricing Plans**: Three tiers (Starter, Professional, Enterprise)
- **Customer Survey**: Interactive quiz to recommend the best plan
- **Stripe Integration**: Secure payment processing with subscription management
- **Password Strength Meter**: Real-time password strength indicator

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **Form Validation**: React Hook Form + Zod
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for payments)

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Stripe Price IDs (create products in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

### 3. Database Setup

Run the SQL migrations in your Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` - Creates all tables
2. `supabase/migrations/002_rls_policies.sql` - Sets up Row Level Security
3. `supabase/migrations/003_create_storage_bucket.sql` - Creates storage bucket for photos

### 4. Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Copy the Price IDs to your `.env.local`
3. Set up webhook endpoint: `https://yourdomain.com/api/webhook`
4. Add webhook secret to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── app/               # Main application (protected)
│   ├── api/               # API routes (Stripe, etc.)
│   ├── pricing/           # Pricing page
│   ├── survey/            # Customer survey
│   └── checkout/          # Payment success page
├── components/
│   ├── auth/              # Authentication components
│   ├── pricing/           # Pricing components
│   ├── survey/            # Survey components
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Supabase client utilities
│   ├── auth.ts            # Auth helper functions
│   └── utils.ts           # Utility functions
└── supabase/
    └── migrations/        # Database migrations
```

## 🔐 Authentication Flow

1. **Sign Up**: User creates account → Profile created → Onboarding (if needed)
2. **Sign In**: Email/password or magic link → Dashboard redirect
3. **Password Reset**: Forgot password → Email link → Reset password page

## 💳 Payment Flow

1. User selects plan on pricing page or via survey recommendation
2. Click "Get Started" → Stripe Checkout session created
3. User completes payment → Webhook updates subscription
4. Redirect to success page → Sign up to activate account

## 🎨 UI Components

Built with shadcn/ui components:
- Button, Input, Label, Card
- Select, Textarea, RadioGroup
- All styled with TailwindCSS

## 📱 Mobile-First Design

- Responsive layouts for all screen sizes
- Touch-optimized forms and buttons
- Mobile-friendly inspection flow
- Optimized image loading

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Organization-scoped data access
- Role-based permissions (Owner, Manager, Inspector, ClientViewer)
- Secure password requirements (8+ chars, strength meter)
- HTTPS-only in production

## 📝 License

Private - All rights reserved

## 🤝 Support

For issues or questions, please contact support.

---

Built with ❤️ for janitorial service providers
