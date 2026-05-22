import React from 'react';
import {Alert, Platform} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import {EventRoomsScreen} from '../src/screens/EventRoomsScreen';
import {fetchEventUrlPreview} from '../src/services/eventUrlPreview';
import {createRoom} from '../src/services/rooms';
import type {
  AuthUser,
  EventRoom,
  PlaceSelection,
  RootStackParamList,
} from '../src/types';

const mockUseAuth = jest.fn<{user: AuthUser | null}, []>(() => ({
  user: {id: 'user-1', email: 'test@example.com', nickname: '테스터'},
}));
const mockListRoomsByCategory = jest.fn<Promise<EventRoom[]>, [string]>();
const mockCreateRoom = createRoom as jest.MockedFunction<typeof createRoom>;
const mockFetchEventUrlPreview =
  fetchEventUrlPreview as jest.MockedFunction<typeof fetchEventUrlPreview>;

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../src/services/rooms', () => ({
  createRoom: jest.fn(),
  joinRoomWithCode: jest.fn(),
  listRoomsByCategory: (categoryId: string) =>
    mockListRoomsByCategory(categoryId),
}));

jest.mock('../src/services/eventUrlPreview', () => ({
  fetchEventUrlPreview: jest.fn(),
}));

const DateTimePickerTestType = 'DateTimePicker' as unknown as React.ElementType;

type EventRoomsRoute = {
  params: RootStackParamList['EventRooms'];
};

function createMockRoom(overrides: Partial<EventRoom> = {}): EventRoom {
  return {
    id: 'room-1',
    categoryId: 'EVENT_DAY',
    title: 'KSPO 2일차 대기방',
    eventDate: '2026-06-01',
    location: 'KSPO DOME',
    memberCount: 1,
    createdBy: 'user-1',
    createdAt: '2026-05-21T00:00:00.000Z',
    ...overrides,
  };
}

function createPlace(overrides: Partial<PlaceSelection> = {}): PlaceSelection {
  return {
    provider: 'naver',
    name: 'KSPO DOME',
    address: '서울 송파구 방이동 88',
    roadAddress: '서울 송파구 올림픽로 424',
    latitude: 37.519,
    longitude: 127.122,
    source: 'search',
    ...overrides,
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  ReactTestRenderer.act(() => undefined);
}

async function renderScreen(
  categoryId: string,
  selectedPlace?: PlaceSelection,
  rooms?: EventRoom[],
) {
  const navigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };
  let renderer: ReactTestRenderer.ReactTestRenderer;

  if (rooms) {
    mockListRoomsByCategory.mockResolvedValue(rooms);
  } else {
    mockListRoomsByCategory.mockImplementation(
      () => new Promise(() => undefined),
    );
  }

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <EventRoomsScreen
        navigation={navigation as never}
        route={
          {params: {categoryId, selectedPlace}} as EventRoomsRoute as never
        }
      />,
    );
  });
  if (rooms) {
    await flushPromises();
  }

  return {navigation, root: renderer!.root};
}

function findByProp(root: ReactTestRenderer.ReactTestInstance, prop: string) {
  return root.findAll(node => node.props[prop] !== undefined);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateRoom.mockImplementation(() => new Promise(() => undefined));
  mockFetchEventUrlPreview.mockResolvedValue({
    url: 'https://tickets.example.com/show',
    title: 'KSPO 2일차 대기방',
    dateCandidates: ['2026-06-01'],
    locationCandidates: ['KSPO DOME'],
    confidence: 'medium',
  });
});

test('renders a birthday cafe form without place picker or event URL', async () => {
  const {root} = await renderScreen('CAFE_EVENT');
  const placeholders = findByProp(root, 'placeholder').map(
    node => node.props.placeholder,
  );

  expect(placeholders).toContain('예: 민지');
  expect(placeholders).not.toContain('장소');
  expect(placeholders).not.toContain('공식 공지/예매/안내 링크');
  expect(root.findAllByProps({title: '지도에서 장소 선택'})).toHaveLength(0);
});

test('renders resolved room list and event-day place picker with event URL field', async () => {
  const originalError = console.error;
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation((...args) => {
      if (String(args[0]).includes('not wrapped in act')) {
        return;
      }

      originalError(...args);
    });

  let result: Awaited<ReturnType<typeof renderScreen>>;

  try {
    result = await renderScreen('EVENT_DAY', undefined, [
      createMockRoom({title: '기존 방'}),
    ]);
  } finally {
    consoleErrorSpy.mockRestore();
  }

  const {navigation, root} = result!;

  expect(root.findByProps({placeholder: '예: KSPO 2일차 대기방'})).toBeTruthy();
  expect(
    root.findByProps({placeholder: '공식 공지/예매/안내 링크'}),
  ).toBeTruthy();
  expect(mockListRoomsByCategory).toHaveReturnedWith(
    expect.objectContaining({
      then: expect.any(Function),
    }),
  );

  const placeButton = root.findByProps({title: '지도에서 장소 선택'});
  ReactTestRenderer.act(() => {
    placeButton.props.onPress();
  });

  expect(navigation.navigate).toHaveBeenCalledWith('MapPicker', {
    categoryId: 'EVENT_DAY',
    returnTo: 'EventRooms',
  });
});

