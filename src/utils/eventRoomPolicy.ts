import {i18n} from '../i18n';
import {
  EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT,
  EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT,
} from './date';

export function getRoomCreationActiveWindowMessage(): string {
  return i18n.t('activeWindow', {
    afterCount: EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT,
    beforeCount: EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT,
    ns: 'rooms',
  });
}

export function isRoomCreationActiveWindowError(message: string): boolean {
  return message.includes('room can only be created during active window');
}

export function isRoomCreationDateInputError(message: string): boolean {
  return (
    message.includes('event date required') ||
    message.includes('date/time field value out of range')
  );
}
