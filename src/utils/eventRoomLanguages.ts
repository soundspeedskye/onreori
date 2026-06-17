import type {SupportedLanguageCode} from '../i18n/languages';
import {normalizeOptionalLanguageCode} from '../i18n/languages';
import type {EventRoom, EventRoomLanguageFilter} from '../types';

const SUPPORTED_ROOM_LANGUAGE_CODES: SupportedLanguageCode[] = [
  'ko',
  'en',
  'ja',
  'zh',
];

export const DEFAULT_ROOM_LANGUAGE_CODES: SupportedLanguageCode[] = ['ko'];

export function normalizeRoomLanguageCodes(
  values: unknown,
): SupportedLanguageCode[] {
  const rawValues = Array.isArray(values) ? values : [values];
  const selectedCodes = new Set<SupportedLanguageCode>();

  rawValues.forEach(value => {
    if (typeof value !== 'string') {
      return;
    }

    const code = normalizeOptionalLanguageCode(value);

    if (code) {
      selectedCodes.add(code);
    }
  });

  const normalizedCodes = SUPPORTED_ROOM_LANGUAGE_CODES.filter(code =>
    selectedCodes.has(code),
  );

  return normalizedCodes.length > 0
    ? normalizedCodes
    : [...DEFAULT_ROOM_LANGUAGE_CODES];
}

export function getPrimaryRoomLanguage(
  values: unknown,
): SupportedLanguageCode {
  return normalizeRoomLanguageCodes(values)[0];
}

export function normalizePrimaryRoomLanguage(
  value: unknown,
  languageCodes: unknown,
): SupportedLanguageCode {
  const normalizedLanguageCodes = normalizeRoomLanguageCodes(languageCodes);
  const normalizedValue =
    typeof value === 'string' ? normalizeOptionalLanguageCode(value) : null;

  return normalizedValue && normalizedLanguageCodes.includes(normalizedValue)
    ? normalizedValue
    : getPrimaryRoomLanguage(normalizedLanguageCodes);
}

export function toggleRoomLanguageCode(
  selected: readonly SupportedLanguageCode[],
  code: SupportedLanguageCode,
): SupportedLanguageCode[] {
  const selectedCodes = normalizeRoomLanguageCodes(selected);

  if (selectedCodes.includes(code)) {
    return selectedCodes.length > 1
      ? selectedCodes.filter(selectedCode => selectedCode !== code)
      : selectedCodes;
  }

  return normalizeRoomLanguageCodes([...selectedCodes, code]);
}

export function filterRoomsByLanguage<T extends EventRoom>(
  rooms: readonly T[],
  filter: EventRoomLanguageFilter,
): T[] {
  if (filter === 'all') {
    return [...rooms];
  }

  return rooms.filter(room =>
    normalizeRoomLanguageCodes(room.languageCodes).includes(filter),
  );
}
