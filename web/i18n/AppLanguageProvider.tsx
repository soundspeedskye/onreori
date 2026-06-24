'use client';

import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {i18n} from './index';
import {
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGES,
  normalizeLanguageCode,
  normalizeOptionalLanguageCode,
  type SupportedLanguageCode,
} from './languages';

const APP_LANGUAGE_STORAGE_KEY = 'onreori.appLanguage';

type AppLanguageContextValue = {
  language: SupportedLanguageCode;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  setLanguage: (languageCode: SupportedLanguageCode) => Promise<void>;
};

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

function getBrowserLanguage(): SupportedLanguageCode {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE_CODE;
  }

  const browserLanguage = navigator.languages
    .map(language => normalizeOptionalLanguageCode(language))
    .find((language): language is SupportedLanguageCode => Boolean(language));

  return browserLanguage ?? DEFAULT_LANGUAGE_CODE;
}

export function AppLanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<SupportedLanguageCode>(DEFAULT_LANGUAGE_CODE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedLanguage = normalizeOptionalLanguageCode(
      window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY),
    );
    const nextLanguage = storedLanguage ?? getBrowserLanguage();

    i18n.changeLanguage(nextLanguage).finally(() => {
      setLanguageState(nextLanguage);
      setReady(true);
    });
  }, []);

  const setLanguage = useCallback(async (languageCode: SupportedLanguageCode) => {
    const nextLanguage = normalizeLanguageCode(languageCode);
    setLanguageState(nextLanguage);
    await i18n.changeLanguage(nextLanguage);
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const value = useMemo(
    () => ({language, supportedLanguages: SUPPORTED_LANGUAGES, setLanguage}),
    [language, setLanguage],
  );

  return ready ? (
    <AppLanguageContext.Provider value={value}>{children}</AppLanguageContext.Provider>
  ) : null;
}

export function useAppLanguage() {
  const context = useContext(AppLanguageContext);

  if (!context) {
    throw new Error('useAppLanguage must be used within AppLanguageProvider.');
  }

  return context;
}
