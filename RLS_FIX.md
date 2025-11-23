# RLS Policy Fix

## Problem
The API routes were failing with "new row violates row-level security policy" because they were using the public Supabase client which doesn't have authentication.

## Solution
Created an admin Supabase client that uses the service role key to bypass RLS for server-side admin operations.

## Setup Required

Add the following to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

You can find your service role key in your Supabase project settings:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (NOT the anon/public key)
4. Add it to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## Security Note
The service role key bypasses all RLS policies and should ONLY be used in server-side code (API routes). Never expose it to the client side.

## Files Changed
- `lib/supabase.ts` - Added `supabaseAdmin` client and `getSupabaseAdmin()` helper
- `app/api/widgets/[friendId]/route.ts` - Now uses admin client
- `app/api/content/top_10_songs/route.ts` - Now uses admin client


