import type {ChatMessage, EventRoom} from '../../types';
import {i18n} from '../../i18n';
import {
  type SupportedLanguageCode,
  normalizeLanguageCode,
} from '../../i18n/languages';
import {KOREAN_EVENT_TIME_ZONE} from '../../utils/date';
import {
  EVENT_ROOM_ALWAYS_ACTIVE_FROM_AT,
  EVENT_ROOM_ALWAYS_ACTIVE_UNTIL_AT,
} from '../../utils/eventRoomVisibility';
import type {PreviewRoom} from './contracts';
import {toPublicPreviewRoom} from './mappers';
import {
  addPreviewMember,
  readPreviewMessages,
  writePreviewMessages,
} from './previewStore';

const TUTORIAL_ROOM_ID_PREFIX = 'tutorial-';
const TUTORIAL_BOT_USER_ID = 'tutorial-bot';

export type TutorialRoomCopy = {
  languageCode: SupportedLanguageCode;
  botNickname: string;
  roomTitle: string;
  eventDate: string;
  location: string;
  welcomeBodies: string[];
  replyBodies: string[];
};

export function isTutorialRoomId(roomId: string): boolean {
  return roomId.startsWith(TUTORIAL_ROOM_ID_PREFIX);
}

function getStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function getTutorialRoomCopy(
  languageCode?: SupportedLanguageCode,
): TutorialRoomCopy {
  const normalizedLanguageCode = normalizeLanguageCode(
    languageCode ?? i18n.language,
  );
  const t = i18n.getFixedT(normalizedLanguageCode, 'rooms');
  const welcomeBodies = getStringList(
    t('tutorial.welcomeBodies', {
      returnObjects: true,
    }),
  );
  const replyBodies = getStringList(
    t('tutorial.replyBodies', {
      returnObjects: true,
    }),
  );

  return {
    languageCode: normalizedLanguageCode,
    botNickname: t('tutorial.botNickname'),
    roomTitle: t('tutorial.roomTitle'),
    eventDate: t('tutorial.eventDate'),
    location: t('tutorial.location'),
    welcomeBodies:
      welcomeBodies.length > 0
        ? welcomeBodies
        : [t('tutorialRoomDescription')],
    replyBodies:
      replyBodies.length > 0
        ? replyBodies
        : [t('chatRoomDescription')],
  };
}

function getTutorialRoom(
  categoryId: string,
  copy: TutorialRoomCopy,
): PreviewRoom {
  return {
    id: `${TUTORIAL_ROOM_ID_PREFIX}${categoryId}`,
    categoryId,
    title: copy.roomTitle,
    eventDate: copy.eventDate,
    location: copy.location,
    primaryLanguage: copy.languageCode,
    languageCodes: [copy.languageCode],
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

export function getTutorialRoomForCategory(
  categoryId: string,
  copy: TutorialRoomCopy = getTutorialRoomCopy(),
): EventRoom {
  return toPublicPreviewRoom(getTutorialRoom(categoryId, copy));
}

export function withTutorialRoom(
  categoryId: string,
  rooms: EventRoom[],
  copy: TutorialRoomCopy = getTutorialRoomCopy(),
): EventRoom[] {
  const visibleRooms = rooms.filter(room => !isTutorialRoomId(room.id));

  return [...visibleRooms, getTutorialRoomForCategory(categoryId, copy)];
}

function createTutorialBotMessage(
  roomId: string,
  idSuffix: string,
  body: string,
  createdAt: string,
  copy: TutorialRoomCopy,
): ChatMessage {
  return {
    id: `${roomId}-${idSuffix}`,
    roomId,
    userId: TUTORIAL_BOT_USER_ID,
    nickname: copy.botNickname,
    type: 'text',
    body,
    hashtags: [],
    createdAt,
  };
}

function getResolvedWelcomeBodies(copy: TutorialRoomCopy): string[] {
  return copy.welcomeBodies.length > 0
    ? copy.welcomeBodies
    : getTutorialRoomCopy(copy.languageCode).welcomeBodies;
}

function getResolvedReplyBodies(copy: TutorialRoomCopy): string[] {
  return copy.replyBodies.length > 0
    ? copy.replyBodies
    : getTutorialRoomCopy(copy.languageCode).replyBodies;
}

function getStoredReplyIndex(messageId: string, roomId: string): number | null {
  const replyPrefix = `${roomId}-reply-`;

  if (!messageId.startsWith(replyPrefix)) {
    return null;
  }

  const rawIndex = messageId.slice(replyPrefix.length).split('-').at(-1);
  const replyIndex = Number(rawIndex);

  return Number.isInteger(replyIndex) && replyIndex >= 0 ? replyIndex : null;
}

export async function joinTutorialRoom(
  roomId: string,
  userId: string,
): Promise<void> {
  await addPreviewMember(roomId, userId);
}

export async function ensureTutorialWelcomeMessages(
  roomId: string,
  copy: TutorialRoomCopy = getTutorialRoomCopy(),
): Promise<ChatMessage[]> {
  const messages = await readPreviewMessages(roomId);
  const welcomeBodies = getResolvedWelcomeBodies(copy);
  const replyBodies = getResolvedReplyBodies(copy);
  const now = Date.now();
  const welcomeMessages = welcomeBodies.map((body, index) =>
    createTutorialBotMessage(
      roomId,
      `welcome-${index + 1}`,
      body,
      new Date(now + index).toISOString(),
      copy,
    ),
  );

  if (messages.length > 0) {
    const localizedMessages = messages.map(message => {
      const welcomeIndex = welcomeMessages.findIndex(
        welcomeMessage => welcomeMessage.id === message.id,
      );
      const replyIndex = getStoredReplyIndex(message.id, roomId);

      if (welcomeIndex >= 0) {
        return {...welcomeMessages[welcomeIndex], createdAt: message.createdAt};
      }

      if (
        message.userId === TUTORIAL_BOT_USER_ID &&
        replyIndex !== null &&
        replyIndex < replyBodies.length
      ) {
        return {
          ...message,
          nickname: copy.botNickname,
          body: replyBodies[replyIndex],
        };
      }

      return message;
    });

    await writePreviewMessages(roomId, localizedMessages);
    return localizedMessages;
  }

  await writePreviewMessages(roomId, welcomeMessages);
  return welcomeMessages;
}

export async function createTutorialBotReply(
  roomId: string,
  copy: TutorialRoomCopy = getTutorialRoomCopy(),
): Promise<ChatMessage> {
  const messages = await readPreviewMessages(roomId);
  const replyBodies = getResolvedReplyBodies(copy);
  const replyIndex = Math.min(
    Math.floor(Math.random() * replyBodies.length),
    replyBodies.length - 1,
  );
  const reply = createTutorialBotMessage(
    roomId,
    `reply-${Date.now()}-${replyIndex}`,
    replyBodies[replyIndex],
    new Date().toISOString(),
    copy,
  );

  await writePreviewMessages(roomId, [...messages, reply]);
  return reply;
}
