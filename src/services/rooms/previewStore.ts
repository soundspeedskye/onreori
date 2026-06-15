import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function readPreviewRooms(): Promise<PreviewRoom[]> {
  const rawValue = await AsyncStorage.getItem(PREVIEW_ROOMS_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? (parsedValue as PreviewRoom[]) : [];
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
