import {
  EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT,
  EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT,
} from './date';

export function getRoomCreationActiveWindowMessage(): string {
  return `단톡방은 이벤트 ${EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT}일 전부터 ${EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT}일 후까지만 만들 수 있습니다.`;
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
