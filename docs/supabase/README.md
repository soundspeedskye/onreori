# Supabase Setup

This app runs in local preview mode when Supabase is not configured. To enable real auth, account checklists, event rooms, realtime chat, and photo uploads:

1. Create a Supabase project.
2. Open the SQL Editor and run `docs/supabase/schema.sql`.
3. Enable Realtime for `public.chat_messages`.
4. Set these environment variables before starting Metro:

```sh
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
npm start
```

The first production pass should keep email confirmation disabled until the login flow includes a confirmation screen.
