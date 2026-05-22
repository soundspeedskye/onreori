import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import type {AuthUser, ChatMessage} from '../src/types';

const mockUseAuth = jest.fn<{user: AuthUser | null}, []>(() => ({user: null}));
const mockListMessages = jest.fn<Promise<ChatMessage[]>, [string]>();
const mockSendImageMessage = jest.fn();
const mockSendTextMessage = jest.fn();
const mockSubscribeToRoomMessages = jest.fn<
  () => void,
  [string, (message: ChatMessage) => void]
>(() => jest.fn());

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../src/services/rooms', () => ({
  listMessages: (roomId: string) => mockListMessages(roomId),
  sendImageMessage: (params: unknown) => mockSendImageMessage(params),
  sendTextMessage: (roomId: string, body: string, user: AuthUser) =>
    mockSendTextMessage(roomId, body, user),
  subscribeToRoomMessages: (
    roomId: string,
    callback: (message: ChatMessage) => void,
  ) => mockSubscribeToRoomMessages(roomId, callback),
}));

import {
  appendRealtimeMessageIfActive,
  getChatMessagePresentation,
  getVisibleMessagesForHashtagFilter,
  mergeMessagesByCreatedAt,
  mergeRoomMessagesByCreatedAt,
  RoomChatScreen,
} from '../src/screens/RoomChatScreen';

function makeMessage(
  id: string,
  createdAt: string,
  userId = 'user-1',
  nickname = '테스터',
): ChatMessage {
  return {
    id,
    roomId: 'room-1',
    userId,
    nickname,
    type: 'text',
    body: id,
    createdAt,
  };
}

function collectText(node: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  if (typeof node === 'string') {
    return [node];
  }

  if (!node || typeof node !== 'object') {
    return [];
  }

  const children = (node as {children?: unknown[]}).children ?? [];
  return children.flatMap(collectText);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('merges messages by id and keeps createdAt order', () => {
  const first = makeMessage('first', '2026-05-20T00:00:00.000Z');
  const second = makeMessage('second', '2026-05-20T00:00:01.000Z');
  const duplicateSecond = {
    ...second,
    body: 'updated signed url result',
  };

  expect(mergeMessagesByCreatedAt([second], first, duplicateSecond)).toEqual([
    first,
    second,
  ]);
});

test('refreshes duplicate image messages when a signed media URL arrives later', () => {
  const degraded: ChatMessage = {
    ...makeMessage('image', '2026-05-20T00:00:00.000Z'),
    type: 'image',
    mediaUrl: undefined,
  };
  const hydrated: ChatMessage = {
    ...degraded,
    mediaUrl: 'https://example.supabase.co/signed/image.jpg',
  };

  expect(mergeMessagesByCreatedAt([degraded], hydrated)).toEqual([hydrated]);
});

test('merges only messages for the active room', () => {
  const staleRoomMessage = {
    ...makeMessage('stale', '2026-05-20T00:00:00.000Z'),
    roomId: 'room-2',
  };
  const realtimeBeforeLoad = {
    ...makeMessage('realtime', '2026-05-20T00:00:02.000Z'),
    roomId: 'room-1',
  };
  const loadedMessage = {
    ...makeMessage('loaded', '2026-05-20T00:00:01.000Z'),
    roomId: 'room-1',
  };

  expect(
    mergeRoomMessagesByCreatedAt(
      'room-1',
      [staleRoomMessage, realtimeBeforeLoad],
      loadedMessage,
    ),
  ).toEqual([loadedMessage, realtimeBeforeLoad]);
});

test('ignores realtime messages after the screen becomes inactive', () => {
  const updateMessages = jest.fn();

  appendRealtimeMessageIfActive(
    false,
    updateMessages,
    makeMessage('late', '2026-05-20T00:00:00.000Z'),
  );

  expect(updateMessages).not.toHaveBeenCalled();
});

test('shows chat nickname and time only when author or minute changes', () => {
  const messages = [
    makeMessage('first', '2026-05-20T05:18:00.000Z', 'user-2', '별빛민'),
    makeMessage('second', '2026-05-20T05:18:30.000Z', 'user-2', '별빛민'),
    makeMessage('third', '2026-05-20T05:19:00.000Z', 'user-2', '별빛민'),
    makeMessage('mine-first', '2026-05-20T05:19:20.000Z', 'user-1', '나'),
    makeMessage('mine-second', '2026-05-20T05:19:45.000Z', 'user-1', '나'),
    makeMessage('mine-third', '2026-05-20T05:20:00.000Z', 'user-1', '나'),
    makeMessage('other-again', '2026-05-20T05:20:15.000Z', 'user-2', '별빛민'),
  ];

  expect(
    messages.map((_message, index) => {
      const presentation = getChatMessagePresentation(
        messages,
        index,
        'user-1',
      );

      return {
        showNickname: presentation.showNickname,
        showTime: presentation.showTime,
      };
    }),
  ).toEqual([
    {showNickname: true, showTime: true},
    {showNickname: false, showTime: false},
    {showNickname: false, showTime: true},
    {showNickname: false, showTime: true},
    {showNickname: false, showTime: false},
    {showNickname: false, showTime: true},
    {showNickname: true, showTime: true},
  ]);
});

test('filters visible chat messages by hashtag filter', () => {
  const cafeMood = {
    ...makeMessage('mood', '2026-05-20T00:00:00.000Z'),
    body: '#카페무드 특전 있어요',
    hashtags: ['카페무드'],
  };
  const coffeeLab = {
    ...makeMessage('lab', '2026-05-20T00:00:01.000Z'),
    body: '#홍대커피랩 대기 20분',
    hashtags: ['홍대커피랩'],
  };

  expect(
    getVisibleMessagesForHashtagFilter([cafeMood, coffeeLab], '#카페무드').map(
      item => item.id,
    ),
  ).toEqual(['mood']);
  expect(
    getVisibleMessagesForHashtagFilter([cafeMood, coffeeLab], '   '),
  ).toEqual([cafeMood, coffeeLab]);
});

test('filters room chat messages by hashtag and clears the filter', async () => {
  const cafeMood = {
    ...makeMessage('mood', '2026-05-20T00:00:00.000Z', 'user-2', '별빛민'),
    body: '#카페무드 특전 있어요',
    hashtags: ['카페무드'],
  };
  const coffeeLab = {
    ...makeMessage('lab', '2026-05-20T00:00:01.000Z', 'user-3', '달빛진'),
    body: '#홍대커피랩 대기 20분',
    hashtags: ['홍대커피랩'],
  };
  const TestRoomChatScreen = RoomChatScreen as unknown as React.ComponentType<{
    navigation: unknown;
    route: unknown;
  }>;

  mockUseAuth.mockReturnValue({
    user: {
      id: 'user-1',
      email: 'user@example.com',
      nickname: '테스터',
    },
  });
  mockListMessages.mockResolvedValue([cafeMood, coffeeLab]);

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      React.createElement(TestRoomChatScreen, {
        navigation: {replace: jest.fn()},
        route: {
          key: 'RoomChat',
          name: 'RoomChat',
          params: {roomId: 'room-1', title: '테스트 방'},
        },
      }),
    );
  });

  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
  });

  const filterInput = renderer!.root.findByProps({
    placeholder: '카페명 또는 #태그 검색',
  });

  ReactTestRenderer.act(() => {
    filterInput.props.onChangeText('#카페무드');
  });

  let renderedText = collectText(renderer!.toJSON()).join(' ');

  expect(renderedText).toContain('#카페무드 특전 있어요');
  expect(renderedText).not.toContain('#홍대커피랩 대기 20분');

  const clearButton = renderer!.root.find(
    node =>
      typeof node.props.onPress === 'function' &&
      node.findAllByProps({children: '해제'}).length > 0,
  );

  ReactTestRenderer.act(() => {
    clearButton.props.onPress();
  });

  renderedText = collectText(renderer!.toJSON()).join(' ');

  expect(renderedText).toContain('#카페무드 특전 있어요');
  expect(renderedText).toContain('#홍대커피랩 대기 20분');

  ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});

