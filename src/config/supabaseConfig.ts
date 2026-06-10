type RuntimeEnv = Record<string, string | undefined>;

type ResolveSupabaseRuntimeConfigParams = {
  runtimeEnv: RuntimeEnv;
};

type SupabaseRuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
};

function clean(value: string | undefined): string {
  return value?.trim() ?? '';
}

function firstFilled(...values: Array<string | undefined>): string {
  return values.map(clean).find(Boolean) ?? '';
}

export function resolveSupabaseRuntimeConfig({
  runtimeEnv,
}: ResolveSupabaseRuntimeConfigParams): SupabaseRuntimeConfig {
  const supabaseUrl = firstFilled(
    runtimeEnv.SUPABASE_URL,
    runtimeEnv.REACT_NATIVE_SUPABASE_URL,
  );
  const supabaseAnonKey = firstFilled(
    runtimeEnv.SUPABASE_ANON_KEY,
    runtimeEnv.REACT_NATIVE_SUPABASE_ANON_KEY,
  );

  return {
    supabaseUrl,
    supabaseAnonKey,
    isSupabaseConfigured:
      supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20,
  };
}
