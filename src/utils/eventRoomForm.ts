import {ALERT_MESSAGES} from '../constants/alertMessages';
import {EVENT_CATEGORY_IDS} from '../constants/eventCategories';

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
      titleLabel: '아티스트/멤버명',
      titlePlaceholder: '예: 민지',
      requiresPlace: false,
      allowsEventUrlPreview: false,
    };
  }

  return {
    titleLabel: '방 제목',
    titlePlaceholder:
      categoryId === EVENT_CATEGORY_IDS.POPUP
        ? '예: 성수 팝업 재고방'
        : '예: KSPO 2일차 대기방',
    requiresPlace: true,
    allowsEventUrlPreview: true,
  };
}

export function buildRoomTitle(categoryId: string, title: string): string {
  const trimmedTitle = title.trim();

  if (categoryId === EVENT_CATEGORY_IDS.CAFE_EVENT) {
    return `${trimmedTitle} 생카 정보방`;
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

  if (!draft.eventDate?.trim()) {
    return ALERT_MESSAGES.requiredSelection;
  }

  if (config.requiresPlace && !draft.location?.trim()) {
    return ALERT_MESSAGES.requiredSelection;
  }

  if (!draft.entryCode?.trim()) {
    return ALERT_MESSAGES.requiredInput;
  }

  return null;
}
