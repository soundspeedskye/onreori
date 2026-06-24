'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {ALERT_MESSAGES} from '@/constants/alertMessages';
import {i18n} from '@/i18n';
import {createBrowserSupabaseClient} from '@/lib/supabase/browser';
import {isSupabaseConfigured} from '@/lib/supabase/config';
import type {AuthUser} from '@/types';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  serverConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (
    email: string,
    password: string,
    nickname: string,
  ) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

type BrowserSupabaseClient = NonNullable<
  ReturnType<typeof createBrowserSupabaseClient>
>;

const PREVIEW_USER_KEY = '@onreori/previewUser';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isStoredAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<Record<keyof AuthUser, unknown>>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.nickname === 'string'
  );
}

function readPreviewUser(): AuthUser | null {
  const storedUser = window.localStorage.getItem(PREVIEW_USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);

    if (isStoredAuthUser(parsedUser)) {
      return parsedUser;
    }
  } catch {
    // Drop malformed preview sessions so app startup can recover.
  }

  window.localStorage.removeItem(PREVIEW_USER_KEY);
  return null;
}

function writePreviewUser(user: AuthUser) {
  window.localStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(user));
}

function clearPreviewUser() {
  window.localStorage.removeItem(PREVIEW_USER_KEY);
}

function toAuthUser(
  id: string,
  email: string | undefined,
  nickname: string | undefined,
): AuthUser {
  const fallbackEmail = email ?? 'preview@onreori.local';

  return {
    id,
    email: fallbackEmail,
    nickname: nickname?.trim() || fallbackEmail.split('@')[0],
  };
}

function toUserNickname(metadata: Record<string, unknown> | undefined) {
  return typeof metadata?.nickname === 'string' ? metadata.nickname : undefined;
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<BrowserSupabaseClient | null>(null);

  const getSupabaseClient = useCallback(() => {
    if (!isSupabaseConfigured) {
      return null;
    }

    supabaseRef.current ??= createBrowserSupabaseClient();
    return supabaseRef.current;
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!isSupabaseConfigured) {
        const storedUser = readPreviewUser();

        if (active) {
          setUser(storedUser);
          setLoading(false);
        }
        return;
      }

      const supabase = getSupabaseClient();

      if (!supabase) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      const {data} = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (active) {
        setUser(
          sessionUser
            ? toAuthUser(
                sessionUser.id,
                sessionUser.email,
                toUserNickname(sessionUser.user_metadata),
              )
            : null,
        );
        setLoading(false);
      }
    }

    void loadSession();

    if (!isSupabaseConfigured) {
      return () => {
        active = false;
      };
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      const sessionUser = session?.user;
      setUser(
        sessionUser
          ? toAuthUser(
              sessionUser.id,
              sessionUser.email,
              toUserNickname(sessionUser.user_metadata),
            )
          : null,
      );
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [getSupabaseClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const trimmedEmail = email.trim();

      if (!trimmedEmail || !password.trim()) {
        throw new Error(ALERT_MESSAGES.requiredInput);
      }

      if (!isSupabaseConfigured) {
        const lowerEmail = trimmedEmail.toLowerCase();
        const previewUser = toAuthUser(
          `preview-${lowerEmail}`,
          lowerEmail,
          undefined,
        );

        writePreviewUser(previewUser);
        setUser(previewUser);
        return previewUser;
      }

      const supabase = getSupabaseClient();

      if (!supabase) {
        throw new Error(ALERT_MESSAGES.failed);
      }

      const {data, error} = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? ALERT_MESSAGES.failed);
      }

      const nextUser = toAuthUser(
        data.user.id,
        data.user.email,
        toUserNickname(data.user.user_metadata),
      );
      setUser(nextUser);
      return nextUser;
    },
    [getSupabaseClient],
  );

  const signUp = useCallback(
    async (email: string, password: string, nickname: string) => {
      const trimmedEmail = email.trim();
      const trimmedNickname = nickname.trim();

      if (!trimmedEmail || !password.trim() || !trimmedNickname) {
        throw new Error(ALERT_MESSAGES.requiredInput);
      }

      if (!isSupabaseConfigured) {
        const lowerEmail = trimmedEmail.toLowerCase();
        const previewUser = toAuthUser(
          `preview-${lowerEmail}`,
          lowerEmail,
          trimmedNickname,
        );

        writePreviewUser(previewUser);
        setUser(previewUser);
        return previewUser;
      }

      const supabase = getSupabaseClient();

      if (!supabase) {
        throw new Error(ALERT_MESSAGES.failed);
      }

      const {data, error} = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {nickname: trimmedNickname},
        },
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? ALERT_MESSAGES.failed);
      }

      if (!data.session) {
        throw new Error(i18n.t('confirmEmailBeforeLogin', {ns: 'auth'}));
      }

      const nextUser = toAuthUser(data.user.id, data.user.email, trimmedNickname);
      setUser(nextUser);
      return nextUser;
    },
    [getSupabaseClient],
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      const supabase = getSupabaseClient();
      const {error} = supabase
        ? await supabase.auth.signOut()
        : {error: new Error(ALERT_MESSAGES.failed)};

      if (error) {
        throw new Error(error.message);
      }
    }

    clearPreviewUser();
    setUser(null);
  }, [getSupabaseClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      serverConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
    }),
    [loading, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
