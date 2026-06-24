import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import {DEFAULT_LANGUAGE_CODE} from './languages';
import {resources} from './resources';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  defaultNS: 'common',
  fallbackLng: DEFAULT_LANGUAGE_CODE,
  interpolation: {
    escapeValue: false,
  },
  lng: DEFAULT_LANGUAGE_CODE,
  ns: [
    'common',
    'navigation',
    'language',
    'categories',
    'conditions',
    'checklist',
    'checklistTemplates',
    'auth',
    'rooms',
    'map',
    'cafeRoutes',
    'shareCard',
    'myPage',
  ],
  react: {
    useSuspense: false,
  },
  resources,
});

export {i18n};
export * from './languages';
