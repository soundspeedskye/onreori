import AsyncStorage from '@react-native-async-storage/async-storage';

import {ALERT_MESSAGES} from '../constants/alertMessages';
import {isSupabaseConfigured, supabase} from '../config/supabase';
import type {AuthUser, ChatMessage, EventRoom, RoomStatus} from '../types';
import {KOREAN_EVENT_TIME_ZONE} from '../utils/date';
import {
  EVENT_ROOM_ALWAYS_ACTIVE_FROM_AT,
  EVENT_ROOM_ALWAYS_ACTIVE_UNTIL_AT,
  getEventRoomAvailability,
  isEventRoomActiveAt,
} from '../utils/eventRoomVisibility';
import {extractHashtags} from '../utils/hashtags';
import {createLocalId} from '../utils/localId';

const PREVIEW_ROOMS_KEY = '@onreori/previewRooms';
const PREVIEW_MEMBERS_KEY = '@onreori/previewRoomMembers';
const CHAT_MEDIA_BUCKET = 'chat-media';
const CHAT_MEDIA_SIGNED_URL_SECONDS = 60 * 60;
const TUTORIAL_ROOM_ID_PREFIX = 'tutorial-';
const TUTORIAL_BOT_USER_ID = 'tutorial-bot';
const TUTORIAL_BOT_NICKNAME = '오늘의오리';
const TUTORIAL_WELCOME_BODIES = [
  '안녕하세요! 오늘의오리 입니다.',
  '이 곳은 현장 상황을 자유롭게 공유할 수 있는 단톡방이에요',
];
const TUTORIAL_REPLY_BODIES = [
  '서로 예쁜 말로 소통해요.',
  '현장 정보는 확인한 내용만 차분히 공유해요.',
  '급한 상황일수록 짧고 정확하게 남겨보면 좋아요.',
  '사진이나 위치를 올릴 땐 다른 사람 개인정보가 보이지 않는지 확인해요.',
  '궁금한 점은 편하게 묻고, 아는 정보는 따뜻하게 답해줘요.',
];

type ChatMessageRow = {
  id: unknown;
  room_id: unknown;
  user_id: unknown;
  nickname: unknown;
  type: unknown;
  body: unknown;
  media_url: unknown;
  hashtags: unknown;
  created_at: unknown;
};

type EventRoomRow = {
  id: unknown;
  category_id: unknown;
  title: unknown;
  event_date: unknown;
  location: unknown;
  event_url?: unknown;
  location_name?: unknown;
  address?: unknown;
  road_address?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  subject_name?: unknown;
  status?: unknown;
  event_timezone?: unknown;
  active_from_at?: unknown;
  active_until_at?: unknown;
  closed_at?: unknown;
  deleted_at?: unknown;
  member_count: unknown;
  created_by: unknown;
  created_at: unknown;
};

type RoomMemberWithRoomRow = {
  role: unknown;
  joined_at: unknown;
  event_rooms: EventRoomRow | EventRoomRow[] | null;
};

export type MyRooms = {
  createdRooms: EventRoom[];
  joinedRooms: EventRoom[];
};

const ROOM_SELECT =
  'id, category_id, title, event_date, location, event_url, location_name, address, road_address, latitude, longitude, subject_name, status, event_timezone, active_from_at, active_until_at, closed_at, deleted_at, member_count, created_by, created_at';
const MY_ROOM_SELECT = `role, joined_at, event_rooms (${ROOM_SELECT})`;
const CHAT_MESSAGE_SELECT =
  'id, room_id, user_id, nickname, type, body, media_url, hashtags, created_at';

function nullableString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : (value as string);
}

function nullableNumber(value: unknown): number | undefined {
  return value === null || value === undefined ? undefined : Number(value);
}

function normalizeImageContentType(contentType: string): string {
  return contentType.trim().toLowerCase() === 'image/jpg'
    ? 'image/jpeg'
    : contentType;
}

function sanitizeStorageFileName(fileName: string): string {
  const fallbackName = 'photo.jpg';
  const lastSegment =
    fileName
      .trim()
      .split(/[\\/]/)
      .filter(Boolean)
      .pop() ?? fallbackName;
  const sanitized = lastSegment
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || fallbackName;
}

function isRenderableMediaUri(value: string): boolean {
  return /^(content|data|file|https?):/i.test(value);
}

function getLegacyPublicChatMediaPath(value: string): string | undefined {
  const publicPathMarker = '/storage/v1/object/public/chat-media/';
  const markerIndex = value.indexOf(publicPathMarker);

  if (markerIndex === -1) {
    return undefined;
  }

  const storagePath = value.slice(markerIndex + publicPathMarker.length);

  return storagePath ? decodeURIComponent(storagePath) : undefined;
}

