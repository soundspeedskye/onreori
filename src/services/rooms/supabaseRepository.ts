import {ALERT_MESSAGES} from '../../constants/alertMessages';
import {supabase} from '../../config/supabase';
import type {AuthUser, ChatMessage, EventRoom} from '../../types';
import {KOREAN_EVENT_TIME_ZONE} from '../../utils/date';
import {extractHashtags} from '../../utils/hashtags';
import type {
  ChatMessageRow,
  CreateRoomParams,
  EventRoomRow,
  MyRooms,
  RoomMemberWithRoomRow,
  SendImageMessageParams,
} from './contracts';
import {
  getRoomRowFromMemberRow,
  mapChatMessageRow,
  mapEventRoomRow,
} from './mappers';
import {
  CHAT_MESSAGE_SELECT,
  MY_ROOM_SELECT,
  ROOM_SELECT,
} from './selects';
import {splitMyRooms} from './roomCollections';
import {uploadChatImage} from './chatMedia';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase 설정이 필요합니다.');
  }

  return supabase;
}

export async function listRemoteRoomsByCategory(
  categoryId: string,
): Promise<EventRoom[]> {
  const client = requireSupabase();
  const {data, error} = await client
    .from('event_rooms')
    .select(ROOM_SELECT)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .order('event_date', {ascending: true});

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(row => mapEventRoomRow(row));
}

export async function listRemoteMyRooms(user: AuthUser): Promise<MyRooms> {
  const client = requireSupabase();
  const {data, error} = await client
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

export async function createRemoteRoom(
  params: CreateRoomParams,
): Promise<EventRoom> {
  const client = requireSupabase();
  const {data, error} = await client.rpc('create_event_room_with_code', {
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

export async function joinRemoteRoomWithCode(
  roomId: string,
  entryCode: string,
): Promise<void> {
  const client = requireSupabase();
  const {error} = await client.rpc('join_event_room_with_code', {
    input_room_id: roomId,
    input_entry_code: entryCode,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listRemoteMessages(
  roomId: string,
): Promise<ChatMessage[]> {
  const client = requireSupabase();
  const {data, error} = await client
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

export async function sendRemoteTextMessage(
  roomId: string,
  trimmedBody: string,
  user: AuthUser,
): Promise<ChatMessage> {
  const client = requireSupabase();
  const hashtags = extractHashtags(trimmedBody);
  const {data, error} = await client
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

export async function sendRemoteImageMessage(
  params: SendImageMessageParams,
): Promise<ChatMessage> {
  const client = requireSupabase();
  const now = Date.now();
  const storagePath = await uploadChatImage({
    roomId: params.roomId,
    userId: params.user.id,
    imageUri: params.imageUri,
    fileName: params.fileName,
    contentType: params.contentType,
    now,
  });

  const {data, error} = await client
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

export function subscribeToRemoteRoomMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void,
): () => void {
  const client = requireSupabase();
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
