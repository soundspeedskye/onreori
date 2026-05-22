type RoomCreationConfig = {
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

const CAFE_EVENT = 'CAFE_EVENT';
const POPUP = 'POPUP';

export function getRoomCreationConfig(categoryId: string): RoomCreationConfig {
  if (categoryId === CAFE_EVENT) {
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
      categoryId === POPUP ? '예: 성수 팝업 재고방' : '예: KSPO 2일차 대기방',
    requiresPlace: true,
    allowsEventUrlPreview: true,
  };
}

export function buildRoomTitle(categoryId: string, title: string): string {
  const trimmedTitle = title.trim();

  if (categoryId === CAFE_EVENT) {
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
    return categoryId === CAFE_EVENT
      ? '아티스트/멤버명을 입력하세요.'
      : '방 제목을 입력하세요.';
  }

  if (!draft.eventDate?.trim()) {
    return '날짜를 선택하세요.';
  }

  if (config.requiresPlace && !draft.location?.trim()) {
    return '장소를 선택하세요.';
  }

  if (!draft.entryCode?.trim()) {
    return '입장코드를 입력하세요.';
  }

  return null;
}
