import type {ChatMessage, EventRoom} from '../../types';
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

export function withTutorialRoom(
  categoryId: string,
  rooms: EventRoom[],
): EventRoom[] {
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

export async function joinTutorialRoom(
  roomId: string,
  userId: string,
): Promise<void> {
  await addPreviewMember(roomId, userId);
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
