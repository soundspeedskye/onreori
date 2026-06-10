import type {ChatMessage, EventRoom, RoomStatus} from '../../types';
import {KOREAN_EVENT_TIME_ZONE} from '../../utils/date';
import {getEventRoomAvailability} from '../../utils/eventRoomVisibility';
import type {
  ChatMessageRow,
  EventRoomRow,
  PreviewRoom,
  RoomMemberWithRoomRow,
} from './contracts';
import {resolveChatMediaUrl} from './chatMedia';

function nullableString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : (value as string);
}

function nullableNumber(value: unknown): number | undefined {
  return value === null || value === undefined ? undefined : Number(value);
}

export async function mapChatMessageRow(
  row: ChatMessageRow,
): Promise<ChatMessage> {
  const type = row.type as 'text' | 'image';
  const mediaUrl =
    type === 'image'
      ? await resolveChatMediaUrl(row.media_url as string | undefined)
      : (row.media_url as string | undefined);

  return {
    id: row.id as string,
    roomId: row.room_id as string,
    userId: row.user_id as string,
    nickname: row.nickname as string,
    type,
    body: row.body as string,
    mediaUrl,
    hashtags: Array.isArray(row.hashtags) ? (row.hashtags as string[]) : [],
    createdAt: row.created_at as string,
  };
}

export function mapEventRoomRow(row: EventRoomRow): EventRoom {
  const eventDate = row.event_date as string;
  const activeFromAt = nullableString(row.active_from_at);
  const activeUntilAt = nullableString(row.active_until_at);
  const availability = getEventRoomAvailability({
    eventDate,
    activeFromAt,
    activeUntilAt,
  });

  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    title: row.title as string,
    eventDate,
    location: row.location as string,
    eventUrl: nullableString(row.event_url),
    locationName: nullableString(row.location_name),
    address: nullableString(row.address),
    roadAddress: nullableString(row.road_address),
    latitude: nullableNumber(row.latitude),
    longitude: nullableNumber(row.longitude),
    subjectName: nullableString(row.subject_name),
    status: (row.status as RoomStatus | undefined) ?? 'active',
    eventTimezone:
      nullableString(row.event_timezone) ??
      KOREAN_EVENT_TIME_ZONE,
    activeFromAt: availability.activeFromAt,
    activeUntilAt: availability.activeUntilAt,
    closedAt: nullableString(row.closed_at),
    deletedAt: nullableString(row.deleted_at),
    memberCount: Number(row.member_count ?? 0),
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}

export function toPublicPreviewRoom(room: PreviewRoom): EventRoom {
  const availability = getEventRoomAvailability(room);

  return {
    id: room.id,
    categoryId: room.categoryId,
    title: room.title,
    eventDate: room.eventDate,
    location: room.location,
    eventUrl: room.eventUrl,
    locationName: room.locationName,
    address: room.address,
    roadAddress: room.roadAddress,
    latitude: room.latitude,
    longitude: room.longitude,
    subjectName: room.subjectName,
    status: room.status ?? 'active',
    eventTimezone:
      room.eventTimezone ?? KOREAN_EVENT_TIME_ZONE,
    activeFromAt: availability.activeFromAt,
    activeUntilAt: availability.activeUntilAt,
    closedAt: room.closedAt,
    deletedAt: room.deletedAt,
    memberCount: room.memberCount,
    createdBy: room.createdBy,
    createdAt: room.createdAt,
  };
}

export function getRoomRowFromMemberRow(
  row: RoomMemberWithRoomRow,
): EventRoomRow | undefined {
  if (!row.event_rooms) {
    return undefined;
  }

  return Array.isArray(row.event_rooms)
    ? row.event_rooms[0]
    : row.event_rooms;
}
