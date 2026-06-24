# Onreori Mobile Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent `web/` mobile web version of Onreori that matches the existing app UI and supports checklist creation, local editing, Supabase login, account save, restore, and share-card download.

**Architecture:** Create a standalone Next.js app under `web/` that never imports from the repository root `src/`. Copy and adapt the minimum app logic into `web/` so the folder can later become its own repository. Use the same Supabase project, existing tables, existing RLS policies, and existing `upsert_checklist_with_items` RPC.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules/global CSS variables, `react-i18next`, `@supabase/supabase-js`, `@supabase/ssr`, `html-to-image`, Vitest, React Testing Library.

---

## Non-Negotiable Constraints

- Do not modify the existing React Native app during this MVP unless a later task explicitly asks for a cross-app schema fix.
- Do not import from `../src`, `../data`, or any path outside `web/`.
- Copy reusable logic into `web/` and adapt imports there.
- Use the same Supabase project as the native app.
- Never expose `service_role` or secret keys in `web/`.
- Use only browser-safe Supabase keys in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Preserve the existing app visual direction: lavender background, white cards, thick dark headings, yellow primary button, purple brand actions, mobile-first max width.
- Keep 1차 MVP focused on checklist + account save. Event rooms, realtime chat, image chat, Kakao maps, cafe routes, and event URL preview are out of scope for this plan.

## Existing Source References

Read these files before implementing the matching web modules:

- `App.tsx`: current screen flow and route names.
- `src/types/index.ts`: shared data types.
- `src/theme/tokens.ts`: colors, spacing, radii.
- `src/data/templates.ts`: checklist creation.
- `src/data/eventCategories.ts`: category model.
- `data/templates.v1.json`: checklist template data.
- `src/i18n/index.ts`, `src/i18n/resources.ts`, `src/i18n/languages.ts`, `src/i18n/locales/*.json`: translations.
- `src/storage/checklists.ts`: local checklist persistence behavior.
- `src/services/checklistAccount.ts`: Supabase checklist account sync.
- `src/screens/LandingScreen.tsx`, `CategoryHomeScreen.tsx`, `CategoryDetailScreen.tsx`, `ConditionsScreen.tsx`, `ChecklistScreen.tsx`, `ShareCardScreen.tsx`, `MyPageScreen.tsx`: target UX.
- `docs/supabase/schema.sql`: database schema, RLS, RPC contracts.

## Target File Structure

```text
web/
  .env.example
  next.config.ts
  package.json
  tsconfig.json
  vitest.config.ts
  app/
    globals.css
    layout.tsx
    page.tsx
    auth/page.tsx
    categories/page.tsx
    categories/[categoryId]/page.tsx
    conditions/[templateId]/page.tsx
    checklists/[checklistId]/page.tsx
    my/page.tsx
    share/[checklistId]/page.tsx
  components/
    auth/AuthForm.tsx
    categories/CategoryCard.tsx
    checklist/ChecklistAddItemForm.tsx
    checklist/ChecklistHeroCard.tsx
    checklist/ChecklistSections.tsx
    checklist/ShareChecklistPreview.tsx
    language/LanguageChipSelector.tsx
    ui/BottomActionBar.tsx
    ui/Button.tsx
    ui/Card.tsx
    ui/Chip.tsx
    ui/EmptyState.tsx
    ui/PixelIcon.tsx
    ui/ScreenHeader.tsx
    ui/TextField.tsx
  constants/
    alertMessages.ts
    eventCategories.ts
  data/
    eventCategories.ts
    templates.ts
    templates.v1.json
  i18n/
    AppLanguageProvider.tsx
    index.ts
    languages.ts
    resources.ts
    locales/cn.json
    locales/en.json
    locales/jp.json
    locales/ko.json
  lib/
    auth/AuthProvider.tsx
    storage/checklists.ts
    supabase/browser.ts
    supabase/config.ts
    supabase/server.ts
  services/
    checklistAccount.ts
  test/
    setup.ts
  types/
    index.ts
  utils/
    checklistItems.ts
    checklistPresentation.ts
    checklistTemplateTranslations.ts
    localId.ts
```

## Task 1: Bootstrap Independent Web App

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/vitest.config.ts`
- Create: `web/test/setup.ts`
- Create: `web/.env.example`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx`
- Create: `web/app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize `web/` package**

Run:

```bash
cd web
npm init -y
npm install --save-exact next@latest react@latest react-dom@latest @supabase/supabase-js@latest @supabase/ssr@latest i18next@latest react-i18next@latest html-to-image@latest
npm install --save-dev --save-exact typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest vitest@latest jsdom@latest @testing-library/react@latest @testing-library/jest-dom@latest
```

Expected: `web/package-lock.json` is created and `web/package.json` contains exact dependency versions, not ranges.

- [ ] **Step 2: Replace `web/package.json` scripts and metadata**

Set:

```json
{
  "name": "onreori-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
  },
  "engines": {
    "node": "^20.19.0 || >=22.13.0"
  }
}
```

Keep the dependency and devDependency versions installed in Step 1.

- [ ] **Step 2a: Ignore TypeScript incremental build output**

Add to the root `.gitignore` if it is not already present:

```gitignore
*.tsbuildinfo
```

- [ ] **Step 3: Create `web/next.config.ts`**

```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Create `web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create Vitest config**

`web/vitest.config.ts`:

```ts
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
```

`web/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Create env example**

