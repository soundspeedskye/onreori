import AsyncStorage from '@react-native-async-storage/async-storage';

import {isSupabaseConfigured, supabase} from '../config/supabase';
import type {AuthUser, ChatMessage, EventRoom} from '../types';

const PREVIEW_ROOMS_KEY = '@onreori/previewRooms';
const PREVIEW_MEMBERS_KEY = '@onreori/previewRoomMembers';

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
    return JSON.parse(rawValue) as ChatMessage[];
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
        .map(room => ({
          id: room.id,
          categoryId: room.categoryId,
          title: room.title,
          eventDate: room.eventDate,
          location: room.location,
          memberCount: room.memberCount,
          createdBy: room.createdBy,
          createdAt: room.createdAt,
        })),
    );
  }

  const {data, error} = await supabase
    .from('event_rooms')
    .select(
      'id, category_id, title, event_date, location, member_count, created_by, created_at',
    )
    .eq('category_id', categoryId)
    .order('event_date', {ascending: true});

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(row => ({
    id: row.id as string,
    categoryId: row.category_id as string,
    title: row.title as string,
    eventDate: row.event_date as string,
    location: row.location as string,
    memberCount: Number(row.member_count ?? 0),
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  }));
}

export async function createRoom(params: {
  categoryId: string;
  title: string;
  eventDate: string;
  location: string;
  entryCode: string;
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
      memberCount: 1,
      createdBy: params.user.id,
      createdAt: now,
      entryCode: params.entryCode,
    };
    const rooms = await readPreviewRooms();
    await writePreviewRooms([room, ...rooms]);
    await addPreviewMember(room.id, params.user.id);

    return {
      id: room.id,
      categoryId: room.categoryId,
      title: room.title,
      eventDate: room.eventDate,
      location: room.location,
      memberCount: room.memberCount,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
    };
  }

  const {data, error} = await supabase.rpc('create_event_room_with_code', {
    input_category_id: params.categoryId,
    input_title: params.title.trim(),
    input_event_date: params.eventDate.trim(),
    input_location: params.location.trim(),
    input_entry_code: params.entryCode,
  });

  if (error || !data) {
    throw new Error(error?.message ?? '방 생성에 실패했습니다.');
  }

  return {
    id: data.id as string,
    categoryId: data.category_id as string,
    title: data.title as string,
    eventDate: data.event_date as string,
    location: data.location as string,
    memberCount: Number(data.member_count ?? 1),
    createdBy: data.created_by as string,
    createdAt: data.created_at as string,
  };
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
    .select('id, room_id, user_id, nickname, type, body, media_url, created_at')
    .eq('room_id', roomId)
    .order('created_at', {ascending: true})
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(row => ({
    id: row.id as string,
    roomId: row.room_id as string,
    userId: row.user_id as string,
    nickname: row.nickname as string,
    type: row.type as 'text' | 'image',
    body: row.body as string,
    mediaUrl: row.media_url as string | undefined,
    createdAt: row.created_at as string,
  }));
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

  const message: ChatMessage = {
    id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roomId,
    userId: user.id,
    nickname: user.nickname,
    type: 'text',
    body: trimmedBody,
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
    })
    .select('id, room_id, user_id, nickname, type, body, media_url, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? '메시지를 보내지 못했습니다.');
  }

  return {
    id: data.id as string,
    roomId: data.room_id as string,
    userId: data.user_id as string,
    nickname: data.nickname as string,
    type: data.type as 'text',
    body: data.body as string,
    mediaUrl: data.media_url as string | undefined,
    createdAt: data.created_at as string,
  };
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
      createdAt: new Date().toISOString(),
    };
    const messages = await readPreviewMessages(params.roomId);
    await writePreviewMessages(params.roomId, [...messages, message]);
    return message;
  }

  const response = await fetch(params.imageUri);
  const arrayBuffer = await response.arrayBuffer();
  const storagePath = `${params.roomId}/${params.user.id}/${now}-${params.fileName}`;

  const {error: uploadError} = await supabase.storage
    .from('chat-media')
    .upload(storagePath, arrayBuffer, {
      contentType: params.contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {data: publicUrlData} = supabase.storage
    .from('chat-media')
    .getPublicUrl(storagePath);

  const {data, error} = await supabase
    .from('chat_messages')
    .insert({
      room_id: params.roomId,
      user_id: params.user.id,
      nickname: params.user.nickname,
      type: 'image',
      body: '사진',
      media_url: publicUrlData.publicUrl,
    })
    .select('id, room_id, user_id, nickname, type, body, media_url, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? '사진 메시지를 보내지 못했습니다.');
  }

  return {
    id: data.id as string,
    roomId: data.room_id as string,
    userId: data.user_id as string,
    nickname: data.nickname as string,
    type: data.type as 'image',
    body: data.body as string,
    mediaUrl: data.media_url as string | undefined,
    createdAt: data.created_at as string,
  };
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
      payload => {
        const row = payload.new as Record<string, unknown>;
        onMessage({
          id: row.id as string,
          roomId: row.room_id as string,
          userId: row.user_id as string,
          nickname: row.nickname as string,
          type: row.type as 'text' | 'image',
          body: row.body as string,
          mediaUrl: row.media_url as string | undefined,
          createdAt: row.created_at as string,
        });
      },
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
