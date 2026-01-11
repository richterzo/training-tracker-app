# HunterOne - Training Tracker Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Supabase Account** - Sign up at https://supabase.com
3. **npm** or **pnpm** (project uses npm)

## Step 1: Supabase Setup

1. Create a new project at https://app.supabase.com
2. Go to **Settings** → **API** to get your credentials:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon/public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Step 2: Database Schema

**Esegui questo UNICO script in Supabase SQL Editor:**

**`scripts/setup-database.sql`** ⚡

Questo script contiene tutto:
- ✅ Crea tutte le tabelle
- ✅ Crea tutti gli indici
- ✅ Crea la funzione `seed_default_exercises`
- ✅ Abilita Row Level Security
- ✅ Crea le funzioni helper
- ✅ Applica tutte le RLS policies

**Basta copiare e incollare questo script nel SQL Editor di Supabase e premere "Run"!**

> **Nota**: Se hai già eseguito altri script, questo script li pulirà e ricreerà tutto correttamente.

## Step 3: Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Example:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 6: Test the Application

### 1. Sign Up
- Navigate to http://localhost:3000/signup
- Create a new account
- Complete onboarding (create or join a group)

### 2. Create a Group
- After onboarding, you'll be in your group
- Go to Settings to manage your group

### 3. Create Exercises
- Navigate to `/app/exercises`
- Click "New Exercise"
- Fill in the form and save

### 4. Create Templates
- Navigate to `/app/templates`
- Create a workout template
- Add exercises to the template

### 5. Plan a Workout
- Navigate to `/app/plan/new`
- Select a date and template
- Plan your workout

### 6. Start a Workout
- Navigate to `/app` (Today page)
- Click on a planned workout to start
- Use the workout player to log sets

### 7. View History
- Navigate to `/app/history`
- View your completed workouts and stats

## Troubleshooting

### Build Errors
- Make sure all environment variables are set
- Check that Supabase URL and keys are correct
- Run `npm install` again if dependencies are missing

### Database Errors
- Verify all SQL scripts have been run
- Check RLS policies in Supabase dashboard
- Ensure user_profiles table has the correct structure

### Authentication Issues
- Clear browser cookies
- Check Supabase Auth settings
- Verify email confirmation is disabled for development (in Supabase dashboard)

## Demo Users (Gon & Killua)

To create demo users, you can:
1. Sign up with email: `gon@hunterone.com` and password
2. Sign up with email: `killua@hunterone.com` and password
3. Or create a seed script (see requirements)

## Current Schema Notes

⚠️ **Important**: The current schema uses a single `group_id` per user. The requirements specify a multi-tenant system with:
- `group_members` table (many-to-many)
- `group_invites` table
- Multiple groups per user with active group selector

The current implementation works for basic testing but may need schema updates for full multi-tenancy.
