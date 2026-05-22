import {resolveSupabaseRuntimeConfig} from '../src/config/supabaseConfig';

const validUrl = 'https://example.supabase.co';
const validAnonKey = 'a'.repeat(32);

test('uses primary Supabase environment variables', () => {
  const config = resolveSupabaseRuntimeConfig({
    runtimeEnv: {
      SUPABASE_URL: validUrl,
      SUPABASE_ANON_KEY: validAnonKey,
    },
  });

  expect(config.supabaseUrl).toBe(validUrl);
  expect(config.supabaseAnonKey).toBe(validAnonKey);
  expect(config.isSupabaseConfigured).toBe(true);
});

test('uses React Native-prefixed environment variables as a fallback', () => {
  const config = resolveSupabaseRuntimeConfig({
    runtimeEnv: {
      REACT_NATIVE_SUPABASE_URL: validUrl,
      REACT_NATIVE_SUPABASE_ANON_KEY: validAnonKey,
    },
  });

  expect(config.supabaseUrl).toBe(validUrl);
  expect(config.supabaseAnonKey).toBe(validAnonKey);
  expect(config.isSupabaseConfigured).toBe(true);
});

test('keeps Supabase disabled for placeholder values', () => {
  const config = resolveSupabaseRuntimeConfig({
    runtimeEnv: {},
  });

  expect(config.supabaseUrl).toBe('');
  expect(config.supabaseAnonKey).toBe('');
  expect(config.isSupabaseConfigured).toBe(false);
});