test('does not expose server errors when room list loading fails', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const originalError = console.error;
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation((...args) => {
      if (String(args[0]).includes('not wrapped in act')) {
        return;
      }

      originalError(...args);
    });
  mockListRoomsByCategory.mockRejectedValue(
    new Error('relation "public.event_rooms" does not exist'),
  );

  try {
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <EventRoomsScreen
          navigation={{navigate: jest.fn(), replace: jest.fn()} as never}
          route={{params: {categoryId: 'EVENT_DAY'}} as EventRoomsRoute as never}
        />,
      );
    });

    await flushPromises();

    expect(alertSpy).toHaveBeenCalledWith(
      '단톡방을 불러오지 못했습니다.',
      '잠시 후 다시 시도하세요.',
    );
    expect(alertSpy).not.toHaveBeenCalledWith(
      '단톡방을 불러오지 못했습니다.',
      'relation "public.event_rooms" does not exist',
    );
  } finally {
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  }
});

test('creates an event-day room with selected place metadata', async () => {
  const selectedPlace = createPlace();
  const {root} = await renderScreen('EVENT_DAY', selectedPlace);

  ReactTestRenderer.act(() => {
    root
      .findByProps({placeholder: '예: KSPO 2일차 대기방'})
      .props.onChangeText('  공연장 대기방  ');
    root
      .findByProps({placeholder: '공식 공지/예매/안내 링크'})
      .props.onChangeText('https://tickets.example.com/show');
    root.findByProps({placeholder: '입장코드'}).props.onChangeText('1234');
    root.findByProps({title: '날짜 선택'}).props.onPress();
  });

  ReactTestRenderer.act(() => {
    root.findByType(DateTimePickerTestType).props.onChange(
      {type: 'set'},
      new Date(2026, 5, 1),
    );
  });

  ReactTestRenderer.act(() => {
    root.findByProps({title: '단톡방 만들기'}).props.onPress();
  });

  expect(mockCreateRoom).toHaveBeenCalledWith(
    expect.objectContaining({
      categoryId: 'EVENT_DAY',
      title: '공연장 대기방',
      eventDate: '2026-06-01',
      location: 'KSPO DOME',
      eventUrl: 'https://tickets.example.com/show',
      locationName: 'KSPO DOME',
      address: '서울 송파구 방이동 88',
      roadAddress: '서울 송파구 올림픽로 424',
      latitude: 37.519,
      longitude: 127.122,
      entryCode: '1234',
    }),
  );
});

test('applies event URL preview candidates to empty event-day fields', async () => {
  const {root} = await renderScreen('EVENT_DAY');

  ReactTestRenderer.act(() => {
    root
      .findByProps({placeholder: '공식 공지/예매/안내 링크'})
      .props.onChangeText('https://tickets.example.com/show');
  });

  await ReactTestRenderer.act(async () => {
    await root
      .findByProps({title: '링크에서 정보 가져오기'})
      .props.onPress();
  });

  expect(mockFetchEventUrlPreview).toHaveBeenCalledWith(
    'https://tickets.example.com/show',
  );
  expect(root.findByProps({placeholder: '예: KSPO 2일차 대기방'}).props.value).toBe(
    'KSPO 2일차 대기방',
  );
  expect(root.findByProps({title: '2026-06-01'})).toBeTruthy();
  expect(root.findByProps({title: 'KSPO DOME'})).toBeTruthy();
});

