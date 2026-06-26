import {ALERT_MESSAGES} from '../../constants/alertMessages';
import {supabase} from '../../config/supabase';
import type {AuthUser, ChatMessage, EventRoom} from '../../types';
import {KOREAN_EVENT_TIME_ZONE} from '../../utils/date';
import {
  normalizePrimaryRoomLanguage,
  normalizeRoomLanguageCodes,
} from '../../utils/eventRoomLanguages';
import {
  getRoomCreationActiveWindowMessage,
  isRoomCreationActiveWindowError,
  isRoomCreationDateInputError,
} from '../../utils/eventRoomPolicy';
import {isEventRoomActiveAt} from '../../utils/eventRoomVisibility';
import {extractHashtags} from '../../utils/hashtags';
import type {
  ChatMessageRow,
  CreateRoomParams,
  EventRoomRow,
  MyRooms,
  SendImageMessageParams,
} from './contracts';
import {mapChatMessageRow, mapEventRoomRow} from './mappers';
import {
  CHAT_MESSAGE_SELECT,
  ROOM_SELECT,
} from './selects';
import {splitMyRooms} from './roomCollections';
import {uploadChatImage} from './chatMedia';

function requireSupabase() {
  if (!supabase) {
    throw new Error(ALERT_MESSAGES.supabaseRequired);
  }

  return supabase;
}

async function getRemoteRoom(roomId: string): Promise<EventRoom | undefined> {
  const client = requireSupabase();
  const {data, error} = await client
    .from('event_rooms')
    .select(ROOM_SELECT)
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapEventRoomRow(data) : undefined;
}

async function assertRemoteRoomIsActive(roomId: string): Promise<void> {
  const room = await getRemoteRoom(roomId);

  if (!room || !isEventRoomActiveAt(room)) {
    throw new Error(ALERT_MESSAGES.unavailable);
  }
}

export async function listRemoteRoomsByCategory(
  categoryId: string,
): Promise<EventRoom[]> {
  const client = requireSupabase();
  const nowIso = new Date().toISOString();
  const {data, error} = await client
    .from('event_rooms')
    .select(ROOM_SELECT)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .lte('active_from_at', nowIso)
    .gt('active_until_at', nowIso)
    .order('event_date', {ascending: true});

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(row => mapEventRoomRow(row));
}

export async function listRemoteMyRooms(user: AuthUser): Promise<MyRooms> {
  const client = requireSupabase();
  const [createdRoomsResult, sentMessagesResult] = await Promise.all([
    client
      .from('event_rooms')
      .select(ROOM_SELECT)
      .eq('created_by', user.id)
      .order('event_date', {ascending: false}),
    client.from('chat_messages').select('room_id').eq('user_id', user.id),
  ]);

  if (createdRoomsResult.error) {
    throw new Error(createdRoomsResult.error.message);
  }

  if (sentMessagesResult.error) {
    throw new Error(sentMessagesResult.error.message);
  }

  const sentRoomIds = Array.from(
    new Set(
      ((sentMessagesResult.data ?? []) as Pick<ChatMessageRow, 'room_id'>[])
        .map(row => row.room_id)
        .filter((roomId): roomId is string => typeof roomId === 'string'),
    ),
  );
  const sentRoomsResult =
    sentRoomIds.length > 0
      ? await client
          .from('event_rooms')
          .select(ROOM_SELECT)
          .in('id', sentRoomIds)
      : {data: [], error: null};

  if (sentRoomsResult.error) {
    throw new Error(sentRoomsResult.error.message);
  }

  const roomsById = new Map<string, EventRoom>();

  ((createdRoomsResult.data ?? []) as EventRoomRow[])
    .map(row => mapEventRoomRow(row))
    .forEach(room => {
      roomsById.set(room.id, room);
    });

  ((sentRoomsResult.data ?? []) as EventRoomRow[])
    .map(row => mapEventRoomRow(row))
    .forEach(room => {
      roomsById.set(room.id, room);
    });

  const rooms = Array.from(roomsById.values()).sort(
    (left, right) =>
      right.eventDate.localeCompare(left.eventDate) ||
      right.createdAt.localeCompare(left.createdAt),
  );

  return splitMyRooms(rooms, user.id);
}

export async function createRemoteRoom(
  params: CreateRoomParams,
): Promise<EventRoom> {
  const client = requireSupabase();
  const languageCodes = normalizeRoomLanguageCodes(params.languageCodes);
  const primaryLanguage = normalizePrimaryRoomLanguage(
    params.primaryLanguage,
    languageCodes,
  );
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
    input_primary_language: primaryLanguage,
    input_language_codes: languageCodes,
  });

  if (error || !data) {
    const message = error?.message;
    throw new Error(
      message && isRoomCreationDateInputError(message)
        ? ALERT_MESSAGES.requiredSelection
        : message && isRoomCreationActiveWindowError(message)
        ? getRoomCreationActiveWindowMessage()
        : message ?? ALERT_MESSAGES.createFailed,
    );
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
  await assertRemoteRoomIsActive(roomId);

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
  await assertRemoteRoomIsActive(roomId);

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
  await assertRemoteRoomIsActive(params.roomId);

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
