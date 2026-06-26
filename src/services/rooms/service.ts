import {ALERT_MESSAGES} from '../../constants/alertMessages';
import {isSupabaseConfigured, supabase} from '../../config/supabase';
import type {AuthUser, ChatMessage, EventRoom} from '../../types';
import type {
  CreateRoomParams,
  MyRooms,
  SendImageMessageParams,
} from './contracts';
import {
  createPreviewRoom,
  joinPreviewRoomWithCode,
  listPreviewMessages,
  listPreviewMyRooms,
  listPreviewRoomsByCategory,
  sendPreviewImageMessage,
  sendPreviewTextMessage,
} from './previewRepository';
import {
  createRemoteRoom,
  joinRemoteRoomWithCode,
  listRemoteMessages,
  listRemoteMyRooms,
  listRemoteRoomsByCategory,
  sendRemoteImageMessage,
  sendRemoteTextMessage,
  subscribeToRemoteRoomMessages,
} from './supabaseRepository';
import {
  type TutorialRoomCopy,
  isTutorialRoomId,
  joinTutorialRoom,
  withTutorialRoom,
} from './tutorial';

function shouldUseRemoteRooms(): boolean {
  return Boolean(isSupabaseConfigured && supabase);
}

export async function listRoomsByCategory(
  categoryId: string,
  tutorialCopy?: TutorialRoomCopy,
): Promise<EventRoom[]> {
  if (!shouldUseRemoteRooms()) {
    const rooms = await listPreviewRoomsByCategory(categoryId);
    return withTutorialRoom(categoryId, rooms, tutorialCopy);
  }

  const rooms = await listRemoteRoomsByCategory(categoryId);
  return withTutorialRoom(categoryId, rooms, tutorialCopy);
}

export async function listLinkableRoomsByCategory(
  categoryId: string,
): Promise<EventRoom[]> {
  if (!shouldUseRemoteRooms()) {
    return listPreviewRoomsByCategory(categoryId);
  }

  return listRemoteRoomsByCategory(categoryId);
}

export async function listMyRooms(user: AuthUser): Promise<MyRooms> {
  if (!shouldUseRemoteRooms()) {
    return listPreviewMyRooms(user);
  }

  return listRemoteMyRooms(user);
}

export async function createRoom(
  params: CreateRoomParams,
): Promise<EventRoom> {
  if (!shouldUseRemoteRooms()) {
    return createPreviewRoom(params);
  }

  return createRemoteRoom(params);
}

export async function joinRoomWithCode(
  roomId: string,
  entryCode: string,
  user: AuthUser,
): Promise<void> {
  if (isTutorialRoomId(roomId)) {
    await joinTutorialRoom(roomId, user.id);
    return;
  }

  if (!entryCode.trim()) {
    throw new Error(ALERT_MESSAGES.requiredInput);
  }

  if (!shouldUseRemoteRooms()) {
    return joinPreviewRoomWithCode(roomId, entryCode, user);
  }

  return joinRemoteRoomWithCode(roomId, entryCode);
}

export async function listMessages(roomId: string): Promise<ChatMessage[]> {
  if (isTutorialRoomId(roomId) || !shouldUseRemoteRooms()) {
    return listPreviewMessages(roomId);
  }

  return listRemoteMessages(roomId);
}

export async function sendTextMessage(
  roomId: string,
  body: string,
  user: AuthUser,
): Promise<ChatMessage> {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error(ALERT_MESSAGES.requiredInput);
  }

  if (isTutorialRoomId(roomId) || !shouldUseRemoteRooms()) {
    return sendPreviewTextMessage(roomId, trimmedBody, user);
  }

  return sendRemoteTextMessage(roomId, trimmedBody, user);
}

export async function sendImageMessage(
  params: SendImageMessageParams,
): Promise<ChatMessage> {
  if (isTutorialRoomId(params.roomId) || !shouldUseRemoteRooms()) {
    return sendPreviewImageMessage(params);
  }

  return sendRemoteImageMessage(params);
}

export function subscribeToRoomMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void,
): () => void {
  if (isTutorialRoomId(roomId) || !shouldUseRemoteRooms()) {
    return () => undefined;
  }

  return subscribeToRemoteRoomMessages(roomId, onMessage);
}
