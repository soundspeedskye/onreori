'use client';

import {AppLanguageProvider} from '@/i18n/AppLanguageProvider';
import {AuthProvider} from '@/lib/auth/AuthProvider';

export function AppProviders({children}: {children: React.ReactNode}) {
  return (
    <AppLanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </AppLanguageProvider>
  );
}
