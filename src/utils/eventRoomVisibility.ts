import type {EventRoom} from '../types';
import {getKoreanEventRoomAvailability} from './date';

export const EVENT_ROOM_ALWAYS_ACTIVE_FROM_AT = '1970-01-01T00:00:00.000Z';
export const EVENT_ROOM_ALWAYS_ACTIVE_UNTIL_AT = '9999-12-31T23:59:59.999Z';

type EventRoomAvailabilitySource = Pick<EventRoom, 'eventDate'> &
  Partial<Pick<EventRoom, 'activeFromAt' | 'activeUntilAt'>>;

export function getEventRoomAvailability(room: EventRoomAvailabilitySource): {
  activeFromAt: string;
  activeUntilAt: string;
} {
  const calculatedAvailability = getKoreanEventRoomAvailability(room.eventDate);

  return {
    activeFromAt:
      room.activeFromAt ??
      calculatedAvailability?.activeFromAt ??
      EVENT_ROOM_ALWAYS_ACTIVE_FROM_AT,
    activeUntilAt:
      room.activeUntilAt ??
      calculatedAvailability?.activeUntilAt ??
      EVENT_ROOM_ALWAYS_ACTIVE_UNTIL_AT,
  };
}

export function isEventRoomActiveAt(
  room: Pick<EventRoom, 'eventDate' | 'status'> &
    Partial<Pick<EventRoom, 'activeFromAt' | 'activeUntilAt'>>,
  nowIso = new Date().toISOString(),
): boolean {
  if ((room.status ?? 'active') !== 'active') {
    return false;
  }

  const availability = getEventRoomAvailability(room);

  return (
    availability.activeFromAt <= nowIso && nowIso < availability.activeUntilAt
  );
}

export function shouldShowRoomInTodayList(
  room: EventRoom,
  nowIso = new Date().toISOString(),
): boolean {
  return isEventRoomActiveAt(room, nowIso);
}
