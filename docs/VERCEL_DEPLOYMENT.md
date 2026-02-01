# Vercel Deployment Setup

If you're getting a **database error** when signing up on your Vercel deployment, follow these steps.

## Root Cause

Sign up uses Supabase Auth. When a user registers, a database trigger (`handle_new_user`) automatically creates a row in the `profiles` table. The error occurs when:

1. **The schema hasn't been applied** to your Supabase project
2. **Environment variables** on Vercel point to a different/wrong Supabase project
3. **Supabase project** is paused or misconfigured

## Fix Checklist

### 1. Apply the Database Schema in Supabase

The `profiles` table and trigger **must** exist in your Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and select your project
2. Open **SQL Editor**
3. Copy the entire contents of `supabase/schema.sql`
4. Run it (Execute)

If you've run it before, running again is safe—the script uses `CREATE OR REPLACE` and `IF NOT EXISTS`.

### 2. Set Environment Variables on Vercel

Your Vercel project must have these variables configured:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

**Where to find them:** Supabase Dashboard → Project Settings → API

**Important:** Use the **same** Supabase project for local dev and Vercel. If you use a different project for production, apply the schema to that project too.

### 3. Redeploy After Changes

1. Add or update env vars in Vercel: Project → Settings → Environment Variables
2. Trigger a new deployment (or push a commit)

### 4. Verify the Setup

- Check Supabase Dashboard → Table Editor: you should see `profiles`, `spaces`, `bookings`
- Check Supabase Dashboard → Database → Triggers: `on_auth_user_created` should exist
- Try signing up again on your Vercel URL

## Seeing the Actual Error

The auth page shows the error message from Supabase. If you see something like:

- **"Failed to create user"** or **"Database error"** → Usually means the trigger failed (schema not applied or wrong project)
- **"Invalid API key"** → Env vars missing or incorrect on Vercel
- **"new row violates row-level security policy"** → RLS policies may need adjustment

Check the browser console (F12 → Network) when signing up to see the raw API response for more details.
