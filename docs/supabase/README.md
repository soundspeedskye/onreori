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

## 3. Deploy Edge Functions

The map picker searches Kakao places through Supabase Edge Functions so the Kakao REST API key is never bundled into the React Native app.

Link the local Supabase workspace to the remote project once, or add `--project-ref <project-ref>` to the `secrets` and `functions` commands below:

```sh
supabase link --project-ref your-project-ref
```

Register the Kakao REST API key as a Supabase function secret:

```sh
supabase secrets set KAKAO_REST_API_KEY=your-kakao-rest-api-key
```

Deploy the place search function:

```sh
supabase functions deploy kakao-place-search
```

The function is configured with `verify_jwt = true` in `supabase/config.toml` and also checks for an authenticated user JWT before calling Kakao. Do not deploy or serve this function with JWT verification disabled, because the React Native app contains a public Supabase key and the server-side Kakao REST API key would otherwise be easier to abuse through the Edge Function.

For local function development, keep the key in `supabase/functions/.env` or pass an ignored env file with `supabase functions serve --env-file <path>`. Do not add `KAKAO_REST_API_KEY` to `.env.example`, `scripts/inlineSupabaseEnv.js`, or any React Native source file.