test('shows a validation alert and skips preview fetch when event URL is empty', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  try {
    const {root} = await renderScreen('EVENT_DAY');

    await ReactTestRenderer.act(async () => {
      await root
        .findByProps({title: '링크에서 정보 가져오기'})
        .props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith('링크를 입력하세요.');
    expect(mockFetchEventUrlPreview).not.toHaveBeenCalled();
  } finally {
    alertSpy.mockRestore();
  }
});

test('preserves non-empty fields when applying event URL preview candidates', async () => {
  mockFetchEventUrlPreview.mockResolvedValue({
    url: 'https://tickets.example.com/show',
    title: '새 공연 안내',
    dateCandidates: ['2026-07-02'],
    locationCandidates: ['새 공연장'],
    confidence: 'medium',
  });
  const selectedPlace = createPlace({name: '기존 공연장'});
  const {root} = await renderScreen('EVENT_DAY', selectedPlace);

  ReactTestRenderer.act(() => {
    root
      .findByProps({placeholder: '예: KSPO 2일차 대기방'})
      .props.onChangeText('기존 제목');
    root
      .findByProps({placeholder: '공식 공지/예매/안내 링크'})
      .props.onChangeText('https://tickets.example.com/show');
    root.findByProps({title: '날짜 선택'}).props.onPress();
  });

  ReactTestRenderer.act(() => {
    root.findByType(DateTimePickerTestType).props.onChange(
      {type: 'set'},
      new Date(2026, 5, 1),
    );
  });

  await ReactTestRenderer.act(async () => {
    await root
      .findByProps({title: '링크에서 정보 가져오기'})
      .props.onPress();
  });

  expect(root.findByProps({placeholder: '예: KSPO 2일차 대기방'}).props.value).toBe(
    '기존 제목',
  );
  expect(root.findByProps({title: '2026-06-01'})).toBeTruthy();
  expect(root.findByProps({title: '기존 공연장'})).toBeTruthy();
});

test('treats whitespace-only fields as empty when applying event URL preview candidates', async () => {
  const whitespacePlace = createPlace({
    name: '   ',
    address: undefined,
    roadAddress: undefined,
  });
  const {root} = await renderScreen('EVENT_DAY', whitespacePlace);

  ReactTestRenderer.act(() => {
    root
      .findByProps({placeholder: '예: KSPO 2일차 대기방'})
      .props.onChangeText('   ');
    root
      .findByProps({placeholder: '공식 공지/예매/안내 링크'})
      .props.onChangeText('https://tickets.example.com/show');
  });

  await ReactTestRenderer.act(async () => {
    await root
      .findByProps({title: '링크에서 정보 가져오기'})
      .props.onPress();
  });

  expect(root.findByProps({placeholder: '예: KSPO 2일차 대기방'}).props.value).toBe(
    'KSPO 2일차 대기방',
  );
  expect(root.findByProps({title: '2026-06-01'})).toBeTruthy();
  expect(root.findByProps({title: 'KSPO DOME'})).toBeTruthy();
});

test('shows a failure alert when event URL preview fetch rejects', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockFetchEventUrlPreview.mockRejectedValue(new Error('네트워크 오류'));

  try {
    const {root} = await renderScreen('EVENT_DAY');

    ReactTestRenderer.act(() => {
      root
        .findByProps({placeholder: '공식 공지/예매/안내 링크'})
        .props.onChangeText('https://tickets.example.com/show');
    });

    await ReactTestRenderer.act(async () => {
      await root
        .findByProps({title: '링크에서 정보 가져오기'})
        .props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '링크 정보를 가져오지 못했습니다.',
      '네트워크 오류',
    );
  } finally {
    alertSpy.mockRestore();
  }
});

test('does not send selected place metadata for birthday cafe rooms', async () => {
  const {root} = await renderScreen('CAFE_EVENT', createPlace());

  ReactTestRenderer.act(() => {
    root.findByProps({placeholder: '예: 민지'}).props.onChangeText('민지');
    root.findByProps({placeholder: '입장코드'}).props.onChangeText('1234');
    root.findByProps({title: '날짜 선택'}).props.onPress();
  });

  ReactTestRenderer.act(() => {
    root.findByType(DateTimePickerTestType).props.onChange(
      {type: 'set'},
      new Date(2026, 5, 1),
    );
  });

  ReactTestRenderer.act(() => {
    root.findByProps({title: '단톡방 만들기'}).props.onPress();
  });

  expect(mockCreateRoom).toHaveBeenCalledWith(
    expect.objectContaining({
      categoryId: 'CAFE_EVENT',
      title: '민지 생카 정보방',
      eventDate: '2026-06-01',
      location: '',
      subjectName: '민지',
      locationName: undefined,
      address: undefined,
      roadAddress: undefined,
      latitude: undefined,
      longitude: undefined,
    }),
  );
});

test('keeps the date picker open on iOS until done is pressed', async () => {
  const originalOS = Platform.OS;
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'ios',
  });

  try {
    const {root} = await renderScreen('EVENT_DAY');

    ReactTestRenderer.act(() => {
      root.findByProps({title: '날짜 선택'}).props.onPress();
    });

    ReactTestRenderer.act(() => {
      root.findByType(DateTimePickerTestType).props.onChange(
        {type: 'set'},
        new Date(2026, 5, 1),
      );
    });

    expect(root.findAllByType(DateTimePickerTestType)).toHaveLength(1);

    ReactTestRenderer.act(() => {
      root.findByProps({title: '완료'}).props.onPress();
    });

    expect(root.findAllByType(DateTimePickerTestType)).toHaveLength(0);
  } finally {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalOS,
    });
  }
});
