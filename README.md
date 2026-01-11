# HunterOne - Training Tracker

A comprehensive calisthenics training tracking application built with Next.js and Supabase.

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up database:**
   - Go to Supabase Dashboard → SQL Editor
   - Run this **single script**: `scripts/setup-database.sql`
   - Then run: `scripts/fix-profile-fields.sql` (adds profile fields and avatar storage)
   - These scripts create everything: tables, indexes, functions, and RLS policies

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🏗️ Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/                # API routes
│   ├── app/                # Protected app pages
│   ├── login/              # Authentication pages
│   └── onboarding/         # User onboarding
├── components/             # React components
│   ├── auth/               # Authentication components
│   ├── calendar/           # Calendar view
│   ├── exercises/          # Exercise management
│   ├── history/            # Workout history & stats
│   ├── navigation/         # Navigation components
│   ├── planning/           # Workout planning
│   ├── templates/          # Template management
│   ├── ui/                 # UI components (shadcn/ui)
│   └── workout/            # Workout player
├── lib/                    # Utilities and configurations
│   ├── supabase/           # Supabase client/server setup
│   └── types/              # TypeScript types
└── scripts/                # Database migration scripts
```

## ✨ Features

- ✅ User authentication (Supabase Auth)
- ✅ Multi-tenant groups (Training Groups)
- ✅ Exercise library with categories
- ✅ Workout templates with blocks
- ✅ Calendar planning
- ✅ Workout player with set-by-set logging
- ✅ Rest timer and hold timer
- ✅ Workout history and statistics
- ✅ Responsive design (mobile-first)

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **UI:** React 19, Tailwind CSS, shadcn/ui
- **Type Safety:** TypeScript
- **Code Quality:** ESLint, Prettier

## 📚 Documentation

- `SETUP.md` - Detailed setup instructions
- `TESTING.md` - Complete testing guide
- `TROUBLESHOOTING.md` - Common issues and solutions
- `QUICK_START.md` - Quick reference guide

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User authentication required for all app routes
- Group-based data isolation
- Secure server-side API routes

## 📝 License

Private project - All rights reserved
