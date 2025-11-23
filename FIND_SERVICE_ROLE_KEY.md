# How to Find Your Supabase Service Role Key

## Step-by-Step Instructions

1. **Go to your Supabase project dashboard**

   - Visit: https://supabase.com/dashboard
   - Log in if needed

2. **Select your project**

   - Click on the project: `kaokqdggrlavjurtwlcb` (or whatever your project name is)

3. **Navigate to Settings**

   - Click the gear icon (⚙️) in the left sidebar
   - Or go to: Settings → API

4. **Find the Service Role Key**
   - Look for a section labeled **"Project API keys"** or **"API Keys"**
   - You'll see:
     - **Publishable key** - This is safe for browser use (NOT what we need for admin operations)
     - Under **"Secret keys"** section:
       - **`default`** - This is what we need! ⭐
       - It starts with `sb_secret_` (this is the service role key)
5. **Copy the secret key**

   - Click the eye icon or "Reveal" button next to the `default` key under "Secret keys"
   - Copy the entire key (it starts with `sb_secret_...`)

6. **Add to your `.env.local` file**

   ```env
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```

   **Important**: Use the key that starts with `sb_secret_` from the "Secret keys" → "default" section, NOT the publishable key!

## Alternative: If You Can't Find It

If you can't find the service role key, I can create a temporary workaround that allows public writes. However, this is less secure and should only be used for development.

Let me know if you'd like me to set up the temporary workaround instead!
