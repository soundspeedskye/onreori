# Onreori Web

Mobile web version of Onreori.

## Local Development

```sh
npm install
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-or-anon-key
```

Use the same Supabase project as the native app. Do not use service role or secret keys in this app.

## Vercel

- Root Directory: `web`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output: Next.js default
