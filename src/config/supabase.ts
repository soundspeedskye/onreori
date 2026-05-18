import 'react-native-url-polyfill/auto';

import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const runtimeEnv =
  (globalThis as {process?: {env?: Record<string, string | undefined>}})
    .process?.env ?? {};

export const supabaseUrl =
  runtimeEnv.SUPABASE_URL ?? runtimeEnv.REACT_NATIVE_SUPABASE_URL ?? '';

export const supabaseAnonKey =
  runtimeEnv.SUPABASE_ANON_KEY ??
  runtimeEnv.REACT_NATIVE_SUPABASE_ANON_KEY ??
  '';

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
