import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {getLocales} from 'react-native-localize';

import {i18n} from './index';
import {
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGES,
  normalizeLanguageCode,
  normalizeOptionalLanguageCode,
} from './languages';
import type {SupportedLanguageCode} from './languages';

const APP_LANGUAGE_STORAGE_KEY = '@onreori/appLanguage';

type AppLanguageContextValue = {
  language: SupportedLanguageCode;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  setLanguage: (languageCode: SupportedLanguageCode) => Promise<void>;
};

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

type AppLanguageProviderProps = {
  children: React.ReactNode;
};

function getDeviceLanguage(): SupportedLanguageCode {
  const localeLanguage = getLocales()
    .map(locale => normalizeOptionalLanguageCode(locale.languageTag))
    .find((languageCode): languageCode is SupportedLanguageCode =>
      Boolean(languageCode),
    );

  return localeLanguage ?? DEFAULT_LANGUAGE_CODE;
}

export function AppLanguageProvider({children}: AppLanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguageCode>(
    getDeviceLanguage,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLanguage() {
      let storedLanguageCode: SupportedLanguageCode | null = null;

      try {
        storedLanguageCode = normalizeOptionalLanguageCode(
          await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY),
        );
      } catch {
        storedLanguageCode = null;
      }

      const nextLanguage = storedLanguageCode ?? getDeviceLanguage();
      let resolvedLanguage = nextLanguage;

      try {
        await i18n.changeLanguage(nextLanguage);
      } catch {
        await i18n.changeLanguage(DEFAULT_LANGUAGE_CODE);
        resolvedLanguage = DEFAULT_LANGUAGE_CODE;
      }

      if (!isMounted) {
        return;
      }

      setLanguageState(resolvedLanguage);
      setReady(true);
    }

    loadLanguage().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(
    async (languageCode: SupportedLanguageCode) => {
      const nextLanguage = normalizeLanguageCode(languageCode);

      setLanguageState(nextLanguage);
      await i18n.changeLanguage(nextLanguage);
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
    },
    [],
  );

  const value = useMemo<AppLanguageContextValue>(
    () => ({
      language,
      supportedLanguages: SUPPORTED_LANGUAGES,
      setLanguage,
    }),
    [language, setLanguage],
  );

  return ready ? (
    <AppLanguageContext.Provider value={value}>
      {children}
    </AppLanguageContext.Provider>
  ) : null;
}

export function useAppLanguage() {
  const context = useContext(AppLanguageContext);

  if (!context) {
    throw new Error(
      'useAppLanguage must be used within an AppLanguageProvider.',
    );
  }

  return context;
}
