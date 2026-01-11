# Testing Guide - HunterOne Training Tracker

This guide helps you test all features of the application end-to-end.

## Prerequisites

1. ✅ Supabase project created and configured
2. ✅ Database schema scripts run (see SETUP.md)
3. ✅ `.env.local` file configured with Supabase credentials
4. ✅ Development server running (`npm run dev`)

## Test Flow: Complete User Journey

### Phase 1: Authentication & Onboarding

#### Test 1.1: Sign Up
1. Navigate to http://localhost:3000
2. Click "Get started" or go to `/signup`
3. Fill in:
   - Email: `test@example.com`
   - Password: (choose a secure password)
4. Click "Sign up"
5. **Expected**: Redirected to `/onboarding`

#### Test 1.2: Onboarding - Create Group
1. On onboarding page, select "Create a new group"
2. Fill in:
   - Group name: "Test Training Group"
   - Full name: "Test User"
   - Display name: "Test"
3. Click "Create Group"
4. **Expected**: 
   - Group created
   - Redirected to `/app`
   - Default exercises seeded

#### Test 1.3: Onboarding - Join Group (Alternative)
1. Sign up with a second account: `test2@example.com`
2. On onboarding, select "Join existing group"
3. Enter the group ID from Test 1.2
4. Fill in name fields
5. **Expected**: Joined group, redirected to `/app`

### Phase 2: Exercise Management

#### Test 2.1: View Exercise Library
1. Navigate to `/app/exercises`
2. **Expected**: See list of default exercises (Push-ups, Pull-ups, etc.)

#### Test 2.2: Create New Exercise
1. Click "New Exercise" button
2. Fill in form:
   - Name: "Test Exercise"
   - Category: Select "PUSH"
   - Description: "A test exercise"
   - Video URL: (optional) `https://example.com/video`
3. Click "Create Exercise"
4. **Expected**: 
   - Exercise created
   - Appears in exercise library
   - Can be selected in templates

#### Test 2.3: Edit Exercise
1. Click on an exercise from the library
2. Modify fields
3. Save changes
4. **Expected**: Changes persisted

### Phase 3: Template Management

#### Test 3.1: Create Workout Template
1. Navigate to `/app/templates`
2. Click "New Template"
3. Fill in:
   - Template name: "Morning Routine"
   - Description: "Quick morning workout"
4. Add blocks:
   - Block 1: "Warm-up"
     - Add exercise: "Jumping Jacks"
     - Sets: 2, Reps: 20
   - Block 2: "Main Workout"
     - Add exercise: "Push-ups"
     - Sets: 3, Reps: 10
     - Rest: 60 seconds
5. Save template
6. **Expected**: Template created and visible in templates list

#### Test 3.2: Edit Template
1. Open a template
2. Add/remove exercises
3. Reorder exercises
4. Save
5. **Expected**: Changes saved

### Phase 4: Workout Planning

#### Test 4.1: Plan Workout for Today
1. Navigate to `/app/plan/new`
2. Select today's date
3. Choose a template (e.g., "Morning Routine")
4. Click "Plan Workout"
5. **Expected**: 
   - Workout appears on calendar
   - Visible on `/app` (Today page)

#### Test 4.2: Plan Workout for Future Date
1. Go to `/app/plan/new`
2. Select a future date (e.g., tomorrow)
3. Choose template
4. Plan workout
5. **Expected**: Workout scheduled for selected date

#### Test 4.3: View Calendar
1. Navigate to `/app` or `/app/calendar`
2. **Expected**: 
   - See calendar view
   - Planned workouts marked on dates
   - Can click on dates to see workouts

### Phase 5: Workout Player (Critical Feature)

#### Test 5.1: Start Planned Workout
1. On `/app` page, find a planned workout
2. Click on the workout
3. **Expected**: 
   - Workout player opens (`/app/workout/[id]`)
   - Shows exercises with targets
   - Can start logging sets

#### Test 5.2: Log Sets - Reps Exercise
1. In workout player, find a reps-based exercise (e.g., Push-ups)
2. Click "Start Set"
3. Enter reps completed (e.g., 8)
4. Click "Complete Set"
5. **Expected**: 
   - Set logged
   - Rest timer starts automatically
   - Set appears in completed sets list

