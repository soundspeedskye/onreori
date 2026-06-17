import React from 'react';
import renderer, {act} from 'react-test-renderer';

import {ChatHeader} from '../components/rooms/ChatHeader';
import {RoomChatScreen} from './RoomChatScreen';

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: {id: 'user-1', email: 'user@example.com', nickname: 'User'},
  }),
}));

jest.mock('../i18n/AppLanguageProvider', () => ({
  useAppLanguage: () => ({language: 'en'}),
}));

jest.mock('../services/rooms', () => ({
  getTutorialRoomCopy: (languageCode: string) => ({
    languageCode,
    botNickname: 'Today Duck',
    roomTitle: 'Tutorial chat room',
    eventDate: 'Always on',
    location: 'How to use Onreori',
    welcomeBodies: ['Welcome'],
    replyBodies: ['Be kind'],
  }),
  isTutorialRoomId: (roomId: string) => roomId.startsWith('tutorial-'),
}));

jest.mock('../components/rooms/ChatHeader', () => ({
  ChatHeader: jest.fn(() => null),
}));

jest.mock('../components/rooms/ChatMessageList', () => ({
  ChatMessageList: jest.fn(() => null),
}));

jest.mock('../components/rooms/ChatComposer', () => ({
  ChatComposer: jest.fn(() => null),
}));

jest.mock('react-native-keyboard-controller', () => {
  const ReactModule = require('react');

  return {
    AndroidSoftInputModes: {
      SOFT_INPUT_ADJUST_NOTHING: 'SOFT_INPUT_ADJUST_NOTHING',
    },
    KeyboardController: {
      setDefaultMode: jest.fn(),
      setInputMode: jest.fn(),
    },
    KeyboardStickyView: ({children}: {children: React.ReactNode}) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');

  return {
    SafeAreaView: ({children}: {children: React.ReactNode}) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock('./roomChat/useRoomMessages', () => ({
  useRoomMessages: () => ({
    messages: [],
    setMessages: jest.fn(),
    loading: false,
    botTyping: false,
    scheduleTutorialReply: jest.fn(),
  }),
}));

jest.mock('./roomChat/useChatSendActions', () => ({
  useChatSendActions: () => ({
    body: '',
    setBody: jest.fn(),
    sending: false,
    handleSendText: jest.fn(),
    handleSendImage: jest.fn(),
  }),
}));

describe('RoomChatScreen tutorial localization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the current tutorial language for header chips', () => {
    act(() => {
      renderer.create(
        <RoomChatScreen
          navigation={{replace: jest.fn()} as never}
          route={
            {
              params: {
                roomId: 'tutorial-EVENT_DAY',
                title: '튜토리얼 단톡방',
                languageCodes: ['ko'],
              },
            } as never
          }
        />,
      );
    });

    expect(ChatHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        languageCodes: ['en'],
        title: 'Tutorial chat room',
        tutorialRoom: true,
      }),
      undefined,
    );
  });
});