test('keeps realtime messages received before initial load resolves', async () => {
  const loaded = makeMessage('loaded', '2026-05-20T00:00:00.000Z');
  const realtime = makeMessage('realtime', '2026-05-20T00:00:01.000Z');
  let resolveList!: (messages: ChatMessage[]) => void;
  const listPromise = new Promise<ChatMessage[]>(resolve => {
    resolveList = resolve;
  });
  let realtimeCallback!: (message: ChatMessage) => void;
  const TestRoomChatScreen = RoomChatScreen as unknown as React.ComponentType<{
    navigation: unknown;
    route: unknown;
  }>;

  mockUseAuth.mockReturnValue({
    user: {
      id: 'user-1',
      email: 'user@example.com',
      nickname: '테스터',
    },
  });
  mockListMessages.mockReturnValue(listPromise);
  mockSubscribeToRoomMessages.mockImplementation((_roomId, callback) => {
    realtimeCallback = callback;
    return jest.fn();
  });

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      React.createElement(TestRoomChatScreen, {
        navigation: {replace: jest.fn()},
        route: {
          key: 'RoomChat',
          name: 'RoomChat',
          params: {roomId: 'room-1', title: '테스트 방'},
        },
      }),
    );
  });

  ReactTestRenderer.act(() => {
    realtimeCallback(realtime);
  });

  await ReactTestRenderer.act(async () => {
    resolveList([loaded]);
    await listPromise;
  });

  const renderedText = collectText(renderer!.toJSON()).join(' ');

  expect(renderedText).toContain('loaded');
  expect(renderedText).toContain('realtime');
  expect(renderedText.indexOf('loaded')).toBeLessThan(
    renderedText.indexOf('realtime'),
  );

  ReactTestRenderer.act(() => {
    renderer!.unmount();
  });
});
