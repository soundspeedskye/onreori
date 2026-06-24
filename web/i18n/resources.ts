import type {Resource} from 'i18next';

import cn from './locales/cn.json';
import en from './locales/en.json';
import jp from './locales/jp.json';
import ko from './locales/ko.json';

export const resources = {
  ko,
  en,
  ja: jp,
  zh: cn,
} satisfies Resource;
