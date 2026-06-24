import { EVENT_CATEGORY_IDS } from '../constants/eventCategories';
import ko from '../i18n/locales/ko.json';
import type { EventCategory } from '../types';

type EventCategoryResourceKey = 'eventDay' | 'popup' | 'cafeEvent';
type EventCategoryResource = {
  title: string;
  description: string;
  roomLabel: string;
};

const categoryResources = ko.categories as Record<
  EventCategoryResourceKey,
  EventCategoryResource
>;

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
  return eventCategoryBase.map(category => {
    const resource = categoryResources[category.resourceKey];

    return {
      id: category.id,
      icon: category.icon,
      templateId: category.templateId,
      title: resource.title,
      description: resource.description,
      roomLabel: resource.roomLabel,
    };
  });
}

export function getEventCategoryById(
  categoryId: string,
): EventCategory | undefined {
  return getEventCategories().find(category => category.id === categoryId);
}
