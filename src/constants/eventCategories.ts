export const EVENT_CATEGORY_IDS = {
  EVENT_DAY: 'EVENT_DAY',
  POPUP: 'POPUP',
  CAFE_EVENT: 'CAFE_EVENT',
} as const;

export type EventCategoryId =
  (typeof EVENT_CATEGORY_IDS)[keyof typeof EVENT_CATEGORY_IDS];

export function isCafeEventCategory(categoryId: string): boolean {
  return categoryId === EVENT_CATEGORY_IDS.CAFE_EVENT;
}