`web/.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-or-anon-key
```

- [ ] **Step 7: Create minimal Next shell**

`web/app/layout.tsx`:

```tsx
import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onreori',
  description: 'Fan event day planner',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

`web/app/page.tsx`:

```tsx
export default function HomePage() {
  return <main>Onreori web bootstrap</main>;
}
```

`web/app/globals.css`:

```css
:root {
  --color-brand: #8f4dd8;
  --color-brand-muted: #7b3fc0;
  --color-brand-text: #6a35a8;
  --color-action: #ffcf3f;
  --color-action-text: #251b2d;
  --color-action-soft: #fff3c5;
  --color-text: #251b2d;
  --color-text-inverse: #ffffff;
  --color-background: #fbf7ff;
  --color-surface: #ffffff;
  --color-surface-muted: #f0e2ff;
  --color-border: #eadff2;
  --color-muted: #8a7d94;
  --color-dark: #251b2d;
  --color-success-soft: #e5fbf1;
  --color-success-text: #0c6846;
  --app-max-width: 480px;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--color-background);
  color: var(--color-text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
textarea {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 8: Verify bootstrap**

Run:

```bash
cd web
npm run lint
npm run build
npm run test
```

Expected: TypeScript static checking succeeds, `next build` succeeds, and Vitest exits successfully with no tests or passing setup.

- [ ] **Step 9: Commit**

```bash
git add .gitignore docs/superpowers/plans/2026-06-24-mobile-web-mvp.md web/package.json web/package-lock.json web/next.config.ts web/tsconfig.json web/vitest.config.ts web/test/setup.ts web/.env.example web/app/layout.tsx web/app/page.tsx web/app/globals.css
git commit -m "feat(web): bootstrap independent Next app"
```

## Task 2: Copy and Adapt Core Data, Types, i18n, and Checklist Utilities

**Files:**
- Create: `web/types/index.ts`
- Create: `web/constants/eventCategories.ts`
- Create: `web/constants/alertMessages.ts`
- Create: `web/data/templates.v1.json`
- Create: `web/data/templates.ts`
- Create: `web/data/eventCategories.ts`
- Create: `web/i18n/index.ts`
- Create: `web/i18n/resources.ts`
- Create: `web/i18n/languages.ts`
- Create: `web/i18n/AppLanguageProvider.tsx`
- Create: `web/i18n/locales/cn.json`
- Create: `web/i18n/locales/en.json`
- Create: `web/i18n/locales/jp.json`
- Create: `web/i18n/locales/ko.json`
- Create: `web/utils/localId.ts`
- Create: `web/utils/checklistItems.ts`
- Create: `web/utils/checklistTemplateTranslations.ts`
- Create: `web/utils/checklistPresentation.ts`
- Test: `web/utils/checklistItems.test.ts`

- [ ] **Step 1: Copy exact source content**

Copy these files into matching `web/` paths, then adjust imports so every import starts with `@/` or a relative path inside `web/`:

```text
src/types/index.ts -> web/types/index.ts
src/constants/eventCategories.ts -> web/constants/eventCategories.ts
src/constants/alertMessages.ts -> web/constants/alertMessages.ts
data/templates.v1.json -> web/data/templates.v1.json
src/data/templates.ts -> web/data/templates.ts
src/data/eventCategories.ts -> web/data/eventCategories.ts
src/i18n/index.ts -> web/i18n/index.ts
src/i18n/resources.ts -> web/i18n/resources.ts
src/i18n/languages.ts -> web/i18n/languages.ts
src/i18n/locales/cn.json -> web/i18n/locales/cn.json
src/i18n/locales/en.json -> web/i18n/locales/en.json
src/i18n/locales/jp.json -> web/i18n/locales/jp.json
src/i18n/locales/ko.json -> web/i18n/locales/ko.json
src/utils/localId.ts -> web/utils/localId.ts
src/utils/checklistItems.ts -> web/utils/checklistItems.ts
src/utils/checklistTemplateTranslations.ts -> web/utils/checklistTemplateTranslations.ts
src/utils/checklistPresentation.ts -> web/utils/checklistPresentation.ts
```

- [ ] **Step 2: Remove native-only type references**

In `web/types/index.ts`, remove `RootStackParamList`. Replace it with web route helper types:

```ts
export type AuthRedirect =
  | {type: 'accountSave'; checklistId: string}
  | {type: 'myPage'};
```

Keep all product data types: `Checklist`, `ChecklistItem`, `Template`, `EventCategory`, `AuthUser`, and `RemoteChecklistSummary`.

- [ ] **Step 3: Create web language provider**

`web/i18n/AppLanguageProvider.tsx`:

```tsx
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
```

- [ ] **Step 4: Add utility tests**

`web/utils/checklistItems.test.ts`:

```ts
import {describe, expect, it} from 'vitest';
import type {Checklist} from '@/types';
import {
  addCustomChecklistItem,
  deleteChecklistItem,
  groupChecklistItemsBySection,
  toggleChecklistItem,
} from './checklistItems';

function createChecklist(): Checklist {
  return {
    id: 'checklist-1',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: [],
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    saveState: 'draft',
    items: [
      {
        id: 'ticket',
        sourceItemId: 'ticket',
        name: 'Ticket',
        section: '필수',
        essential: true,
        tip: '',
        checked: false,
        custom: false,
      },
    ],
  };
}

describe('checklist item utilities', () => {
  it('toggles an item checked state', () => {
    const checklist = createChecklist();
    const nextChecklist = toggleChecklistItem(checklist, 'ticket');
    expect(nextChecklist.items[0].checked).toBe(true);
    expect(nextChecklist.updatedAt).not.toBe(checklist.updatedAt);
  });

  it('adds a custom item to the custom section', () => {
    const checklist = createChecklist();
    const nextChecklist = addCustomChecklistItem(checklist, {
      id: 'custom-1',
      name: 'Portable charger',
      description: 'Charge before leaving',
    });
    expect(nextChecklist.items).toHaveLength(2);
    expect(nextChecklist.items[1]).toMatchObject({
      id: 'custom-1',
      name: 'Portable charger',
      custom: true,
    });
  });

  it('does not delete template items and deletes custom items', () => {
    const checklist = addCustomChecklistItem(createChecklist(), {
      id: 'custom-1',
      name: 'Portable charger',
      description: '',
    });
    expect(deleteChecklistItem(checklist, 'ticket')).toBe(checklist);
    expect(deleteChecklistItem(checklist, 'custom-1').items).toHaveLength(1);
  });

  it('groups checklist items by section', () => {
    const grouped = groupChecklistItemsBySection(createChecklist().items, {
      templateId: 'concert_basic',
      t: key => key,
    });
    expect(grouped[0].title).toBe('필수');
    expect(grouped[0].items).toHaveLength(1);
  });
});
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd web
npm run test -- utils/checklistItems.test.ts
```

Expected: all checklist utility tests pass.

- [ ] **Step 6: Commit**

```bash
git add web/types web/constants web/data web/i18n web/utils
git commit -m "feat(web): copy checklist domain logic"
```

## Task 3: Build Web UI Foundation Matching the App

**Files:**
- Modify: `web/app/globals.css`
- Create: `web/components/ui/Button.tsx`
- Create: `web/components/ui/Card.tsx`
- Create: `web/components/ui/Chip.tsx`
- Create: `web/components/ui/TextField.tsx`
- Create: `web/components/ui/BottomActionBar.tsx`
- Create: `web/components/ui/ScreenHeader.tsx`
- Create: `web/components/ui/EmptyState.tsx`
- Create: `web/components/ui/PixelIcon.tsx`
- Test: `web/components/ui/Button.test.tsx`

- [ ] **Step 1: Extend global layout CSS**

Append to `web/app/globals.css`:

```css
.app-shell {
  width: min(100%, var(--app-max-width));
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--color-background);
}

.screen {
  min-height: 100dvh;
  padding: 20px;
  padding-bottom: 32px;
}

.screen-with-bottom-action {
  padding-bottom: 132px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

- [ ] **Step 2: Implement UI components**

Implement components with these public APIs:

```tsx
// web/components/ui/Button.tsx
type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'brand' | 'ghost';
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};
export function Button(props: ButtonProps): JSX.Element;

// web/components/ui/Card.tsx
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  asButton?: boolean;
  onClick?: () => void;
};
export function Card(props: CardProps): JSX.Element;

