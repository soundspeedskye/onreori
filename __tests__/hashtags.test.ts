import {extractHashtags, filterMessagesByHashtag} from '../src/utils/hashtags';
import type {ChatMessage} from '../src/types';

function message(id: string, body: string, hashtags: string[] = []): ChatMessage {
  return {
    id,
    roomId: 'room-1',
    userId: 'user-1',
    nickname: '테스터',
    type: 'text',
    body,
    hashtags,
    createdAt: '2026-05-21T00:00:00.000Z',
  };
}

test('extracts unique normalized hashtags from Korean cafe messages', () => {
  expect(extractHashtags('#카페무드 특전 있어요 #카페무드 #Hongdae_1')).toEqual([
    '카페무드',
    'Hongdae_1',
  ]);
});

test('filters messages by hashtag with or without leading hash', () => {
  const messages = [
    message('a', '#카페무드 특전 있어요', ['카페무드']),
    message('b', '#홍대커피랩 대기 20분', ['홍대커피랩']),
    message('c', '일반 안내'),
  ];

  expect(filterMessagesByHashtag(messages, '#카페무드').map(item => item.id)).toEqual([
    'a',
  ]);
  expect(filterMessagesByHashtag(messages, '홍대커피랩').map(item => item.id)).toEqual([
    'b',
  ]);
});
