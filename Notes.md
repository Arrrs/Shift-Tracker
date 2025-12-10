## Create branch
Perfect opportunity to learn! Let's create dev branch and practice the workflow.
Your Tasks:
# 1. Make sure you're on main and everything is committed
    git status
    git add .
    git commit -m "Update context memory and cleanup"

# 2. Push to main (if not already)
    git push origin main

# 3. Create and switch to dev branch
    git checkout -b dev

# 4. Push dev branch to GitHub
    git push -u origin dev

# 5. Verify you're on dev
    git branch
# Should show: * dev (with asterisk)


## Git Workflow - Practice Guide


## Scenario 1: Working on Dev

# You're on dev branch
    git checkout dev

# Make changes (edit files, add features)
# ...

# Commit your work
    git add .
    git commit -m "Add feature X"

# Push to GitHub
    git push origin dev

## Scenario 2: Merge Dev → Main (Deploy!)

# Switch to main
    git checkout main

# Pull latest changes (in case someone else pushed)
    git pull origin main

# Merge dev into main
    git merge dev

# Push to main (triggers Vercel deployment!)
    git push origin main

# Go back to dev for more work
    git checkout dev


## Scenario 3: Create Feature Branch

# Start from dev
    git checkout dev

# Create feature branch
    git checkout -b feature/jobs-crud

# Work on feature...
    git add .
    git commit -m "Implement jobs CRUD"

# Push feature branch
    git push origin feature/jobs-crud

# Merge back to dev (when done)
    git checkout dev
    git merge feature/jobs-crud

# Delete feature branch (cleanup)
    git branch -d feature/jobs-crud
    git push origin --delete feature/jobs-crud


## Scenario 4: Pull Request (GitHub Way)
Instead of merging locally, use GitHub PRs:

# Push feature branch
    git push origin feature/my-feature

# Then on GitHub.com:
    # 1. Go to your repo
    # 2. Click "Pull Requests" → "New Pull Request"
    # 3. Select: base: dev ← compare: feature/my-feature
    # 4. Click "Create Pull Request"
    # 5. Review changes, then "Merge Pull Request"


Quick Reference Card
# Check current branch
    git branch

# Switch branches
    git checkout dev
    git checkout main

# Create new branch
    git checkout -b feature/name

# See changes
    git status
    git diff

# Commit workflow
    git add .
    git commit -m "message"
    git push

# Merge branch
    git checkout main
    git merge dev
    git push




### SQL Migration example:

    supabase migration new update_currency_default

Inside the new file "supabase/migrations/TIMESTAMP_update_currency_default.sql"
Add instructions:
        -- Update default currency from UAH to USD in jobs table
        ALTER TABLE jobs 
        ALTER COLUMN currency SET DEFAULT 'USD';

    supabase db push

Regenerate types

    npx supabase gen types typescript --linked > lib/database.types.ts


npx supabase migration new add_some_feature
npx supabase db push


















🧪 Testing Checklist

# Day-Off Functionality (New)

✅ Create Full Day PTO - 8 hours
- Check "This is a day off" → Select "PTO/Vacation"
- Check "Full day" → Verify it defaults to 8 hours
- Save and verify earnings = hourly_rate × 8
✅ Create Partial Day Sick Leave - 4 hours
- Check "This is a day off" → Select "Sick Day"
- Uncheck "Full day" or keep checked and change to 4 hours
- Save and verify earnings = hourly_rate × 4
✅ Create Unpaid Leave
- Check "This is a day off" → Select "Unpaid Leave"
- Save and verify earnings = $0.00
✅ Customize Full Day Hours
- Check "This is a day off" → Check "Full day"
- Change hours from 8 to 7.5
- Save and verify it saves 7.5 hours
✅ Edit Existing Day-Off
- Open an existing PTO day
- Verify "This is a day off" is checked
- Verify correct type is selected (PTO)
- Verify "Full day" checkbox reflects saved value
- Verify hours are correct
- Change to partial day (4 hours) and save
- Reopen and verify is_full_day_off = false persisted
✅ Convert Work Shift to Day-Off
- Create a regular work shift
- Edit it, check "This is a day off"
- Verify work fields disappear (times, custom rate, holiday)
- Save and verify it's now a day-off
✅ Convert Day-Off to Work Shift
- Edit an existing day-off
- Uncheck "This is a day off"
- Verify day-off fields disappear
- Verify work fields appear
- Fill in times and save

# Template Functionality (Previously Fixed)

✅ Template Highlighting Reset
- Create shift with Job A selected
- Click a template → Verify it highlights
- Change to Job B
- Verify NO template is highlighted (reset worked)
✅ Template in Edit Dialog
- Edit an existing work shift
- Verify "Use Template" / "Manual Entry" tabs appear
- Click a template → Verify times fill in
- Save and verify changes persisted
✅ No Template for Day-Offs
- Create a day-off shift
- Verify template tabs DON'T appear

# Multi-Currency (Previously Fixed)

✅ Different Currencies Same Day
- Create shift with Job in USD
- Create shift with Job in EUR on same day
- Click the day in calendar
- Verify drawer shows:
- Separate lines: "$120.00 (USD)" and "€50.00 (EUR)"
- NOT mixed: "170.00 total"
✅ Multi-Currency with Day-Off
- Create PTO (8h) with Job in USD ($20/hr) = $160
- Create work shift (4h) with Job in EUR (€25/hr) = €100
- Verify both show separately in day drawer

# Hours Breakdown (Previously Fixed)

✅ Work + Time-Off Same Day
- Create 8h work shift
- Create 4h PTO on same day
- Open day drawer
- Verify shows: "Worked: 8.0h | Time-off: 4.0h"

# Calendar Visual

📋 Day-Off Visual Indicators (TODO - Next Task)
- Verify day-offs appear on calendar
- Check if visual distinction is needed between work/day-off
- Check if different day-off types need different colors/icons

# Earnings Calculations

✅ PTO Earns at Base Rate
- Job: $20/hr base
- Create 8h PTO
- Verify earnings = $160 (not $0)
✅ Unpaid Earns Zero
- Create 8h unpaid leave
- Verify earnings = $0
✅ Day-Off Ignores Custom Rates
- Job with custom hourly rate set
- Create PTO
- Verify it uses job's base rate, not custom rate




Testing Recommendations
Currency Display:
- Create shifts with different amounts ($55, $46.80, $100.50)
- Verify whole numbers show no decimals, decimals show correctly
Hydration Error:
- Check browser console - no more hydration warnings
- Resize window - dialogs should adapt without errors
Status Field:
- Create shift for past date - should default to "completed"
- Create shift for future date - should default to "planned"
- Override status manually - should persist your choice
- Create cancelled future shift - should work now
Pay Types:
- Create job with daily rate ($120/day)
- Add shift for that job - should earn $120 regardless of hours
- Create monthly job ($3000/mo)
- Add shift - should earn ~$136.36 per shift ($3000/22)
- Create salary job ($52,000/yr)
- Add shift - should earn $200 per shift ($52,000/260)
- Verify all pay types appear correctly in totals



Update calendar visual indicators for day-offs

Add time-off stats to dashboard