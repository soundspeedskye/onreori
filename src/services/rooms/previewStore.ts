import AsyncStorage from '@react-native-async-storage/async-storage';

import {KOREAN_EVENT_TIME_ZONE} from '../../utils/date';
import {
  normalizePrimaryRoomLanguage,
  normalizeRoomLanguageCodes,
} from '../../utils/eventRoomLanguages';
import {getEventRoomAvailability} from '../../utils/eventRoomVisibility';
import type {ChatMessage} from '../../types';
import type {PreviewRoom} from './contracts';

const PREVIEW_ROOMS_KEY = '@onreori/previewRooms';
const PREVIEW_MEMBERS_KEY = '@onreori/previewRoomMembers';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function normalizePreviewMembers(
  value: unknown,
): Record<string, string[]> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string[]>>(
    (members, [roomId, userIds]) => {
      if (!Array.isArray(userIds)) {
        return members;
      }

      const normalizedUserIds = userIds.filter(
        (userId): userId is string => typeof userId === 'string',
      );

      if (normalizedUserIds.length > 0) {
        members[roomId] = normalizedUserIds;
      }

      return members;
    },
    {},
  );
}

function normalizePreviewMessage(
  value: unknown,
  roomId: string,
): ChatMessage | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const messageRoomId = getString(value.roomId);
  const userId = getString(value.userId);
  const nickname = getString(value.nickname);
  const body = getString(value.body);
  const createdAt = getString(value.createdAt);
  const type =
    value.type === 'text' || value.type === 'image' ? value.type : undefined;

  if (
    !id ||
    messageRoomId !== roomId ||
    !userId ||
    !nickname ||
    !type ||
    !body ||
    !createdAt
  ) {
    return null;
  }

  const mediaUrl = getString(value.mediaUrl);

  return {
    id,
    roomId: messageRoomId,
    userId,
    nickname,
    type,
    body,
    ...(mediaUrl ? {mediaUrl} : {}),
    hashtags: getStringArray(value.hashtags),
    createdAt,
  };
}

function normalizePreviewRoom(value: unknown): PreviewRoom | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const categoryId = getString(value.categoryId);
  const title = getString(value.title);
  const eventDate = getString(value.eventDate);
  const location = getString(value.location);
  const createdBy = getString(value.createdBy);
  const createdAt = getString(value.createdAt);

  if (
    !id ||
    !categoryId ||
    !title ||
    !eventDate ||
    !location ||
    !createdBy ||
    !createdAt
  ) {
    return null;
  }

  const languageCodes = normalizeRoomLanguageCodes(value.languageCodes);
  const availability = getEventRoomAvailability({
    eventDate,
    activeFromAt: getString(value.activeFromAt),
    activeUntilAt: getString(value.activeUntilAt),
  });

  return {
    ...(value as PreviewRoom),
    id,
    categoryId,
    title,
    eventDate,
    location,
    primaryLanguage: normalizePrimaryRoomLanguage(
      value.primaryLanguage,
      languageCodes,
    ),
    languageCodes,
    status:
      value.status === 'closed' || value.status === 'soft_deleted'
        ? value.status
        : 'active',
    eventTimezone: getString(value.eventTimezone) ?? KOREAN_EVENT_TIME_ZONE,
    activeFromAt: availability.activeFromAt,
    activeUntilAt: availability.activeUntilAt,
    memberCount:
      typeof value.memberCount === 'number'
        ? value.memberCount
        : Number(value.memberCount ?? 0),
    createdBy,
    createdAt,
    entryCode: typeof value.entryCode === 'string' ? value.entryCode : '',
  };
}

export async function readPreviewRooms(): Promise<PreviewRoom[]> {
  const rawValue = await AsyncStorage.getItem(PREVIEW_ROOMS_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap(room => {
      const normalizedRoom = normalizePreviewRoom(room);

      return normalizedRoom ? [normalizedRoom] : [];
    });
  } catch {
    return [];
  }
}

export async function writePreviewRooms(
  rooms: PreviewRoom[],
): Promise<void> {
  await AsyncStorage.setItem(PREVIEW_ROOMS_KEY, JSON.stringify(rooms));
}

export async function readPreviewMessages(
  roomId: string,
): Promise<ChatMessage[]> {
  const rawValue = await AsyncStorage.getItem(`@onreori/messages/${roomId}`);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap(message => {
      const normalizedMessage = normalizePreviewMessage(message, roomId);

      return normalizedMessage ? [normalizedMessage] : [];
    });
  } catch {
    return [];
  }
}

export async function writePreviewMessages(
  roomId: string,
  messages: ChatMessage[],
): Promise<void> {
  await AsyncStorage.setItem(
    `@onreori/messages/${roomId}`,
    JSON.stringify(messages),
  );
}

export async function readPreviewMembers(): Promise<Record<string, string[]>> {
  const rawValue = await AsyncStorage.getItem(PREVIEW_MEMBERS_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    return normalizePreviewMembers(JSON.parse(rawValue));
  } catch {
    return {};
  }
}

export async function addPreviewMember(
  roomId: string,
  userId: string,
): Promise<void> {
  const members = await readPreviewMembers();
  const roomMembers = new Set(members[roomId] ?? []);
  roomMembers.add(userId);
  members[roomId] = Array.from(roomMembers);
  await AsyncStorage.setItem(PREVIEW_MEMBERS_KEY, JSON.stringify(members));
}

export async function getPreviewRoom(
  roomId: string,
): Promise<PreviewRoom | undefined> {
  const rooms = await readPreviewRooms();

  return rooms.find(item => item.id === roomId);
}
