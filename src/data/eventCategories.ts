import type {EventCategory} from '../types';

export const eventCategories: EventCategory[] = [
  {
    id: 'EVENT_DAY',
    title: '콘서트/팬콘',
    shortTitle: '콘서트',
    icon: '🎤',
    description: '입장, 대기, 관람 준비를 한 번에 챙기는 팬 이벤트 루틴.',
    templateId: 'concert_basic',
    roomLabel: '공연장 실시간 정보',
  },
  {
    id: 'POPUP',
    title: '팝업스토어/전시',
    shortTitle: '팝업',
    icon: '🛍️',
    description: '예약, 줄서기, 굿즈 구매와 보관까지 놓치지 않게 정리해요.',
    templateId: 'popup_store_basic',
    roomLabel: '대기줄/재고 공유',
  },
  {
    id: 'CAFE_EVENT',
    title: '생카/카페 이벤트',
    shortTitle: '생카',
    icon: '☕',
    description: '카페 동선, 특전, 교환 준비를 가볍게 관리하는 체크 흐름.',
    templateId: 'birthday_cafe_basic',
    roomLabel: '특전/동선 실시간 공유',
  },
];

export function getEventCategoryById(
  categoryId: string,
): EventCategory | undefined {
  return eventCategories.find(category => category.id === categoryId);
}
