export type SupportedLanguageCode = 'ko' | 'en' | 'ja' | 'zh';

type SupportedLanguage = {
  code: SupportedLanguageCode;
  chipLabel: string;
  nativeLabel: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {code: 'ko', chipLabel: 'KO', nativeLabel: '한국어'},
  {code: 'en', chipLabel: 'EN', nativeLabel: 'English'},
  {code: 'ja', chipLabel: 'JP', nativeLabel: '日本語'},
  {code: 'zh', chipLabel: 'CN', nativeLabel: '中文'},
];

export const DEFAULT_LANGUAGE_CODE: SupportedLanguageCode = 'ko';

const supportedLanguageCodes = new Set<SupportedLanguageCode>(
  SUPPORTED_LANGUAGES.map(language => language.code),
);

export function normalizeOptionalLanguageCode(
  languageCode?: string | null,
): SupportedLanguageCode | null {
  if (!languageCode) {
    return null;
  }

  const normalizedCode = languageCode
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0];

  if (normalizedCode === 'jp') {
    return 'ja';
  }

  if (normalizedCode === 'cn') {
    return 'zh';
  }

  if (supportedLanguageCodes.has(normalizedCode as SupportedLanguageCode)) {
    return normalizedCode as SupportedLanguageCode;
  }

  return null;
}

export function normalizeLanguageCode(
  languageCode?: string | null,
  fallback: SupportedLanguageCode = DEFAULT_LANGUAGE_CODE,
): SupportedLanguageCode {
  return normalizeOptionalLanguageCode(languageCode) ?? fallback;
}

export function getIntlLocale(languageCode: SupportedLanguageCode): string {
  switch (languageCode) {
    case 'en':
      return 'en-US';
    case 'ja':
      return 'ja-JP';
    case 'zh':
      return 'zh-CN';
    case 'ko':
    default:
      return 'ko-KR';
  }
}