// web/components/ui/Chip.tsx
type ChipProps = {
  children: React.ReactNode;
  tone?: 'brand' | 'action';
};
export function Chip(props: ChipProps): JSX.Element;

// web/components/ui/TextField.tsx
type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement>;
export function TextField(props: TextFieldProps): JSX.Element;
```

Use the existing app token values: button min-height `48px`, card border `1px solid #eadff2`, default card radius `20px`, yellow primary background `#ffcf3f`, dark button background `#251b2d`, brand button background `#7b3fc0`.

- [ ] **Step 3: Implement pixel icons**

Copy the icon rectangle data from `src/components/ui/PixelIcon.tsx` into `web/components/ui/PixelIcon.tsx`. Render each rectangle as an SVG `<rect>` and expose:

```tsx
export type PixelIconName =
  | 'ticket'
  | 'coffee'
  | 'bag'
  | 'mic'
  | 'chat'
  | 'checkOn'
  | 'checkOff';

export function getPixelIconNameForEmoji(emoji: string): PixelIconName | null;

export function PixelIcon(props: {name: PixelIconName; size?: number}): JSX.Element;
```

If the native source has additional names, keep them. Do not use emoji-only icons for category cards unless `getPixelIconNameForEmoji` returns `null`.

- [ ] **Step 4: Test button states**

