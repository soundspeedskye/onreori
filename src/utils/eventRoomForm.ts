import {ALERT_MESSAGES} from '../constants/alertMessages';
import {EVENT_CATEGORY_IDS} from '../constants/eventCategories';
import {DEFAULT_LANGUAGE_CODE, i18n, type SupportedLanguageCode} from '../i18n';
import {
  getKoreanEventRoomAvailability,
  isKoreanEventRoomDateActiveNow,
} from './date';
import {getRoomCreationActiveWindowMessage} from './eventRoomPolicy';

export type RoomCreationConfig = {
  requiresPlace: boolean;
  allowsEventUrlPreview: boolean;
};

type RoomCreationDraft = {
  title?: string;
  eventDate?: string;
  entryCode?: string;
  location?: string;
};

export function getRoomCreationConfig(categoryId: string): RoomCreationConfig {
  if (categoryId === EVENT_CATEGORY_IDS.CAFE_EVENT) {
    return {
      requiresPlace: false,
      allowsEventUrlPreview: false,
    };
  }

  return {
    requiresPlace: true,
    allowsEventUrlPreview: true,
  };
}

export function buildRoomTitle(
  categoryId: string,
  title: string,
  languageCode: SupportedLanguageCode = DEFAULT_LANGUAGE_CODE,
): string {
  const trimmedTitle = title.trim();

  if (categoryId === EVENT_CATEGORY_IDS.CAFE_EVENT) {
    return i18n.t('cafeRoomTitle', {
      title: trimmedTitle,
      lng: languageCode,
      ns: 'rooms',
    });
  }

  return trimmedTitle;
}

export function validateRoomCreationDraft(
  categoryId: string,
  draft: RoomCreationDraft,
): string | null {
  const config = getRoomCreationConfig(categoryId);

  if (!draft.title?.trim()) {
    return ALERT_MESSAGES.requiredInput;
  }

  const eventDate = draft.eventDate?.trim();

  if (!eventDate) {
    return ALERT_MESSAGES.requiredSelection;
  }

  if (!getKoreanEventRoomAvailability(eventDate)) {
    return ALERT_MESSAGES.requiredSelection;
  }

  if (!isKoreanEventRoomDateActiveNow(eventDate)) {
    return getRoomCreationActiveWindowMessage();
  }

  if (config.requiresPlace && !draft.location?.trim()) {
    return ALERT_MESSAGES.requiredSelection;
  }

  if (!draft.entryCode?.trim()) {
    return ALERT_MESSAGES.requiredInput;
  }

  return null;
}
