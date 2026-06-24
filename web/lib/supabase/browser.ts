import {createBrowserClient} from '@supabase/ssr';
import {isSupabaseConfigured, supabasePublishableKey, supabaseUrl} from './config';

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