`web/components/ui/Button.test.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Button} from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
  });

  it('disables while loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('처리 중')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run UI tests**

Run:

```bash
cd web
npm run test -- components/ui/Button.test.tsx
```

Expected: both tests pass.

- [ ] **Step 6: Commit**

```bash
git add web/app/globals.css web/components/ui
git commit -m "feat(web): add app-like UI primitives"
```

## Task 4: Add Providers and Mobile App Shell

**Files:**
- Modify: `web/app/layout.tsx`
- Create: `web/components/AppProviders.tsx`
- Create: `web/lib/auth/AuthProvider.tsx`
- Create: `web/lib/supabase/config.ts`
- Create: `web/lib/supabase/browser.ts`
- Create: `web/lib/supabase/server.ts`

- [ ] **Step 1: Create Supabase config**

`web/lib/supabase/config.ts`:

```ts
function clean(value: string | undefined): string {
  return value?.trim() ?? '';
}

export const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey = clean(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabasePublishableKey.length > 20;
```

- [ ] **Step 2: Create browser client**

`web/lib/supabase/browser.ts`:

```ts
import {createBrowserClient} from '@supabase/ssr';
import {isSupabaseConfigured, supabasePublishableKey, supabaseUrl} from './config';

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
```

- [ ] **Step 3: Create server client**

`web/lib/supabase/server.ts`:

```ts
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {isSupabaseConfigured, supabasePublishableKey, supabaseUrl} from './config';

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({name, value, options}) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Client auth remains authoritative for MVP writes.
        }
      },
    },
  });
}
```

- [ ] **Step 4: Create app providers**

Create a temporary pass-through auth provider. Task 8 replaces this file with real Supabase auth.

`web/lib/auth/AuthProvider.tsx`:

```tsx
'use client';

export function AuthProvider({children}: {children: React.ReactNode}) {
  return children;
}
```

`web/components/AppProviders.tsx`:

```tsx
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
```

Task 8 replaces the temporary auth provider with the real implementation.

- [ ] **Step 5: Wire providers into layout**

`web/app/layout.tsx`:

```tsx
import type {Metadata, Viewport} from 'next';
import {AppProviders} from '@/components/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onreori',
  description: 'Fan event day planner',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>
          <div className="app-shell">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify build**

Run:

```bash
cd web
npm run build
```

Expected: build succeeds with temporary pass-through auth provider.

- [ ] **Step 7: Commit**

```bash
git add web/app/layout.tsx web/components/AppProviders.tsx web/lib/auth/AuthProvider.tsx web/lib/supabase
git commit -m "feat(web): add providers and Supabase clients"
```

## Task 5: Implement Landing, Category, and Feature Selection Routes

**Files:**
- Modify: `web/app/page.tsx`
- Create: `web/app/categories/page.tsx`
- Create: `web/app/categories/[categoryId]/page.tsx`
- Create: `web/components/categories/CategoryCard.tsx`

- [ ] **Step 1: Implement category card**

`web/components/categories/CategoryCard.tsx` must render the same data as the app:

```tsx
import Link from 'next/link';
import {Card} from '@/components/ui/Card';
import {PixelIcon, getPixelIconNameForEmoji} from '@/components/ui/PixelIcon';
import type {EventCategory} from '@/types';

export function CategoryCard({category}: {category: EventCategory}) {
  const iconName = getPixelIconNameForEmoji(category.icon);

  return (
    <Link href={`/categories/${category.id}`} aria-label={category.title}>
      <Card className="category-card">
        <div className="category-card__icon">
          {iconName ? <PixelIcon name={iconName} size={34} /> : <span>{category.icon}</span>}
        </div>
        <div className="category-card__content">
          <strong>{category.title}</strong>
          <p>{category.description}</p>
          <span>{category.roomLabel}</span>
        </div>
      </Card>
    </Link>
  );
}
```

Add matching CSS in `globals.css` or a component CSS module. Use 62px icon box, row layout, 18px card padding, and 22px radius.

- [ ] **Step 2: Implement landing page**

`web/app/page.tsx`:

```tsx
import Link from 'next/link';
import {PixelIcon} from '@/components/ui/PixelIcon';

export default function LandingPage() {
  return (
    <main className="screen landing-screen">
      <section className="landing-visual" aria-hidden="true">
        <PixelIcon name="ticket" size={92} />
        <span className="landing-visual__float landing-visual__float--tl"><PixelIcon name="coffee" size={32} /></span>
        <span className="landing-visual__float landing-visual__float--tr"><PixelIcon name="bag" size={32} /></span>
        <span className="landing-visual__float landing-visual__float--bl"><PixelIcon name="mic" size={32} /></span>
        <span className="landing-visual__float landing-visual__float--br"><PixelIcon name="chat" size={32} /></span>
      </section>
      <section className="landing-copy">
        <p>Fan day planner</p>
        <h1>팬 이벤트 당일 준비를 한곳에서</h1>
      </section>
      <Link className="primary-link" href="/categories">시작하기</Link>
    </main>
  );
}
```

Add `.primary-link` CSS with the same visual treatment as a primary `Button`: yellow background, dark text, 15px radius, 48px minimum height, centered label, and 800 font weight.

- [ ] **Step 3: Implement categories page**

