export const ROOM_SELECT =
  'id, category_id, title, event_date, location, event_url, location_name, address, road_address, latitude, longitude, subject_name, primary_language, language_codes, status, event_timezone, active_from_at, active_until_at, closed_at, deleted_at, member_count, created_by, created_at';

export const MY_ROOM_SELECT = `role, joined_at, event_rooms (${ROOM_SELECT})`;

export const CHAT_MESSAGE_SELECT =
  'id, room_id, user_id, nickname, type, body, media_url, hashtags, created_at';
