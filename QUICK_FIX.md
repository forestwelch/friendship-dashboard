# Quick Fix: Allow Public Writes (Development Only)

Since you can't find the service role key right now, I've created a temporary workaround.

## Option 1: Use the Temporary Migration (Easiest)

Run this migration in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the contents of `supabase/migrations/004_temp_allow_public_writes.sql`
4. Click "Run"

This will temporarily allow public writes to the database (development only!).

## Option 2: Find the Service Role Key (Recommended)

Follow the instructions in `FIND_SERVICE_ROLE_KEY.md` to find your service role key.

Once you have it:
1. Add it to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_key_here
   ```
2. Revert the temporary migration by running:
   ```sql
   -- Revert to secure policies
   DROP POLICY IF EXISTS "Allow public writes to friend_widgets (DEV ONLY)" ON friend_widgets;
   DROP POLICY IF EXISTS "Allow public writes to global_content (DEV ONLY)" ON global_content;
   DROP POLICY IF EXISTS "Allow public writes to pixel_art_images (DEV ONLY)" ON pixel_art_images;
   
   -- Restore secure policies
   CREATE POLICY "Only admins can manage friend widgets"
     ON friend_widgets FOR ALL
     USING (auth.role() = 'authenticated');
   
   CREATE POLICY "Only admins can manage global content"
     ON global_content FOR ALL
     USING (auth.role() = 'authenticated');
   
   CREATE POLICY "Only admins can manage pixel art images"
     ON pixel_art_images FOR ALL
     USING (auth.role() = 'authenticated');
   ```

## Security Warning

The temporary migration allows **anyone** to write to your database. Only use it for local development!