`web/app/categories/page.tsx`:

```tsx
import Link from 'next/link';
import {CategoryCard} from '@/components/categories/CategoryCard';
import {Button} from '@/components/ui/Button';
import {ScreenHeader} from '@/components/ui/ScreenHeader';
import {getEventCategories} from '@/data/eventCategories';

export default function CategoriesPage() {
  const categories = getEventCategories();

  return (
    <main className="screen">
      <ScreenHeader
        title="어떤 이벤트인가요?"
        trailing={<Link className="my-button" href="/my">MY</Link>}
      />
      <div className="stack">
        {categories.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Implement category detail page**

`web/app/categories/[categoryId]/page.tsx`:

```tsx
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Card} from '@/components/ui/Card';
import {PixelIcon, getPixelIconNameForEmoji} from '@/components/ui/PixelIcon';
import {isCafeEventCategory} from '@/constants/eventCategories';
import {getEventCategoryById} from '@/data/eventCategories';

export default function CategoryDetailPage({params}: {params: {categoryId: string}}) {
  const category = getEventCategoryById(params.categoryId);

  if (!category) {
    notFound();
  }

  const iconName = getPixelIconNameForEmoji(category.icon);

  return (
    <main className="screen stack">
      <Card className="hero-card">
        {iconName ? <PixelIcon name={iconName} size={54} /> : <span className="hero-card__emoji">{category.icon}</span>}
        <h1>{category.title}</h1>
      </Card>

      <Link href={`/conditions/${category.templateId}`}>
        <Card className="action-card">
          <h2>체크리스트 만들기</h2>
        </Card>
      </Link>

      {isCafeEventCategory(category.id) ? (
        <Card className="action-card action-card--disabled">
          <h2>카페 루트</h2>
          <p>웹 2차에서 제공됩니다.</p>
        </Card>
      ) : null}

      <Card className="action-card action-card--disabled">
        <h2>오늘의 단톡방</h2>
        <p>웹 2차에서 제공됩니다.</p>
      </Card>
    </main>
  );
}
```

- [ ] **Step 5: Run build**

Run:

```bash
cd web
npm run build
```

Expected: landing, categories, and category detail routes compile.

- [ ] **Step 6: Commit**

```bash
git add web/app/page.tsx web/app/categories web/components/categories web/app/globals.css
git commit -m "feat(web): add category entry flow"
```

## Task 6: Implement Local Checklist Storage

**Files:**
- Create: `web/lib/storage/checklists.ts`
- Test: `web/lib/storage/checklists.test.ts`

- [ ] **Step 1: Write failing storage tests**

`web/lib/storage/checklists.test.ts`:

```ts
import {beforeEach, describe, expect, it} from 'vitest';
import type {Checklist} from '@/types';
import {
  consumePendingAccountSaveChecklistId,
  getAllChecklists,
  getChecklistById,
  saveChecklistDraft,
  saveChecklistSynced,
  setPendingAccountSaveChecklistId,
} from './checklists';

