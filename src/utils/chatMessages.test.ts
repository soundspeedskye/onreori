import type {ChatMessage} from '../types';
import {
  formatChatMessageDate,
  formatChatMessageTime,
  getChatMessagePresentation,
} from './chatMessages';

const baseMessage: ChatMessage = {
  id: 'message-1',
  roomId: 'room-1',
  userId: 'user-1',
  nickname: 'Tester',
  type: 'text',
  body: 'hello',
  hashtags: [],
  createdAt: '2026-06-16T12:00:00.000Z',
};

describe('chat message locale formatting', () => {
  it('formats date labels with the provided locale', () => {
    expect(formatChatMessageDate(baseMessage.createdAt, 'en-US')).toContain(
      'June',
    );
  });

  it('formats time labels with the provided locale', () => {
    expect(formatChatMessageTime(baseMessage.createdAt, 'en-US')).toMatch(
      /\b(?:AM|PM)\b/,
    );
  });

  it('uses the provided locale when building message presentation', () => {
    const presentation = getChatMessagePresentation(
      [baseMessage],
      0,
      'user-2',
      'en-US',
    );

    expect(presentation.dateLabel).toContain('June');
  });
});
