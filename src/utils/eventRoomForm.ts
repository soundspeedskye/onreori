import {ALERT_MESSAGES} from '../constants/alertMessages';
import {EVENT_CATEGORY_IDS} from '../constants/eventCategories';
import {i18n} from '../i18n';
import {
  getKoreanEventRoomAvailability,
  isKoreanEventRoomDateActiveNow,
} from './date';
import {getRoomCreationActiveWindowMessage} from './eventRoomPolicy';

export type RoomCreationConfig = {
  titleLabel: string;
  titlePlaceholder: string;
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
      titleLabel: i18n.t('artistTitleLabel', {ns: 'rooms'}),
      titlePlaceholder: i18n.t('artistTitlePlaceholder', {ns: 'rooms'}),
      requiresPlace: false,
      allowsEventUrlPreview: false,
    };
  }

  return {
    titleLabel: i18n.t('titleLabel', {ns: 'rooms'}),
    titlePlaceholder:
      categoryId === EVENT_CATEGORY_IDS.POPUP
        ? i18n.t('popupTitlePlaceholder', {ns: 'rooms'})
        : i18n.t('eventDayTitlePlaceholder', {ns: 'rooms'}),
    requiresPlace: true,
    allowsEventUrlPreview: true,
  };
}

export function buildRoomTitle(categoryId: string, title: string): string {
  const trimmedTitle = title.trim();

  if (categoryId === EVENT_CATEGORY_IDS.CAFE_EVENT) {
    return i18n.t('cafeRoomTitle', {title: trimmedTitle, ns: 'rooms'});
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
