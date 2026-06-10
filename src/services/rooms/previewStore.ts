import AsyncStorage from '@react-native-async-storage/async-storage';

import type {ChatMessage} from '../../types';
import type {PreviewRoom} from './contracts';

const PREVIEW_ROOMS_KEY = '@onreori/previewRooms';
const PREVIEW_MEMBERS_KEY = '@onreori/previewRoomMembers';

export async function readPreviewRooms(): Promise<PreviewRoom[]> {
  const rawValue = await AsyncStorage.getItem(PREVIEW_ROOMS_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as PreviewRoom[];
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
    return (JSON.parse(rawValue) as ChatMessage[]).map(message => ({
      ...message,
      hashtags: message.hashtags ?? [],
    }));
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

  return rawValue ? (JSON.parse(rawValue) as Record<string, string[]>) : {};
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
