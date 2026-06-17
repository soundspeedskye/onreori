import {isCafeEventCategory} from '../constants/eventCategories';
import type {EventRoom} from '../types';

type EventRoomPlaceSource = Pick<
  EventRoom,
  'categoryId' | 'location' | 'subjectName' | 'title'
>;

type EventRoomMetaSource = EventRoomPlaceSource & Pick<EventRoom, 'eventDate'>;

function parseIsoDateOnly(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date;
}

export function getEventRoomPlaceLabel(room: EventRoomPlaceSource): string {
  return isCafeEventCategory(room.categoryId)
    ? room.subjectName ?? room.title
    : room.location;
}

export function formatEventRoomDate(
  eventDate: string,
  locale = 'ko-KR',
): string {
  const date = parseIsoDateOnly(eventDate);

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
