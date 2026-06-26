import type {AuthUser, EventRoom, SupportedLanguageCode} from '../../types';

export type ChatMessageRow = {
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

export type EventRoomRow = {
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
  primary_language?: unknown;
  language_codes?: unknown;
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

export type PreviewRoom = EventRoom & {
  entryCode: string;
};

export type MyRooms = {
  createdRooms: EventRoom[];
  joinedRooms: EventRoom[];
};

export type CreateRoomParams = {
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
  primaryLanguage?: SupportedLanguageCode;
  languageCodes?: SupportedLanguageCode[];
  user: AuthUser;
};

export type SendImageMessageParams = {
  roomId: string;
  user: AuthUser;
  imageUri: string;
  fileName: string;
  contentType: string;
};
