import {isSupabaseConfigured, supabase} from '../../config/supabase';

const CHAT_MEDIA_BUCKET = 'chat-media';
const CHAT_MEDIA_SIGNED_URL_SECONDS = 60 * 60;

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

export async function resolveChatMediaUrl(
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

export async function uploadChatImage(params: {
  roomId: string;
  userId: string;
  imageUri: string;
  fileName: string;
  contentType: string;
  now: number;
}): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase 설정이 필요합니다.');
  }

  const response = await fetch(params.imageUri);
  const arrayBuffer = await response.arrayBuffer();
  const storageFileName = sanitizeStorageFileName(params.fileName);
  const storagePath = `${params.roomId}/${params.userId}/${params.now}-${storageFileName}`;

  const {error} = await supabase.storage
    .from(CHAT_MEDIA_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: normalizeImageContentType(params.contentType),
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return storagePath;
}
