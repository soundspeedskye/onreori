import {EVENT_CATEGORY_IDS} from '../constants/eventCategories';
import type {EventCategory} from '../types';

export const eventCategories: EventCategory[] = [
  {
    id: EVENT_CATEGORY_IDS.EVENT_DAY,
    title: '콘서트/팬콘',
    icon: '🎤',
    description: '입장, 대기, 관람 준비를 한 번에 챙겨요.',
    templateId: 'concert_basic',
    roomLabel: '공연장 실시간 정보 공유',
  },
  {
    id: EVENT_CATEGORY_IDS.POPUP,
    title: '팝업/전시',
    icon: '🛍️',
    description: '예약, 대기, 굿즈 구매를 한 번에 챙겨요.',
    templateId: 'popup_store_basic',
    roomLabel: '대기줄/재고 현황 공유',
  },
  {
    id: EVENT_CATEGORY_IDS.CAFE_EVENT,
    title: '생일카페 이벤트',
    icon: '☕',
    description: '카페 동선, 특전, 교환 준비를 한 번에 챙겨요.',
    templateId: 'birthday_cafe_basic',
    roomLabel: '특전/동선 현황 공유',
  },
];

export function getEventCategoryById(
  categoryId: string,
): EventCategory | undefined {
  return eventCategories.find(category => category.id === categoryId);
}
