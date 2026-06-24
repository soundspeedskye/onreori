function clean(value: string | undefined): string {
  return value?.trim() ?? '';
}

export const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey = clean(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabasePublishableKey.length > 20;
