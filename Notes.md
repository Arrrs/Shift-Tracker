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