#### Test 5.3: Rest Timer
1. After completing a set, rest timer should start
2. Test controls:
   - Pause/Resume
   - +10 seconds
   - -10 seconds
   - Skip rest
3. **Expected**: Timer works correctly, can skip or wait

#### Test 5.4: Log Sets - Hold Exercise
1. Find a hold-based exercise (e.g., Plank)
2. Click "Start Hold"
3. Timer counts down
4. Stop early or let it complete
5. **Expected**: 
   - Hold time saved
   - Can record actual seconds held

#### Test 5.5: Finish Workout
1. Complete all sets for all exercises
2. Click "Finish Workout"
3. **Expected**: 
   - Workout marked as completed
   - Redirected to history or home
   - Session saved to database

#### Test 5.6: Autosave & Refresh
1. Start a workout
2. Log a few sets
3. Refresh the page (F5)
4. **Expected**: 
   - Workout state restored
   - Previously logged sets visible
   - Can continue where left off

#### Test 5.7: Pause Workout
1. During workout, click "Pause"
2. **Expected**: Workout paused, can resume later

#### Test 5.8: Mark as Skipped
1. Start a workout
2. Click "Mark as Skipped"
3. **Expected**: 
   - Workout marked as skipped
   - Status updated in database

### Phase 6: History & Stats

#### Test 6.1: View Workout History
1. Navigate to `/app/history`
2. **Expected**: 
   - List of completed workouts
   - Shows date, template name, duration
   - Can click to view details

#### Test 6.2: View Workout Details
1. Click on a completed workout from history
2. **Expected**: 
   - See all exercises
   - See all sets with reps/hold times
   - See notes if any

#### Test 6.3: View Stats
1. On history page, check stats section
2. **Expected**: 
   - Per-exercise stats (best reps, best hold)
   - Weekly volume
   - Streak information (if implemented)

#### Test 6.4: Filter History
1. Use date range filter
2. Filter by category
3. **Expected**: History filtered correctly

### Phase 7: Group Management

#### Test 7.1: View Group Settings
1. Navigate to `/app/settings`
2. **Expected**: 
   - See group name
   - See list of members
   - Admin controls (if admin)

#### Test 7.2: View Members
1. In settings, check members list
2. **Expected**: 
   - See all group members
   - See roles (admin/member)
   - See own profile

### Phase 8: Multi-User Scenario (Gon & Killua)

#### Test 8.1: Create Demo Users
1. Sign up as `gon@hunterone.com`
2. Create group "Hunter Exam Training"
3. Sign up as `killua@hunterone.com`
4. Join Gon's group (using group ID)

#### Test 8.2: Shared Exercises
1. As Gon, create an exercise
2. As Killua, check exercise library
3. **Expected**: Killua can see Gon's exercise

#### Test 8.3: Shared Templates
1. As Gon, create a template
2. As Killua, check templates
3. **Expected**: Killua can see and use Gon's template

#### Test 8.4: Independent Logs
1. As Gon, plan and complete a workout
2. As Killua, plan and complete a workout
3. **Expected**: 
   - Each user sees only their own logs
   - Stats are per-user
   - History is separate

## Common Issues & Solutions

### Issue: "Unauthorized" errors
**Solution**: 
- Check Supabase RLS policies are applied
- Verify user is authenticated
- Check group_id in user_profiles

### Issue: Exercises not showing
**Solution**: 
- Verify exercises table has data
- Check group_id matches user's group
- Run seed script if needed

### Issue: Workout player not saving
**Solution**: 
- Check browser console for errors
- Verify session_logs table exists
- Check RLS policies for session_logs

### Issue: Calendar not showing workouts
**Solution**: 
- Verify planned_workouts table has data
- Check date format (should be YYYY-MM-DD)
- Verify user_id matches

## Performance Testing

1. **Load Test**: Create 50+ exercises, 20+ templates
2. **Stress Test**: Plan 30+ workouts in calendar
3. **Concurrent Users**: Test with 2-3 users simultaneously

## Browser Testing

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on Mac)
- ✅ Mobile browser (responsive design)

## Next Steps After Testing

If all tests pass:
1. ✅ Ready for production
2. Consider adding missing features from requirements
3. Update schema for full multi-tenancy if needed
