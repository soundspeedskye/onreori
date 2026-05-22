import 'react-native-url-polyfill/auto';

import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {resolveSupabaseRuntimeConfig} from './supabaseConfig';

declare const process: {
  env: Record<string, string | undefined>;
};

const runtimeEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  REACT_NATIVE_SUPABASE_URL: process.env.REACT_NATIVE_SUPABASE_URL,
  REACT_NATIVE_SUPABASE_ANON_KEY: process.env.REACT_NATIVE_SUPABASE_ANON_KEY,
};

const runtimeConfig = resolveSupabaseRuntimeConfig({
  runtimeEnv,
});

export const {supabaseUrl, supabaseAnonKey, isSupabaseConfigured} =
  runtimeConfig;

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
