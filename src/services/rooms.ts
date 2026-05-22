import AsyncStorage from '@react-native-async-storage/async-storage';

import {isSupabaseConfigured, supabase} from '../config/supabase';
import type {AuthUser, ChatMessage, EventRoom} from '../types';
import {extractHashtags} from '../utils/hashtags';

const PREVIEW_ROOMS_KEY = '@onreori/previewRooms';
const PREVIEW_MEMBERS_KEY = '@onreori/previewRoomMembers';
const CHAT_MEDIA_BUCKET = 'chat-media';
const CHAT_MEDIA_SIGNED_URL_SECONDS = 60 * 60;

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
  member_count: unknown;
  created_by: unknown;
  created_at: unknown;
};

const ROOM_SELECT =
  'id, category_id, title, event_date, location, event_url, location_name, address, road_address, latitude, longitude, subject_name, member_count, created_by, created_at';
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
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    title: row.title as string,
    eventDate: row.event_date as string,
    location: row.location as string,
    eventUrl: nullableString(row.event_url),
    locationName: nullableString(row.location_name),
    address: nullableString(row.address),
    roadAddress: nullableString(row.road_address),
    latitude: nullableNumber(row.latitude),
    longitude: nullableNumber(row.longitude),
    subjectName: nullableString(row.subject_name),
    memberCount: Number(row.member_count ?? 0),
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}

function toPublicPreviewRoom(room: PreviewRoom): EventRoom {
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
    memberCount: room.memberCount,
    createdBy: room.createdBy,
    createdAt: room.createdAt,
  };
}

type PreviewRoom = EventRoom & {
  entryCode: string;
};

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

async function addPreviewMember(roomId: string, userId: string): Promise<void> {
  const rawValue = await AsyncStorage.getItem(PREVIEW_MEMBERS_KEY);
  const members = rawValue
    ? (JSON.parse(rawValue) as Record<string, string[]>)
    : {};
  const roomMembers = new Set(members[roomId] ?? []);
  roomMembers.add(userId);
  members[roomId] = Array.from(roomMembers);
  await AsyncStorage.setItem(PREVIEW_MEMBERS_KEY, JSON.stringify(members));
}

export async function listRoomsByCategory(
  categoryId: string,
): Promise<EventRoom[]> {
  if (!isSupabaseConfigured || !supabase) {
    return readPreviewRooms().then(rooms =>
      rooms
        .filter(room => room.categoryId === categoryId)
        .map(room => toPublicPreviewRoom(room)),
    );
  }

  const {data, error} = await supabase
    .from('event_rooms')
    .select(ROOM_SELECT)
    .eq('category_id', categoryId)
    .order('event_date', {ascending: true});

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(row => mapEventRoomRow(row));
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

  if (!isSupabaseConfigured || !supabase) {
    const room: PreviewRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  });

  if (error || !data) {
    throw new Error(error?.message ?? '방 생성에 실패했습니다.');
  }

  return mapEventRoomRow(data);
}

export async function joinRoomWithCode(
  roomId: string,
  entryCode: string,
  user: AuthUser,
): Promise<void> {
  if (!entryCode.trim()) {
    throw new Error('입장코드를 입력하세요.');
  }

  if (!isSupabaseConfigured || !supabase) {
    const rooms = await readPreviewRooms();
    const room = rooms.find(item => item.id === roomId);

    if (!room || room.entryCode !== entryCode) {
      throw new Error('입장코드가 맞지 않습니다.');
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
    throw new Error('메시지를 입력하세요.');
  }

  const hashtags = extractHashtags(trimmedBody);
  const message: ChatMessage = {
    id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roomId,
    userId: user.id,
    nickname: user.nickname,
    type: 'text',
    body: trimmedBody,
    hashtags,
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase) {
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
    throw new Error(error?.message ?? '메시지를 보내지 못했습니다.');
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

  if (!isSupabaseConfigured || !supabase) {
    const message: ChatMessage = {
      id: `message-${now}-${Math.random().toString(36).slice(2, 8)}`,
      roomId: params.roomId,
      userId: params.user.id,
      nickname: params.user.nickname,
      type: 'image',
      body: '사진',
      mediaUrl: params.imageUri,
      hashtags: [],
      createdAt: new Date().toISOString(),
    };
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
    throw new Error(error?.message ?? '사진 메시지를 보내지 못했습니다.');
  }

  return mapChatMessageRow(data);
}

export function subscribeToRoomMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void,
): () => void {
  if (!isSupabaseConfigured || !supabase) {
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
