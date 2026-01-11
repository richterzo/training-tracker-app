# Quick Start Guide - HunterOne

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to https://app.supabase.com
2. Create a new project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon key**

### 3. Create `.env.local`

Create a file named `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database

In Supabase Dashboard → **SQL Editor**, run this **single script**:

**`scripts/setup-database.sql`** ⚡

Questo script unico crea tutto:
- ✅ Tutte le tabelle
- ✅ Tutti gli indici
- ✅ Funzione per seed esercizi
- ✅ RLS abilitato
- ✅ Tutte le policies RLS

**Basta eseguire questo script e il database è pronto!**

### 5. Start Dev Server

```bash
npm run dev
```

Open http://localhost:3000

### 6. Test Login

1. Go to `/signup`
2. Create an account
3. Complete onboarding (create a group)
4. You're in! 🎉

## 📋 Quick Test Checklist

- [ ] Sign up works
- [ ] Onboarding creates/joins group
- [ ] Can view exercises
- [ ] Can create exercise
- [ ] Can create template
- [ ] Can plan workout
- [ ] Can start workout player
- [ ] Can log sets
- [ ] Can finish workout
- [ ] Can view history

## 🐛 Common Issues

**"Unauthorized" errors?**
→ Run `scripts/setup-database.sql` per applicare tutte le RLS policies

**Can't see exercises?**
→ La funzione seed è inclusa in `scripts/setup-database.sql`, oppure crea manualmente

**Build errors?**
→ Make sure `.env.local` exists with correct values

**Database errors?**
→ Verify all SQL scripts ran in order

## 📚 Full Documentation

- `SETUP.md` - Detailed setup instructions
- `TESTING.md` - Complete testing guide

## 🎯 Next Steps

1. Test all features (see `TESTING.md`)
2. Create demo users (Gon & Killua)
3. Test multi-user scenarios
4. Verify stats and history work correctly