function checklist(): Checklist {
  return {
    id: 'checklist-1',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: ['rain'],
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    saveState: 'draft',
    items: [],
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('web checklist storage', () => {
  it('saves and reads a draft checklist', async () => {
    await saveChecklistDraft(checklist());
    expect(await getChecklistById('checklist-1')).toMatchObject({
      id: 'checklist-1',
      saveState: 'draft',
    });
    expect(await getAllChecklists()).toHaveLength(1);
  });

  it('records synced remote references', async () => {
    const draft = await saveChecklistDraft(checklist());
    const synced = await saveChecklistSynced(draft, {
      ownerId: 'user-1',
      remoteId: 'remote-1',
    });
    expect(synced.saveState).toBe('synced');
    expect((await getChecklistById('checklist-1'))?.remoteId).toBe('remote-1');
  });

  it('consumes pending account save once', async () => {
    await setPendingAccountSaveChecklistId('checklist-1');
    await expect(consumePendingAccountSaveChecklistId()).resolves.toBe('checklist-1');
    await expect(consumePendingAccountSaveChecklistId()).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
cd web
npm run test -- lib/storage/checklists.test.ts
```

Expected: fails because `web/lib/storage/checklists.ts` does not exist.

- [ ] **Step 3: Implement localStorage storage**

Adapt `src/storage/checklists.ts` into `web/lib/storage/checklists.ts`. Replace `AsyncStorage` calls with:

```ts
const STORAGE_KEY = 'onreori.checklists';
const PENDING_ACCOUNT_SAVE_KEY = 'onreori.pendingAccountSaveChecklistId';

function getItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(key);
}

function setItem(key: string, value: string): void {
  window.localStorage.setItem(key, value);
}

function removeItem(key: string): void {
  window.localStorage.removeItem(key);
}
```

Keep the native implementation's normalizers and exported functions:

```ts
export async function getAllChecklists(): Promise<Checklist[]>;
export async function getChecklistById(checklistId: string): Promise<Checklist | undefined>;
export async function saveChecklist(checklist: Checklist): Promise<void>;
export async function saveChecklistDraft(checklist: Checklist): Promise<Checklist>;
export async function saveChecklistDeviceSaved(checklist: Checklist): Promise<Checklist>;
export async function saveChecklistSynced(checklist: Checklist, remoteReference: {ownerId: string; remoteId: string}): Promise<Checklist>;
export async function saveChecklistSyncFailed(checklist: Checklist): Promise<Checklist>;
export async function saveChecklistRestoredFromAccount(checklist: Checklist): Promise<void>;
export async function setPendingAccountSaveChecklistId(checklistId: string): Promise<void>;
export async function consumePendingAccountSaveChecklistId(): Promise<string | null>;
```

- [ ] **Step 4: Run storage tests**

Run:

```bash
cd web
npm run test -- lib/storage/checklists.test.ts
```

Expected: all storage tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/lib/storage
git commit -m "feat(web): add checklist local storage"
```

## Task 7: Implement Conditions and Checklist Screens

**Files:**
- Create: `web/app/conditions/[templateId]/page.tsx`
- Create: `web/app/checklists/[checklistId]/page.tsx`
- Create: `web/components/checklist/ChecklistAddItemForm.tsx`
- Create: `web/components/checklist/ChecklistHeroCard.tsx`
- Create: `web/components/checklist/ChecklistSections.tsx`
- Test: `web/app/checklists/checklist-flow.test.tsx`

- [ ] **Step 1: Implement conditions route**

The route must:

- Load template by `templateId`.
- Render template card with icon and title.
- Render condition toggles as card rows.
- Create checklist using `createChecklistFromTemplate`.
- Save with `saveChecklistDraft`.
- Navigate to `/checklists/${checklist.id}`.

Use a client component inside the page because condition toggles and localStorage require the browser.

- [ ] **Step 2: Implement checklist UI components**

Create:

```tsx
// web/components/checklist/ChecklistHeroCard.tsx
export function ChecklistHeroCard(props: {
  icon: string;
  title: string;
  meta: string;
  saveStateLabel: string;
  conditionLabels: string[];
}) {}

// web/components/checklist/ChecklistAddItemForm.tsx
export function ChecklistAddItemForm(props: {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAdd: () => void;
}) {}

// web/components/checklist/ChecklistSections.tsx
export function ChecklistSections(props: {
  sections: Array<{title: string; items: ChecklistItem[]}>;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}) {}
```

Match the app visuals from `docs/images/preview-checklist.png`: large hero card, item-add card, section headings, item cards, bottom fixed action area.

- [ ] **Step 3: Implement checklist route behavior**

`web/app/checklists/[checklistId]/page.tsx` must:

- Load checklist from `getChecklistById`.
- Render empty state if missing.
- Show checked count and total count.
- Toggle item using `toggleChecklistItem`.
- Add custom item using `addCustomChecklistItem`.
- Delete only custom items using `deleteChecklistItem`.
- Persist every change using `saveChecklist`.
- Render bottom actions:
  - `내 계정에 저장`
  - `공유 카드`
- If checklist is already synced, later Task 10 will auto-sync updates after local save.

- [ ] **Step 4: Add flow test**

`web/app/checklists/checklist-flow.test.tsx` should render the checklist client component with a seeded localStorage checklist and assert:

```ts
expect(screen.getByText(/0\/1 완료/)).toBeInTheDocument();
await user.click(screen.getByRole('checkbox', {name: /Ticket/}));
expect(screen.getByText(/1\/1 완료/)).toBeInTheDocument();
```

Use `@testing-library/react` and `window.localStorage`.

- [ ] **Step 5: Run tests and build**

Run:

```bash
cd web
npm run test -- app/checklists/checklist-flow.test.tsx
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit**

```bash
git add web/app/conditions web/app/checklists web/components/checklist
git commit -m "feat(web): add checklist creation and editing"
```

## Task 8: Implement Supabase Auth for Web

**Files:**
- Create: `web/lib/auth/AuthProvider.tsx`
- Create: `web/components/auth/AuthForm.tsx`
- Create: `web/app/auth/page.tsx`
- Modify: `web/components/AppProviders.tsx`
- Test: `web/lib/auth/AuthProvider.test.tsx`

- [ ] **Step 1: Implement AuthProvider**

Adapt `src/auth/AuthContext.tsx` into `web/lib/auth/AuthProvider.tsx`. Replace AsyncStorage preview user storage with localStorage. Use `createBrowserSupabaseClient()` when Supabase is configured.

Required public API:

```ts
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  serverConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, nickname: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};
```

Use the same nickname behavior:

```ts
function toAuthUser(id: string, email: string | undefined, nickname: string | undefined): AuthUser {
  const fallbackEmail = email ?? 'preview@onreori.local';

  return {
    id,
    email: fallbackEmail,
    nickname: nickname?.trim() || fallbackEmail.split('@')[0],
  };
}
```

- [ ] **Step 2: Replace temporary provider**

Update `web/components/AppProviders.tsx` to import the real provider:

```tsx
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
```

- [ ] **Step 3: Implement auth form**

`web/components/auth/AuthForm.tsx` must support:

- sign in mode: email, password
- sign up mode: email, password, nickname
- submit loading state
- error message area
- switch mode button

On success, call a provided `onSuccess()` callback.

- [ ] **Step 4: Implement auth route**

`web/app/auth/page.tsx` must read query params:

```text
/auth?redirect=accountSave&checklistId=checklist-123
/auth?redirect=myPage
```

After success:

- `accountSave`: navigate to `/checklists/${checklistId}?saveToAccount=1`
- `myPage`: navigate to `/my`
- default: navigate to `/categories`

- [ ] **Step 5: Add AuthProvider preview-mode tests**

`web/lib/auth/AuthProvider.test.tsx`:

```tsx
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {AuthProvider, useAuth} from './AuthProvider';

function Probe() {
  const {user, signIn, signOut} = useAuth();

  return (
    <div>
      <span>{user?.email ?? 'signed-out'}</span>
      <button onClick={() => signIn('fan@example.com', 'password')}>sign in</button>
      <button onClick={() => signOut()}>sign out</button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('stores preview sign in when Supabase env is missing', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'sign in'}));
    expect(await screen.findByText('fan@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'sign out'}));
    await waitFor(() => expect(screen.getByText('signed-out')).toBeInTheDocument());
  });
});
```

- [ ] **Step 6: Run tests**

Run:

```bash
cd web
npm run test -- lib/auth/AuthProvider.test.tsx
npm run build
```

Expected: auth tests pass and build succeeds.

- [ ] **Step 7: Commit**

```bash
git add web/lib/auth web/components/auth web/app/auth web/components/AppProviders.tsx
git commit -m "feat(web): add Supabase auth flow"
```

## Task 9: Implement Account Checklist Save RPC

**Files:**
- Create: `web/services/checklistAccount.ts`
- Modify: `web/app/checklists/[checklistId]/page.tsx`
- Test: `web/services/checklistAccount.test.ts`

- [ ] **Step 1: Copy and adapt account service**

Adapt `src/services/checklistAccount.ts` into `web/services/checklistAccount.ts`.

Changes:

- Import `createBrowserSupabaseClient` from `@/lib/supabase/browser`.
- Import `isSupabaseConfigured` from `@/lib/supabase/config`.
- Keep RPC name `upsert_checklist_with_items`.
- Keep table names `checklists` and `checklist_items`.
- Keep row mapping behavior identical to native app.

Required exports:

```ts
export async function saveChecklistToAccount(checklist: Checklist, user: AuthUser): Promise<{ownerId: string; remoteId: string}>;
export async function listAccountChecklists(user: AuthUser): Promise<RemoteChecklistSummary[]>;
export async function restoreChecklistFromAccount(remoteChecklistId: string, user: AuthUser): Promise<Checklist>;
```

- [ ] **Step 2: Add service tests with mocked client**

Mock `createBrowserSupabaseClient()` and assert `saveChecklistToAccount` calls:

```ts
supabase.rpc('upsert_checklist_with_items', {
  input_remote_id: null,
  input_local_id: checklist.id,
  input_category_id: checklist.categoryId,
  input_template_id: checklist.templateId,
  input_title: checklist.title,
  input_selected_conditions: checklist.selectedConditions,
  input_items: [
    {
      local_id: item.id,
      name: item.name,
      section: item.section,
      essential: item.essential,
      tip: item.tip,
      checked: item.checked,
      custom: item.custom,
      sort_order: 0,
    },
  ],
});
```

- [ ] **Step 3: Wire save action into checklist page**

On `내 계정에 저장`:

- If no `user`, call `saveChecklistDraft`, `setPendingAccountSaveChecklistId`, and navigate to `/auth?redirect=accountSave&checklistId=${checklist.id}`.
- If `user`, call `saveChecklistToAccount`, then `saveChecklistSynced`.
- If the save fails, call `saveChecklistSyncFailed` and show an inline error.

Also read `saveToAccount=1` on page load. If present and `user` exists, consume `pendingAccountSaveChecklistId` and save that checklist.

- [ ] **Step 4: Add post-sync local state rule**

When a synced checklist is edited, call `saveChecklist` immediately and then `saveChecklistToAccount`. If the remote call fails, mark it `syncFailed`.

- [ ] **Step 5: Run tests and build**

Run:

```bash
cd web
npm run test -- services/checklistAccount.test.ts
npm run build
```

Expected: RPC mapping tests pass and build succeeds.

- [ ] **Step 6: Commit**

```bash
git add web/services/checklistAccount.ts web/app/checklists
git commit -m "feat(web): save checklists to Supabase account"
```

## Task 10: Implement My Page Checklist Restore

**Files:**
- Create: `web/app/my/page.tsx`
- Create: `web/components/my/MyChecklistTab.tsx`
- Test: `web/app/my/my-page.test.tsx`

- [ ] **Step 1: Implement my page route**

If user is signed out, show a guest card with a button to `/auth?redirect=myPage`.

If user is signed in:

- show email/nickname
- show sign out button
- load `listAccountChecklists(user)`
- render checklist rows ordered by `updatedAt desc`
- each row has `복원` action

- [ ] **Step 2: Implement restore**

On restore:

- call `restoreChecklistFromAccount(remoteId, user)`
- call `saveChecklistRestoredFromAccount(restoredChecklist)`
- navigate to `/checklists/${restoredChecklist.id}`

- [ ] **Step 3: Add My page test**

Mock auth context with a signed-out user and assert:

```ts
expect(screen.getByText(/로그인이 필요/)).toBeInTheDocument();
expect(screen.getByRole('link', {name: /로그인/})).toHaveAttribute('href', '/auth?redirect=myPage');
```

Mock signed-in state with one checklist and assert the title renders.

- [ ] **Step 4: Run tests and build**

Run:

```bash
cd web
npm run test -- app/my/my-page.test.tsx
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 5: Commit**

```bash
git add web/app/my web/components/my
git commit -m "feat(web): add account checklist restore"
```

## Task 11: Implement Share Card Download

**Files:**
- Create: `web/app/share/[checklistId]/page.tsx`
- Create: `web/components/checklist/ShareChecklistPreview.tsx`
- Test: `web/components/checklist/ShareChecklistPreview.test.tsx`

- [ ] **Step 1: Implement share preview component**

Adapt `src/components/checklist/ShareChecklistPreview.tsx` into web markup. Use the same structure:

- outer centered wrapper
- large white rounded card
- icon/title/progress
- condition chips
- inner card with first five checklist items

Use `PixelIcon` for `checkOn` and `checkOff`.

- [ ] **Step 2: Implement share page**

`web/app/share/[checklistId]/page.tsx` must:

- load checklist from localStorage
- show preview
- use `html-to-image` `toPng(node)` on export
- download file named `onreori-share-card.png`
- use Web Share API when available and when user chooses share

Required download helper:

```ts
function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

- [ ] **Step 3: Connect checklist page**

The checklist bottom action `공유 카드` navigates to `/share/${checklist.id}`.

- [ ] **Step 4: Add preview test**

Assert title, progress, and first item render:

```ts
expect(screen.getByText('Concert checklist')).toBeInTheDocument();
expect(screen.getByText('0/1 완료')).toBeInTheDocument();
expect(screen.getByText('Ticket')).toBeInTheDocument();
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
cd web
npm run test -- components/checklist/ShareChecklistPreview.test.tsx
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit**

```bash
git add web/app/share web/components/checklist/ShareChecklistPreview.tsx web/app/checklists
git commit -m "feat(web): add share card download"
```

## Task 12: Manual QA and Vercel Readiness

**Files:**
- Create: `web/README.md`
- Modify: `web/.env.example`

- [ ] **Step 1: Create web README**

`web/README.md`:

```md
# Onreori Web

Mobile web version of Onreori.

## Local Development

```sh
npm install
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-or-anon-key
```

Use the same Supabase project as the native app. Do not use service role or secret keys in this app.

## Vercel

- Root Directory: `web`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output: Next.js default
```

- [ ] **Step 2: Run full verification**

Run:

```bash
cd web
npm run test
npm run build
```

Expected: all tests pass and build succeeds.

- [ ] **Step 3: Local browser QA**

Run:

```bash
cd web
npm run dev
```

Open `http://localhost:3000` and verify:

- Landing page shows Onreori visual and start action.
- Category page visually matches `docs/images/preview-category.png`.
- Conditions page visually matches `docs/images/preview-conditions.png`.
- Checklist page visually matches `docs/images/preview-checklist.png`.
- Checklist items toggle and persist after refresh.
- Custom items add and persist after refresh.
- Signed-out account save redirects to auth.
- Sign up or sign in returns to checklist and saves to Supabase.
- My page lists the saved checklist.
- Restore opens the checklist.
- Share card downloads a PNG.

- [ ] **Step 4: Supabase dashboard checks**

In the same Supabase project:

- Auth URL configuration includes local development and Vercel URLs.
- `checklists` row appears after account save.
- `checklist_items` rows appear after account save.
- RLS prevents another signed-in user from reading the saved checklist.
- No service role key appears in Vercel environment variables.

- [ ] **Step 5: Commit docs**

```bash
git add web/README.md web/.env.example
git commit -m "docs(web): document setup and deployment"
```

## Scope Deferred to Later Plans

- Event rooms list and room creation.
- Supabase Realtime room chat.
- Web image upload into `chat-media`.
- Kakao Maps JavaScript SDK map picker.
- Cafe route editor and export card.
- Event URL preview Edge Function UI.
- PWA install/offline support.

## Self-Review

- Spec coverage: The plan covers independent `web/`, same Supabase project, future repo split, app-like UI, checklist MVP, login, account save, my page restore, and share-card download.
- Placeholder scan: The plan does not use open-ended implementation placeholders. Deferred features are explicitly out of MVP scope.
- Type consistency: `Checklist`, `AuthUser`, `RemoteChecklistSummary`, `AuthRedirect`, and Supabase RPC names match the existing app and schema.
- Risk notes: The largest 1차 risk is Supabase Auth session behavior in Next.js. The plan uses browser-safe public keys and `@supabase/ssr`, while relying on RLS and the existing RPC for data safety.
