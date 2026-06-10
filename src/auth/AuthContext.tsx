import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {ALERT_MESSAGES} from '../constants/alertMessages';
import {isSupabaseConfigured, supabase} from '../config/supabase';
import type {AuthUser} from '../types';

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

const PREVIEW_USER_KEY = '@onreori/previewUser';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!isSupabaseConfigured || !supabase) {
        const storedUser = await AsyncStorage.getItem(PREVIEW_USER_KEY);
        if (active && storedUser) {
          setUser(JSON.parse(storedUser) as AuthUser);
        }
        if (active) {
          setLoading(false);
        }
        return;
      }

      const {data} = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (active && sessionUser) {
        setUser(
          toAuthUser(
            sessionUser.id,
            sessionUser.email,
            sessionUser.user_metadata?.nickname as string | undefined,
          ),
        );
      }

      if (active) {
        setLoading(false);
      }
    }

    loadSession();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        active = false;
      };
    }

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      setUser(
        sessionUser
          ? toAuthUser(
              sessionUser.id,
              sessionUser.email,
              sessionUser.user_metadata?.nickname as string | undefined,
            )
          : null,
      );
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error(ALERT_MESSAGES.requiredInput);
    }

    if (!isSupabaseConfigured || !supabase) {
      const previewUser = toAuthUser(
        `preview-${email.trim().toLowerCase()}`,
        email.trim().toLowerCase(),
        undefined,
      );
      await AsyncStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(previewUser));
      setUser(previewUser);
      return previewUser;
    }

    const {data, error} = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? ALERT_MESSAGES.failed);
    }

    const nextUser = toAuthUser(
      data.user.id,
      data.user.email,
      data.user.user_metadata?.nickname as string | undefined,
    );
    setUser(nextUser);
    return nextUser;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, nickname: string) => {
      if (!email.trim() || !password.trim() || !nickname.trim()) {
        throw new Error(ALERT_MESSAGES.requiredInput);
      }

      if (!isSupabaseConfigured || !supabase) {
        const previewUser = toAuthUser(
          `preview-${email.trim().toLowerCase()}`,
          email.trim().toLowerCase(),
          nickname,
        );
        await AsyncStorage.setItem(
          PREVIEW_USER_KEY,
          JSON.stringify(previewUser),
        );
        setUser(previewUser);
        return previewUser;
      }

      const {data, error} = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {nickname: nickname.trim()},
        },
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? ALERT_MESSAGES.failed);
      }

      if (!data.session) {
        throw new Error('가입 확인 이메일을 완료한 뒤 로그인하세요.');
      }

      const nextUser = toAuthUser(data.user.id, data.user.email, nickname);
      setUser(nextUser);
      return nextUser;
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }

    await AsyncStorage.removeItem(PREVIEW_USER_KEY);
    setUser(null);
  }, []);

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
