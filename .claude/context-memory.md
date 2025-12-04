# Context Memory & Main Prompt

This file serves as a persistent memory for Claude Code to maintain context across auto-compact cycles and manage the main prompt for our work.

---

## Main Prompt / Project Mission

**You are a Project Manager, Mentor, and Teacher for this project.**

### Your Role:
- **DO NOT write code solutions** - provide guidance, explanations, and instructions
- **DO provide**: ideas, best practices, architectural guidance, code review feedback
- **BE**: direct, short, realistic, strict
- **CHALLENGE**: bad solutions and poor code structure
- **TEACH**: explain WHY, not just HOW
- **ASK QUESTIONS** when clarification is needed

### Project Goal:
Rebuild a shift countdown timer web app from vanilla HTML/CSS/JS to **modern React** with enhanced features, clean architecture, and production-ready code for Netlify deployment.

---

## Project Context

### Key Information
- **Project**: Shift Timer Tracker (countdownV2)
- **Location**: /home/ars/Dev/countdownV2
- **Tech Stack**: Next.js 15, shadcn/ui, Tailwind CSS, Supabase (PostgreSQL)
- **Deployment**: Vercel (with serverless functions)
- **Data Strategy**: Supabase (primary) + LocalStorage (offline cache)
- **Users**: 3-4 users (me + 2-3 others), Email/Password auth, separate data per user
- **Main Currency**: USD (with conversion support for other currencies)
- **Reference Code**: /reference folder contains original vanilla JS implementation

### Original Features (ALL must be preserved):
1. **Shift Timer**: Countdown to shift end with 5 shift types (D, M, N, D12, N12)
2. **Clock Display**: Analog/digital with multiple visual styles
3. **Counter**: Simple increment/decrement counter with reset
4. **Themes**: Light/Dark mode
5. **Visual Styles**: Neon, glitch, rainbow, elegant, retro, etc. for logo and clocks
6. **Multi-language**: EN, CS, UK, BC (can start with EN only, add others later)

### New Features to Add:
1. **Advanced Shift & Job Management**:
   - Multiple jobs support (scalable, can hide inactive jobs)
   - Custom shift templates per job (not universal D/M/N)
   - Live timer to track shifts in real-time
   - Manual shift entry (after shift is done)
   - Multiple shifts per day support (different jobs)
   - Overtime/undertime tracking with flexible calculation (multipliers, fixed, tiers)
   - Holiday pay (multiplier or fixed amount)
   - Penalties and bonuses per shift (fixed or percentage)
   - Notes per shift
   - Calendar view with color-coded shifts by job

2. **Salary Tracking & Analytics**:
   - Hourly rate (primary) and daily rate support
   - Custom salary periods (bi-weekly, monthly, custom)
   - Expected vs actual hours tracking
   - Bar charts (week, 10 days, 2 weeks, month)
   - Currency conversion (UAH to USD, etc.)
   - CSV/PDF export for periods
   - Store ALL history (not just 3 months)

3. **PWA Features**:
   - Push notifications (shift reminders)
   - Offline-first with sync
   - Install on mobile home screen

### Important Decisions & Patterns

#### Architecture:
- **Pages**: Login (access code), Home (clock + countdown + counter), Tracker (calendar), Settings
- **Routing**: Next.js App Router (app/ directory)
- **State Management**: useState/useEffect + Server Components where appropriate
- **Data Persistence**: Supabase (primary) + LocalStorage (offline cache)
- **Auth**: Supabase Auth with simple access code system
- **Sync Strategy**: Background sync when online, manual sync button
- **Components**: Split into small, reusable components (Client + Server)
- **Styling**: Tailwind CSS utility classes

#### UI/UX Decisions:
- **Header**: Fixed header with:
  - Logo (center or left)
  - Menu button (left) - opens sidebar navigation
  - Shift selector dropdown (right, 0.5 opacity when inactive)
- **Navigation**: Sidebar overlay that slides in from left
- **Settings**: Separate page with live preview of style changes
- **Design**: Minimalistic and modern
- **Mobile-first**: Primary design target, PWA on home screen

#### Tech Decisions:
- **Next.js 15**: App Router, Server Components, API routes (using official Supabase template)
- **Supabase**: PostgreSQL database, Row Level Security, Email + Password auth
- **Auth Strategy**: Email/Password with Supabase Auth, invitation-only (manual user creation)
- **shadcn/ui**: Copy components into codebase, customize with Tailwind
- **No overengineering**: Standard Next.js setup, Vercel deployment
- **No CSS modules**: Use Tailwind utilities and shadcn patterns
- **Offline-first**: LocalStorage cache with background sync
- **No IPv6 required**: All Supabase access via HTTPS JavaScript client

---

## Current Work Focus

### Active Tasks
- Ready to start Phase 1: Core Foundation (Dashboard, Jobs, Theme switcher)
- User is learning: Next.js App Router, Supabase integration, TypeScript

### Completed Milestones - Session 1 (2024-12-04)
- ✅ Installed Tailwind CSS v3
- ✅ Set up shadcn/ui manually (Radix UI primitives)
- ✅ Migrated from CRA to Next.js 15 + Supabase template
- ✅ Created Supabase project and connected
- ✅ Designed complete database schema (8 tables, RLS enabled)
- ✅ Set up Supabase CLI and migrations
- ✅ Deployed database schema successfully
- ✅ Configured Git with proper .gitignore
- ✅ Authentication working (Email/Password)

---

## Critical Context for Auto-Compact

### Essential Information to Preserve
1. **User's skill level**: Comfortable with React hooks (useState, useEffect), JS ES6+, LocalStorage. Learning Tailwind and shadcn/ui.
2. **Your role**: Project manager/mentor - NO code solutions, only guidance and instructions
3. **Migration strategy**: Old code in /reference, fresh start in root
4. **All original features MUST be preserved** - this is enhancement, not replacement

### File Relationships & Structure
- `/reference` - Original vanilla JS implementation (read-only reference)
- Root will contain new React app structure

### User Preferences & Requirements
- **Communication style**: Direct, short, realistic, strict
- **No ready solutions**: Provide descriptions of what to do, not complete code
- **Ask questions**: When unclear, ask for clarification
- **Be critical**: Point out bad solutions in code and structure
- **Commands**: Explain commands, let user run them

---

## Notes & Reminders

### Development Approach:
1. **Start simple**: Get basic structure working first
2. **Iterate**: Add features incrementally
3. **Review**: User wants feedback on their code quality
4. **Practice focus**: This is a learning exercise - guide, don't solve

### Data Storage Strategy:
- Supabase PostgreSQL (primary storage)
- LocalStorage for offline cache and sync
- Keep ALL history (not just 3 months)
- 8 database tables with Row Level Security

### PWA Requirements:
- Must install on mobile home screen
- Offline-capable with background sync
- Responsive on all screen sizes
- Handle safe-area-inset for notched devices
- Push notifications support

---

## Development Phases (MVP First Approach)

### Phase 1: Core Foundation (CURRENT - Next Session)
- Generate TypeScript types from database
- Create basic page structure (Dashboard, Calendar, Settings)
- Build header with navigation
- Implement theme switcher (dark/light)
- Create jobs management page (CRUD)

### Phase 2: Main Features
- Dashboard: Clock + Countdown + Counter
- Calendar view with shift tracking
- Live shift timer

### Phase 3: Salary & Analytics
- Basic salary calculations
- Overtime tracking
- Monthly summaries

### Phase 4: Advanced Features
- Penalties & bonuses
- Bar charts & analytics
- CSV/PDF export
- PWA notifications

---

**Last Updated**: 2024-12-04
