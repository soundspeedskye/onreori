import type {ChatMessage} from '../../types';
import type {TutorialRoomCopy} from './tutorial';
import {
  ensureTutorialWelcomeMessages,
  getTutorialRoomForCategory,
} from './tutorial';
import {readPreviewMessages, writePreviewMessages} from './previewStore';

jest.mock('./mappers', () => ({
  toPublicPreviewRoom: (room: unknown) => room,
}));

jest.mock('./previewStore', () => ({
  addPreviewMember: jest.fn(),
  readPreviewMessages: jest.fn(),
  writePreviewMessages: jest.fn(),
}));

const tutorialCopy: TutorialRoomCopy = {
  languageCode: 'en',
  botNickname: 'Today Duck',
  roomTitle: 'Tutorial room',
  eventDate: 'Always on',
  location: 'How to use Onreori',
  welcomeBodies: ['Welcome'],
  replyBodies: ['Be kind'],
};

const readPreviewMessagesMock = readPreviewMessages as jest.MockedFunction<
  typeof readPreviewMessages
>;
const writePreviewMessagesMock = writePreviewMessages as jest.MockedFunction<
  typeof writePreviewMessages
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tutorial room localization', () => {
  it('uses provided copy for public tutorial room fields', () => {
    const room = getTutorialRoomForCategory('EVENT_DAY', tutorialCopy);

    expect(room.title).toBe('Tutorial room');
    expect(room.eventDate).toBe('Always on');
    expect(room.location).toBe('How to use Onreori');
    expect(room.primaryLanguage).toBe('en');
    expect(room.languageCodes).toEqual(['en']);
  });

  it('localizes existing tutorial bot replies when refreshing welcome messages', async () => {
    const roomId = 'tutorial-EVENT_DAY';
    const existingMessages: ChatMessage[] = [
      {
        id: `${roomId}-welcome-1`,
        roomId,
        userId: 'tutorial-bot',
        nickname: '오늘의오리',
        type: 'text',
        body: '안녕하세요! 오늘의오리 입니다.',
        hashtags: [],
        createdAt: '2026-06-16T00:00:00.000Z',
      },
      {
        id: `${roomId}-reply-1234567890-0`,
        roomId,
        userId: 'tutorial-bot',
        nickname: '오늘의오리',
        type: 'text',
        body: '서로 예쁜 말로 소통해요.',
        hashtags: [],
        createdAt: '2026-06-16T00:00:01.000Z',
      },
      {
        id: `${roomId}-user-1`,
        roomId,
        userId: 'user-1',
        nickname: 'User',
        type: 'text',
        body: '안녕하세요',
        hashtags: [],
        createdAt: '2026-06-16T00:00:02.000Z',
      },
    ];
    readPreviewMessagesMock.mockResolvedValue(existingMessages);

    const messages = await ensureTutorialWelcomeMessages(roomId, tutorialCopy);

    expect(messages[0]).toMatchObject({
      id: `${roomId}-welcome-1`,
      nickname: 'Today Duck',
      body: 'Welcome',
      createdAt: '2026-06-16T00:00:00.000Z',
    });
    expect(messages[1]).toMatchObject({
      id: `${roomId}-reply-1234567890-0`,
      nickname: 'Today Duck',
      body: 'Be kind',
      createdAt: '2026-06-16T00:00:01.000Z',
    });
    expect(messages[2]).toBe(existingMessages[2]);
    expect(writePreviewMessagesMock).toHaveBeenCalledWith(roomId, messages);
  });
});
