# Gamified Fitness Journey App

## Overview

A Duolingo-style gamified fitness mobile application where users follow a Journey Map with nodes/tasks, earn rewards, unlock zones, and evolve their avatar. The app uses OpenAI to generate personalized workouts like a personal trainer. Built with a React frontend and Express backend, using PostgreSQL for data persistence.

Key features:
- Journey Map with unlockable nodes and zones
- XP, coins, streaks, and level progression
- AI-generated 7-day weekly plans with workout AND rest days
- Full rest day support with special purple-themed UI in WorkoutPlayer
- Avatar evolution system with cosmetics
- QuickFit mode for on-demand workout generation
- Dual authentication: Replit Auth and Email-based (magic link + OTP)
- Push notifications for workout reminders and streak alerts

## Weekly Schedule System

The AI generates a full 7-day weekly schedule that includes both workout days and rest/recovery days:
- **Workout days**: Include exercises, duration, and focus area
- **Rest days**: Include motivational messaging, special Moon-themed purple UI in WorkoutPlayer
- Each zone has 7 nodes representing one full week (Mon-Sun)
- Node types are DYNAMICALLY determined based on user's weekly plan (workout vs recovery)
- Map API returns `scheduleDayName` and `scheduleFocus` for each node
- Rest day detection: empty exercises array OR focus/notes contains "rest"/"recovery"/"off"
- Completing rest days marks node as complete and contributes to streak maintenance
- Streak calculation respects rest days - won't break streak for scheduled rest
- **Note**: Existing users with old 4-day plans will need to regenerate their plan to get the 7-day schedule

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for gamified transitions and rewards
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Key Tables**:
  - `user_profiles`: Progression data (XP, coins, streak, unlocked nodes)
  - `nodes`: Game map nodes/tasks
  - `zones`: Map zones containing nodes
  - `workouts`: AI-generated workout data (cached to reduce OpenAI costs)
  - `sessions`: Authentication sessions
  - `users`: Auth user data

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations
- **Cost Optimization**: Workouts are generated once and stored in database to avoid regeneration
- **Features**: Workout generation, chat completions, image generation

### Build System
- **Client**: Vite builds to `dist/public`
- **Server**: esbuild bundles to `dist/index.cjs`
- **Database Migrations**: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- PostgreSQL (required, configured via DATABASE_URL environment variable)
- Drizzle ORM for type-safe queries
- connect-pg-simple for session storage

### Authentication
- **Dual Auth System**: Both Replit Auth and Email-based authentication
- Replit Auth (OpenID Connect) via Passport.js with openid-client strategy
- Email Auth: Magic link login + 30-day OTP re-verification
- express-session for session management (PostgreSQL-backed)
- **Email Service**: Resend for transactional emails (magic links, OTP codes)
- **Email Auth Tables**: `email_identities`, `magic_link_tokens`, `otp_codes`
- **Key Files**: `server/email-auth.ts`, `server/email.ts`, `client/src/pages/EmailLogin.tsx`

### AI Services
- OpenAI API via Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Used for workout generation, chat, and image generation

### UI Components
- shadcn/ui (Radix UI primitives)
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `zod`: Runtime type validation
- `wouter`: Client-side routing
- `openai`: AI API client