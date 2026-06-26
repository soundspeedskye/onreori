import {getTimeZone} from 'react-native-localize';

type LocaleFallbackInput = {
  toString: () => string;
};

class LocaleFallback {
  private readonly locale: string;
  readonly language: string;
  readonly script: string | undefined;
  readonly region: string | undefined;

  constructor(locale: string | LocaleFallbackInput) {
    this.locale = locale.toString();
    const [language, scriptOrRegion, region] = this.locale.split('-');

    this.language = language.toLowerCase();

    if (scriptOrRegion?.length === 4) {
      this.script =
        scriptOrRegion.charAt(0).toUpperCase() +
        scriptOrRegion.slice(1).toLowerCase();
      this.region = region?.toUpperCase();
    } else {
      this.script = undefined;
      this.region = scriptOrRegion?.toUpperCase();
    }
  }

  maximize(): LocaleFallback {
    switch (this.language) {
      case 'ko':
        return new LocaleFallback('ko-Kore-KR');
      case 'ja':
        return new LocaleFallback('ja-Jpan-JP');
      case 'zh':
        return new LocaleFallback(
          this.region === 'TW' || this.region === 'HK' || this.script === 'Hant'
            ? `zh-Hant-${this.region ?? 'TW'}`
            : `zh-Hans-${this.region ?? 'CN'}`,
        );
      case 'en':
        return new LocaleFallback(`en-Latn-${this.region ?? 'US'}`);
      default:
        return this;
    }
  }

  minimize(): LocaleFallback {
    return this;
  }

  toString(): string {
    return this.locale;
  }
}

function hasUsableIntlLocale(): boolean {
  try {
    return (
      typeof Intl !== 'undefined' &&
      typeof Intl.Locale === 'function' &&
      typeof new Intl.Locale('en').maximize === 'function' &&
      typeof new Intl.Locale('en').minimize === 'function'
    );
  } catch {
    return false;
  }
}

require('@formatjs/intl-getcanonicallocales/polyfill-force.js');

if (!hasUsableIntlLocale()) {
  Object.defineProperty(Intl, 'Locale', {
    configurable: true,
    writable: true,
    value: LocaleFallback,
  });
}

require('@formatjs/intl-datetimeformat/polyfill-force.js');
require('@formatjs/intl-datetimeformat/add-golden-tz.js');
require('@formatjs/intl-datetimeformat/locale-data/ko.js');
require('@formatjs/intl-datetimeformat/locale-data/en.js');
require('@formatjs/intl-datetimeformat/locale-data/ja.js');
require('@formatjs/intl-datetimeformat/locale-data/zh.js');

type DateTimeFormatWithDefaultTimeZone = typeof Intl.DateTimeFormat & {
  __setDefaultTimeZone?: (timeZone?: string) => void;
};

try {
  (
    Intl.DateTimeFormat as DateTimeFormatWithDefaultTimeZone
  ).__setDefaultTimeZone?.(getTimeZone());
} catch {
  // Keep FormatJS' UTC fallback if the native timezone is unavailable.
}
