import {isCafeEventCategory} from '../constants/eventCategories';
import type {EventRoom} from '../types';
import {parseUtcDateInput} from './date';

type EventRoomPlaceSource = Pick<
  EventRoom,
  'categoryId' | 'location' | 'subjectName' | 'title'
>;

type EventRoomMetaSource = EventRoomPlaceSource & Pick<EventRoom, 'eventDate'>;

export function getEventRoomPlaceLabel(room: EventRoomPlaceSource): string {
  return isCafeEventCategory(room.categoryId)
    ? room.subjectName ?? room.title
    : room.location;
}

export function formatEventRoomDate(
  eventDate: string,
  locale = 'ko-KR',
): string {
  const date = parseUtcDateInput(eventDate);

  if (!date) {
    return eventDate;
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function getEventRoomMetaLabel(
  room: EventRoomMetaSource,
  locale = 'ko-KR',
): string {
  return `${formatEventRoomDate(room.eventDate, locale)} · ${getEventRoomPlaceLabel(room)}`;
}
