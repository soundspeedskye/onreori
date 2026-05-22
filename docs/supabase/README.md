# Supabase Setup

This app runs in local preview mode when Supabase is not configured. To enable real auth, account checklists, event rooms, realtime chat, and photo uploads, set up Supabase once and then provide the public client keys.

## 1. Create the Supabase backend

1. Create a Supabase project.
2. Open the SQL Editor and run `docs/supabase/schema.sql`.
3. Enable Realtime for `public.chat_messages`.

## 2. Provide the app keys

Prefer injecting environment variables in your build or Metro environment:

```sh
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
```

The app also accepts `REACT_NATIVE_SUPABASE_URL` and `REACT_NATIVE_SUPABASE_ANON_KEY`. Metro reads these values through `scripts/inlineSupabaseEnv.js`, which inlines values from the shell environment first and then the ignored `.env` file. Keep real values out of tracked source files.

Use the Project URL and public `anon` key from Supabase Project Settings > API. Do not paste the service-role key into the React Native app. Restart Metro after changing the keys:

```sh
npm start
```

The first production pass should keep email confirmation disabled until the login flow includes a confirmation screen.
