# Stay Connected

A private app for couples to stay emotionally connected.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS, Shadcn UI, Framer Motion
- **Backend/Auth:** Supabase

## Setup

### Prerequisites

- Node.js 20+ (required for Next.js 15)
- A Supabase project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run database migrations

```bash
npx supabase db push
```

Or run the migration manually in the Supabase SQL Editor:
- Copy the contents of `supabase/migrations/20250217000000_initial_schema.sql`
- Execute in Supabase Dashboard → SQL Editor

### 4. Configure Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000` (or your production URL)
- **Redirect URLs:** Add `http://localhost:3000/auth/callback`

### 5. Run the app

```bash
npm run dev
```

## Features

- **Auth:** Sign up and log in with email/password
- **Profile:** Auto-created on signup with a unique 6-digit invite code
- **Pairing:** Share your code and enter your partner's to link accounts
- **Protected routes:** `/dashboard` and `/pair` require authentication
- **Pulse Wheel:** Interactive emotion selector (Happy, Sad, Angry, Afraid + sub-feelings)
- **Check-ins:** Log how you feel each day; see your partner's check-in when paired
