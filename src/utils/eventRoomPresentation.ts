import {isCafeEventCategory} from '../constants/eventCategories';
import type {EventRoom} from '../types';

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

export function getEventRoomMetaLabel(room: EventRoomMetaSource): string {
  return `${room.eventDate} · ${getEventRoomPlaceLabel(room)}`;
}
