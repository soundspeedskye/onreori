import {ALERT_MESSAGES} from '../../constants/alertMessages';
import {i18n} from '../../i18n';
import type {AuthUser, ChatMessage, EventRoom} from '../../types';
import {
  getKoreanEventRoomAvailability,
  KOREAN_EVENT_TIME_ZONE,
  isKoreanEventRoomDateActiveNow,
} from '../../utils/date';
import {
  getEventRoomAvailability,
  isEventRoomActiveAt,
} from '../../utils/eventRoomVisibility';
import {
  normalizePrimaryRoomLanguage,
  normalizeRoomLanguageCodes,
} from '../../utils/eventRoomLanguages';
import {getRoomCreationActiveWindowMessage} from '../../utils/eventRoomPolicy';
import {extractHashtags} from '../../utils/hashtags';
import {createLocalId} from '../../utils/localId';
import type {
  CreateRoomParams,
  MyRooms,
  PreviewRoom,
  SendImageMessageParams,
} from './contracts';
import {toPublicPreviewRoom} from './mappers';
import {
  addPreviewMember,
  getPreviewRoom,
  readPreviewMembers,
  readPreviewMessages,
  readPreviewRooms,
  writePreviewMessages,
  writePreviewRooms,
} from './previewStore';
import {splitMyRooms} from './roomCollections';
import {isTutorialRoomId} from './tutorial';

async function appendPreviewMessage(
  roomId: string,
  message: ChatMessage,
): Promise<void> {
  const messages = await readPreviewMessages(roomId);
  await writePreviewMessages(roomId, [...messages, message]);
}

async function assertPreviewRoomIsActive(roomId: string): Promise<void> {
  if (isTutorialRoomId(roomId)) {
    return;
  }

  const room = await getPreviewRoom(roomId);

  if (!room || !isEventRoomActiveAt(room)) {
    throw new Error(ALERT_MESSAGES.unavailable);
  }
}

export async function listPreviewRoomsByCategory(
  categoryId: string,
): Promise<EventRoom[]> {
  const rooms = await readPreviewRooms();
  const nowIso = new Date().toISOString();

  return rooms
    .filter(room => room.categoryId === categoryId)
    .filter(room => isEventRoomActiveAt(room, nowIso))
    .map(room => toPublicPreviewRoom(room));
}

export async function listPreviewMyRooms(user: AuthUser): Promise<MyRooms> {
  const [rooms, members] = await Promise.all([
    readPreviewRooms(),
    readPreviewMembers(),
  ]);
  const nowIso = new Date().toISOString();
  const myRooms = rooms
    .filter(room => (members[room.id] ?? []).includes(user.id))
    .filter(room => isEventRoomActiveAt(room, nowIso))
    .map(room => toPublicPreviewRoom(room));

  return splitMyRooms(myRooms, user.id);
}

export async function createPreviewRoom(
  params: CreateRoomParams,
): Promise<EventRoom> {
  const now = new Date().toISOString();
  const eventDate = params.eventDate.trim();

  if (!getKoreanEventRoomAvailability(eventDate)) {
    throw new Error(ALERT_MESSAGES.requiredSelection);
  }

  if (!isKoreanEventRoomDateActiveNow(eventDate, now)) {
    throw new Error(getRoomCreationActiveWindowMessage());
  }

  const availability = getEventRoomAvailability({
    eventDate,
    activeFromAt: undefined,
    activeUntilAt: undefined,
  });
  const languageCodes = normalizeRoomLanguageCodes(params.languageCodes);
  const primaryLanguage = normalizePrimaryRoomLanguage(
    params.primaryLanguage,
    languageCodes,
  );
  const room: PreviewRoom = {
    id: createLocalId('room'),
    categoryId: params.categoryId,
    title: params.title.trim(),
    eventDate,
    location: params.location.trim() || i18n.t('unknownPlace', {ns: 'rooms'}),
    eventUrl: params.eventUrl,
    locationName: params.locationName,
    address: params.address,
    roadAddress: params.roadAddress,
    latitude: params.latitude,
    longitude: params.longitude,
    subjectName: params.subjectName,
    primaryLanguage,
    languageCodes,
    status: 'active',
    eventTimezone: KOREAN_EVENT_TIME_ZONE,
    activeFromAt: availability.activeFromAt,
    activeUntilAt: availability.activeUntilAt,
    memberCount: 1,
    createdBy: params.user.id,
    createdAt: now,
    entryCode: params.entryCode,
  };
  const rooms = await readPreviewRooms();
  await writePreviewRooms([room, ...rooms]);
  await addPreviewMember(room.id, params.user.id);

  return toPublicPreviewRoom(room);
}

export async function joinPreviewRoomWithCode(
  roomId: string,
  entryCode: string,
  user: AuthUser,
): Promise<void> {
  const room = await getPreviewRoom(roomId);

  if (!room || room.entryCode !== entryCode) {
    throw new Error(ALERT_MESSAGES.checkInput);
  }

  if (!isEventRoomActiveAt(room)) {
    throw new Error(ALERT_MESSAGES.unavailable);
  }

  await addPreviewMember(roomId, user.id);
}

export async function listPreviewMessages(
  roomId: string,
): Promise<ChatMessage[]> {
  await assertPreviewRoomIsActive(roomId);
  return readPreviewMessages(roomId);
}

export async function sendPreviewTextMessage(
  roomId: string,
  trimmedBody: string,
  user: AuthUser,
): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: createLocalId('message'),
    roomId,
    userId: user.id,
    nickname: user.nickname,
    type: 'text',
    body: trimmedBody,
    hashtags: extractHashtags(trimmedBody),
    createdAt: new Date().toISOString(),
  };

  await assertPreviewRoomIsActive(roomId);
  await appendPreviewMessage(roomId, message);
  return message;
}

export async function sendPreviewImageMessage(
  params: SendImageMessageParams,
): Promise<ChatMessage> {
  const now = Date.now();
  const message: ChatMessage = {
    id: createLocalId('message', now),
    roomId: params.roomId,
    userId: params.user.id,
    nickname: params.user.nickname,
    type: 'image',
    body: '사진',
    mediaUrl: params.imageUri,
    hashtags: [],
    createdAt: new Date().toISOString(),
  };

  await assertPreviewRoomIsActive(params.roomId);
  await appendPreviewMessage(params.roomId, message);
  return message;
}