async function resolveChatMediaUrl(
  mediaUrl: string | undefined,
): Promise<string | undefined> {
  if (!mediaUrl || !isSupabaseConfigured || !supabase) {
    return mediaUrl;
  }

  const storagePath = getLegacyPublicChatMediaPath(mediaUrl) ?? mediaUrl;

  if (storagePath === mediaUrl && isRenderableMediaUri(mediaUrl)) {
    return mediaUrl;
  }

  try {
    const {data, error} = await supabase.storage
      .from(CHAT_MEDIA_BUCKET)
      .createSignedUrl(storagePath, CHAT_MEDIA_SIGNED_URL_SECONDS);

    if (error || !data?.signedUrl) {
      return undefined;
    }

    return data.signedUrl;
  } catch {
    return undefined;
  }
}

async function mapChatMessageRow(row: ChatMessageRow): Promise<ChatMessage> {
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

function mapEventRoomRow(row: EventRoomRow): EventRoom {
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

function toPublicPreviewRoom(room: PreviewRoom): EventRoom {
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

type PreviewRoom = EventRoom & {
  entryCode: string;
};

export function isTutorialRoomId(roomId: string): boolean {
  return roomId.startsWith(TUTORIAL_ROOM_ID_PREFIX);
}

function getTutorialRoom(categoryId: string): PreviewRoom {
  return {
    id: `${TUTORIAL_ROOM_ID_PREFIX}${categoryId}`,
    categoryId,
    title: '튜토리얼 단톡방',
    eventDate: '상시',
    location: '오늘의오리 사용법',
    status: 'active',
    eventTimezone: KOREAN_EVENT_TIME_ZONE,
    activeFromAt: EVENT_ROOM_ALWAYS_ACTIVE_FROM_AT,
    activeUntilAt: EVENT_ROOM_ALWAYS_ACTIVE_UNTIL_AT,
    memberCount: 1,
    createdBy: 'tutorial',
    createdAt: '2026-05-22T00:00:00.000Z',
    entryCode: '',
  };
}

export function getTutorialRoomForCategory(categoryId: string): EventRoom {
  return toPublicPreviewRoom(getTutorialRoom(categoryId));
}

function withTutorialRoom(categoryId: string, rooms: EventRoom[]): EventRoom[] {
  const visibleRooms = rooms.filter(room => !isTutorialRoomId(room.id));

  return [...visibleRooms, getTutorialRoomForCategory(categoryId)];
}

function createTutorialBotMessage(
  roomId: string,
  idSuffix: string,
  body: string,
  createdAt: string,
): ChatMessage {
  return {
    id: `${roomId}-${idSuffix}`,
    roomId,
    userId: TUTORIAL_BOT_USER_ID,
    nickname: TUTORIAL_BOT_NICKNAME,
    type: 'text',
    body,
    hashtags: [],
    createdAt,
  };
}

export async function ensureTutorialWelcomeMessages(
  roomId: string,
): Promise<ChatMessage[]> {
  const messages = await readPreviewMessages(roomId);

  if (messages.length > 0) {
    return messages;
  }

  const now = Date.now();
  const welcomeMessages = TUTORIAL_WELCOME_BODIES.map((body, index) =>
    createTutorialBotMessage(
      roomId,
      `welcome-${index + 1}`,
      body,
      new Date(now + index).toISOString(),
    ),
  );

  await writePreviewMessages(roomId, welcomeMessages);
  return welcomeMessages;
}

export async function createTutorialBotReply(
  roomId: string,
): Promise<ChatMessage> {
  const messages = await readPreviewMessages(roomId);
  const replyIndex = Math.min(
    Math.floor(Math.random() * TUTORIAL_REPLY_BODIES.length),
    TUTORIAL_REPLY_BODIES.length - 1,
  );
  const reply = createTutorialBotMessage(
    roomId,
    `reply-${Date.now()}-${replyIndex}`,
    TUTORIAL_REPLY_BODIES[replyIndex],
    new Date().toISOString(),
  );

  await writePreviewMessages(roomId, [...messages, reply]);
  return reply;
}

async function readPreviewRooms(): Promise<PreviewRoom[]> {
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

async function writePreviewRooms(rooms: PreviewRoom[]): Promise<void> {
  await AsyncStorage.setItem(PREVIEW_ROOMS_KEY, JSON.stringify(rooms));
}

async function readPreviewMessages(roomId: string): Promise<ChatMessage[]> {
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

async function writePreviewMessages(
  roomId: string,
  messages: ChatMessage[],
): Promise<void> {
  await AsyncStorage.setItem(
    `@onreori/messages/${roomId}`,
    JSON.stringify(messages),
  );
}

async function readPreviewMembers(): Promise<Record<string, string[]>> {
  const rawValue = await AsyncStorage.getItem(PREVIEW_MEMBERS_KEY);

  return rawValue ? (JSON.parse(rawValue) as Record<string, string[]>) : {};
}

async function addPreviewMember(roomId: string, userId: string): Promise<void> {
  const members = await readPreviewMembers();
  const roomMembers = new Set(members[roomId] ?? []);
  roomMembers.add(userId);
  members[roomId] = Array.from(roomMembers);
  await AsyncStorage.setItem(PREVIEW_MEMBERS_KEY, JSON.stringify(members));
}

async function getPreviewRoom(roomId: string): Promise<PreviewRoom | undefined> {
  const rooms = await readPreviewRooms();

  return rooms.find(item => item.id === roomId);
}

export async function listRoomsByCategory(
  categoryId: string,
): Promise<EventRoom[]> {
  if (!isSupabaseConfigured || !supabase) {
    const nowIso = new Date().toISOString();
    return readPreviewRooms().then(rooms => {
      const categoryRooms = rooms
        .filter(room => room.categoryId === categoryId)
        .filter(room => isEventRoomActiveAt(room, nowIso))
        .map(room => toPublicPreviewRoom(room));

      return withTutorialRoom(categoryId, categoryRooms);
    });
  }

  const {data, error} = await supabase
    .from('event_rooms')
    .select(ROOM_SELECT)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .order('event_date', {ascending: true});

  if (error) {
    return [getTutorialRoomForCategory(categoryId)];
  }

  const rooms = (data ?? []).map(row => mapEventRoomRow(row));

  return withTutorialRoom(categoryId, rooms);
}

function splitMyRooms(rooms: EventRoom[], userId: string): MyRooms {
  const createdRooms: EventRoom[] = [];
  const joinedRooms: EventRoom[] = [];
  const seenRoomIds = new Set<string>();

  rooms.forEach(room => {
    if (seenRoomIds.has(room.id)) {
      return;
    }

    seenRoomIds.add(room.id);

    if (room.createdBy === userId) {
      createdRooms.push(room);
    } else {
      joinedRooms.push(room);
    }
  });

  return {createdRooms, joinedRooms};
}

function getRoomRowFromMemberRow(
  row: RoomMemberWithRoomRow,
): EventRoomRow | undefined {
  if (!row.event_rooms) {
    return undefined;
  }

  return Array.isArray(row.event_rooms)
    ? row.event_rooms[0]
    : row.event_rooms;
}

export async function listMyRooms(user: AuthUser): Promise<MyRooms> {
  if (!isSupabaseConfigured || !supabase) {
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

  const {data, error} = await supabase
    .from('room_members')
    .select(MY_ROOM_SELECT)
    .eq('user_id', user.id)
    .order('joined_at', {ascending: false});

  if (error) {
    throw new Error(error.message);
  }

  const rooms = ((data ?? []) as RoomMemberWithRoomRow[])
    .map(row => getRoomRowFromMemberRow(row))
    .filter((row): row is EventRoomRow => Boolean(row))
    .map(row => mapEventRoomRow(row));

  return splitMyRooms(rooms, user.id);
}

export async function createRoom(params: {
  categoryId: string;
  title: string;
  eventDate: string;
  location: string;
  entryCode: string;
  eventUrl?: string;
  locationName?: string;
  address?: string;
  roadAddress?: string;
  latitude?: number;
  longitude?: number;
  subjectName?: string;
  user: AuthUser;
}): Promise<EventRoom> {
  const now = new Date().toISOString();
  const availability = getEventRoomAvailability({
    eventDate: params.eventDate.trim(),
    activeFromAt: undefined,
    activeUntilAt: undefined,
  });

  if (!isSupabaseConfigured || !supabase) {
    const room: PreviewRoom = {
      id: createLocalId('room'),
      categoryId: params.categoryId,
      title: params.title.trim(),
      eventDate: params.eventDate.trim() || now.slice(0, 10),
      location: params.location.trim() || '장소 미정',
      eventUrl: params.eventUrl,
      locationName: params.locationName,
      address: params.address,
      roadAddress: params.roadAddress,
      latitude: params.latitude,
      longitude: params.longitude,
      subjectName: params.subjectName,
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

  const {data, error} = await supabase.rpc('create_event_room_with_code', {
    input_category_id: params.categoryId,
    input_title: params.title.trim(),
    input_event_date: params.eventDate.trim(),
    input_location: params.location.trim(),
    input_entry_code: params.entryCode,
    input_event_url: params.eventUrl ?? null,
    input_location_name: params.locationName ?? null,
    input_address: params.address ?? null,
    input_road_address: params.roadAddress ?? null,
    input_latitude: params.latitude ?? null,
    input_longitude: params.longitude ?? null,
    input_subject_name: params.subjectName ?? null,
    input_event_timezone: KOREAN_EVENT_TIME_ZONE,
  });

  if (error || !data) {
    throw new Error(error?.message ?? ALERT_MESSAGES.createFailed);
  }

  return mapEventRoomRow(data);
}

export async function joinRoomWithCode(
  roomId: string,
  entryCode: string,
  user: AuthUser,
): Promise<void> {
  if (isTutorialRoomId(roomId)) {
    await addPreviewMember(roomId, user.id);
    return;
  }

  if (!entryCode.trim()) {
    throw new Error(ALERT_MESSAGES.requiredInput);
  }

  if (!isSupabaseConfigured || !supabase) {
    const room = await getPreviewRoom(roomId);

    if (!room || room.entryCode !== entryCode) {
      throw new Error(ALERT_MESSAGES.checkInput);
    }

    if (!isEventRoomActiveAt(room)) {
      throw new Error(ALERT_MESSAGES.unavailable);
    }

    await addPreviewMember(roomId, user.id);
    return;
  }

  const {error} = await supabase.rpc('join_event_room_with_code', {
    input_room_id: roomId,
    input_entry_code: entryCode,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listMessages(roomId: string): Promise<ChatMessage[]> {
  if (isTutorialRoomId(roomId)) {
    return readPreviewMessages(roomId);
  }

  if (!isSupabaseConfigured || !supabase) {
    return readPreviewMessages(roomId);
  }

  const {data, error} = await supabase
    .from('chat_messages')
    .select(CHAT_MESSAGE_SELECT)
    .eq('room_id', roomId)
    .order('created_at', {ascending: true})
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all((data ?? []).map(row => mapChatMessageRow(row)));
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

  const hashtags = extractHashtags(trimmedBody);
  const message: ChatMessage = {
    id: createLocalId('message'),
    roomId,
    userId: user.id,
    nickname: user.nickname,
    type: 'text',
    body: trimmedBody,
    hashtags,
    createdAt: new Date().toISOString(),
  };

  if (isTutorialRoomId(roomId)) {
    const messages = await readPreviewMessages(roomId);
    await writePreviewMessages(roomId, [...messages, message]);
    return message;
  }

  if (!isSupabaseConfigured || !supabase) {
    const room = await getPreviewRoom(roomId);

    if (room && !isEventRoomActiveAt(room)) {
      throw new Error(ALERT_MESSAGES.unavailable);
    }

    const messages = await readPreviewMessages(roomId);
    await writePreviewMessages(roomId, [...messages, message]);
    return message;
  }

  const {data, error} = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      user_id: user.id,
      nickname: user.nickname,
      type: 'text',
      body: trimmedBody,
      hashtags,
    })
    .select(CHAT_MESSAGE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? ALERT_MESSAGES.sendFailed);
  }

  return mapChatMessageRow(data);
}

export async function sendImageMessage(params: {
  roomId: string;
  user: AuthUser;
  imageUri: string;
  fileName: string;
  contentType: string;
}): Promise<ChatMessage> {
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

  if (isTutorialRoomId(params.roomId)) {
    const messages = await readPreviewMessages(params.roomId);
    await writePreviewMessages(params.roomId, [...messages, message]);
    return message;
  }

  if (!isSupabaseConfigured || !supabase) {
    const room = await getPreviewRoom(params.roomId);

    if (room && !isEventRoomActiveAt(room)) {
      throw new Error(ALERT_MESSAGES.unavailable);
    }

    const messages = await readPreviewMessages(params.roomId);
    await writePreviewMessages(params.roomId, [...messages, message]);
    return message;
  }

  const response = await fetch(params.imageUri);
  const arrayBuffer = await response.arrayBuffer();
  const storageFileName = sanitizeStorageFileName(params.fileName);
  const storagePath = `${params.roomId}/${params.user.id}/${now}-${storageFileName}`;

  const {error: uploadError} = await supabase.storage
    .from(CHAT_MEDIA_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: normalizeImageContentType(params.contentType),
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {data, error} = await supabase
    .from('chat_messages')
    .insert({
      room_id: params.roomId,
      user_id: params.user.id,
      nickname: params.user.nickname,
      type: 'image',
      body: '사진',
      media_url: storagePath,
      hashtags: [],
    })
    .select(CHAT_MESSAGE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? ALERT_MESSAGES.sendFailed);
  }

  return mapChatMessageRow(data);
}

export function subscribeToRoomMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void,
): () => void {
  if (isTutorialRoomId(roomId) || !isSupabaseConfigured || !supabase) {
    return () => undefined;
  }

  const client = supabase;
  const channel = client
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      async payload => {
        const row = payload.new as ChatMessageRow;
        onMessage(await mapChatMessageRow(row));
      },
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
