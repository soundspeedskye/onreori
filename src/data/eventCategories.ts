import {EVENT_CATEGORY_IDS} from '../constants/eventCategories';
import {i18n} from '../i18n';
import type {EventCategory} from '../types';

type EventCategoryResourceKey = 'eventDay' | 'popup' | 'cafeEvent';

const eventCategoryBase: Array<
  Pick<EventCategory, 'id' | 'icon' | 'templateId'> & {
    resourceKey: EventCategoryResourceKey;
  }
> = [
  {
    id: EVENT_CATEGORY_IDS.EVENT_DAY,
    icon: '🎤',
    templateId: 'concert_basic',
    resourceKey: 'eventDay',
  },
  {
    id: EVENT_CATEGORY_IDS.POPUP,
    icon: '🛍️',
    templateId: 'popup_store_basic',
    resourceKey: 'popup',
  },
  {
    id: EVENT_CATEGORY_IDS.CAFE_EVENT,
    icon: '☕',
    templateId: 'birthday_cafe_basic',
    resourceKey: 'cafeEvent',
  },
];

export function getEventCategories(): EventCategory[] {
  return eventCategoryBase.map(category => ({
    id: category.id,
    icon: category.icon,
    templateId: category.templateId,
    title: i18n.t(`${category.resourceKey}.title`, {ns: 'categories'}),
    description: i18n.t(`${category.resourceKey}.description`, {
      ns: 'categories',
    }),
    roomLabel: i18n.t(`${category.resourceKey}.roomLabel`, {
      ns: 'categories',
    }),
  }));
}

export function getEventCategoryById(
  categoryId: string,
): EventCategory | undefined {
  return getEventCategories().find(category => category.id === categoryId);
}
