const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockListSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockStorageFrom = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../src/config/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    storage: {
      from: (...args: unknown[]) => mockStorageFrom(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import {
  createRoom,
  joinRoomWithCode,
  listRoomsByCategory,
  listMessages,
  sendImageMessage,
  sendTextMessage,
} from '../src/services/rooms';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  nickname: '테스터',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(1234);

  mockUpload.mockResolvedValue({error: null});
  mockCreateSignedUrl.mockResolvedValue({
    data: {signedUrl: 'https://example.supabase.co/signed/photo.jpg'},
    error: null,
  });
  mockStorageFrom.mockReturnValue({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
  });
  mockSingle.mockResolvedValue({
    data: {
      id: 'message-1',
      room_id: 'room-1',
      user_id: 'user-1',
      nickname: '테스터',
      type: 'image',
      body: '사진',
      media_url: 'room-1/user-1/1234-photo.jpg',
      created_at: '2026-05-19T00:00:00.000Z',
    },
    error: null,
  });
  mockSelect.mockReturnValue({single: mockSingle});
  mockInsert.mockReturnValue({select: mockSelect});
  mockFrom.mockReturnValue({insert: mockInsert});
  mockRpc.mockResolvedValue({data: null, error: null});
  mockListSelect.mockReturnValue({eq: mockEq});
  mockEq.mockReturnValue({order: mockOrder});
  mockOrder.mockReturnValue({limit: mockLimit});

  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
    }),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('normalizes image/jpg to image/jpeg before uploading chat media', async () => {
  const message = await sendImageMessage({
    roomId: 'room-1',
    user,
    imageUri: 'file:///photo.jpg',
    fileName: 'photo.jpg',
    contentType: 'image/jpg',
  });

  expect(mockUpload).toHaveBeenCalledWith(
    'room-1/user-1/1234-photo.jpg',
    expect.any(ArrayBuffer),
    expect.objectContaining({
      contentType: 'image/jpeg',
    }),
  );
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining({
      media_url: 'room-1/user-1/1234-photo.jpg',
    }),
  );
  expect(mockCreateSignedUrl).toHaveBeenCalledWith(
    'room-1/user-1/1234-photo.jpg',
    3600,
  );
  expect(message.mediaUrl).toBe('https://example.supabase.co/signed/photo.jpg');
});

test('passes event room metadata to the creation RPC and maps the returned room', async () => {
  mockRpc.mockResolvedValueOnce({
    data: {
      id: 'room-1',
      category_id: 'POPUP',
      title: '성수 팝업',
      event_date: '2026-06-01',
      location: '성수동',
      event_url: 'https://example.com/event',
      location_name: '성수 팝업 스토어',
      address: '서울 성동구 성수동1가 1',
      road_address: '서울 성동구 성수이로 1',
      latitude: 37.544,
      longitude: 127.055,
      subject_name: '뉴진스',
      member_count: 1,
      created_by: 'user-1',
      created_at: '2026-05-21T00:00:00.000Z',
    },
    error: null,
  });

  await expect(
    createRoom({
      categoryId: 'POPUP',
      title: ' 성수 팝업 ',
      eventDate: '2026-06-01',
      location: ' 성수동 ',
      entryCode: '1234',
      eventUrl: 'https://example.com/event',
      locationName: '성수 팝업 스토어',
      address: '서울 성동구 성수동1가 1',
      roadAddress: '서울 성동구 성수이로 1',
      latitude: 37.544,
      longitude: 127.055,
      subjectName: '뉴진스',
      user,
    }),
  ).resolves.toEqual(
    expect.objectContaining({
      id: 'room-1',
      eventUrl: 'https://example.com/event',
      locationName: '성수 팝업 스토어',
      address: '서울 성동구 성수동1가 1',
      roadAddress: '서울 성동구 성수이로 1',
      latitude: 37.544,
      longitude: 127.055,
      subjectName: '뉴진스',
    }),
  );

  expect(mockRpc).toHaveBeenCalledWith('create_event_room_with_code', {
    input_category_id: 'POPUP',
    input_title: '성수 팝업',
    input_event_date: '2026-06-01',
    input_location: '성수동',
    input_entry_code: '1234',
    input_event_url: 'https://example.com/event',
    input_location_name: '성수 팝업 스토어',
    input_address: '서울 성동구 성수동1가 1',
    input_road_address: '서울 성동구 성수이로 1',
    input_latitude: 37.544,
    input_longitude: 127.055,
    input_subject_name: '뉴진스',
  });
});

test('passes null metadata fields to the creation RPC for minimal rooms', async () => {
  mockRpc.mockResolvedValueOnce({
    data: {
      id: 'room-1',
      category_id: 'EVENT_DAY',
      title: '공연 대기방',
      event_date: '2026-06-01',
      location: 'KSPO DOME',
      event_url: null,
      location_name: null,
      address: null,
      road_address: null,
      latitude: null,
      longitude: null,
      subject_name: null,
      member_count: 1,
      created_by: 'user-1',
      created_at: '2026-05-21T00:00:00.000Z',
    },
    error: null,
  });

  await expect(
    createRoom({
      categoryId: 'EVENT_DAY',
      title: '공연 대기방',
      eventDate: '2026-06-01',
      location: 'KSPO DOME',
      entryCode: '1234',
      user,
    }),
  ).resolves.toEqual(
    expect.objectContaining({
      eventUrl: undefined,
      locationName: undefined,
      address: undefined,
      roadAddress: undefined,
      latitude: undefined,
      longitude: undefined,
      subjectName: undefined,
    }),
  );

  expect(mockRpc).toHaveBeenCalledWith('create_event_room_with_code', {
    input_category_id: 'EVENT_DAY',
    input_title: '공연 대기방',
    input_event_date: '2026-06-01',
    input_location: 'KSPO DOME',
    input_entry_code: '1234',
    input_event_url: null,
    input_location_name: null,
    input_address: null,
    input_road_address: null,
    input_latitude: null,
    input_longitude: null,
    input_subject_name: null,
  });
});

test('passes null metadata fields to the creation RPC for cafe event rooms', async () => {
  mockRpc.mockResolvedValueOnce({
    data: {
      id: 'room-1',
      category_id: 'CAFE_EVENT',
      title: '생일 카페',
      event_date: '2026-06-01',
      location: '장소 없음',
      event_url: null,
      location_name: null,
      address: null,
      road_address: null,
      latitude: null,
      longitude: null,
      subject_name: '생일 카페',
      member_count: 1,
      created_by: 'user-1',
      created_at: '2026-05-21T00:00:00.000Z',
    },
    error: null,
  });

  await expect(
    createRoom({
      categoryId: 'CAFE_EVENT',
      title: ' 생일 카페 ',
      eventDate: '2026-06-01',
      location: '',
      entryCode: '1234',
      user,
    }),
  ).resolves.toEqual(
    expect.objectContaining({
      categoryId: 'CAFE_EVENT',
      location: '장소 없음',
      eventUrl: undefined,
      locationName: undefined,
      address: undefined,
      roadAddress: undefined,
      latitude: undefined,
      longitude: undefined,
      subjectName: '생일 카페',
    }),
  );

  expect(mockRpc).toHaveBeenCalledWith('create_event_room_with_code', {
    input_category_id: 'CAFE_EVENT',
    input_title: '생일 카페',
    input_event_date: '2026-06-01',
    input_location: '',
    input_entry_code: '1234',
    input_event_url: null,
    input_location_name: null,
    input_address: null,
    input_road_address: null,
    input_latitude: null,
    input_longitude: null,
    input_subject_name: null,
  });
});

test('returns a tutorial room when no rooms exist for a category', async () => {
  mockOrder.mockResolvedValueOnce({data: [], error: null});
  mockFrom.mockReturnValueOnce({select: mockListSelect});

  await expect(listRoomsByCategory('EVENT_DAY')).resolves.toEqual([
    expect.objectContaining({
      id: 'tutorial-EVENT_DAY',
      categoryId: 'EVENT_DAY',
      title: '튜토리얼 단톡방',
      location: '입장코드 0000',
    }),
  ]);
  expect(mockFrom).toHaveBeenCalledWith('event_rooms');
});

test('lets users enter tutorial rooms with the shared tutorial code', async () => {
  await expect(
    joinRoomWithCode('tutorial-EVENT_DAY', '0000', user),
  ).resolves.toBeUndefined();

  expect(mockRpc).not.toHaveBeenCalled();
});

test('returns welcome messages for tutorial rooms without querying Supabase', async () => {
  await expect(listMessages('tutorial-EVENT_DAY')).resolves.toEqual([
    expect.objectContaining({
      roomId: 'tutorial-EVENT_DAY',
      body: expect.stringContaining('입장코드'),
    }),
  ]);

  expect(mockFrom).not.toHaveBeenCalled();
});

test('stores extracted hashtags when sending a text message and maps response hashtags', async () => {
  mockSingle.mockResolvedValueOnce({
    data: {
      id: 'message-1',
      room_id: 'room-1',
      user_id: 'user-1',
      nickname: '테스터',
      type: 'text',
      body: '#카페무드 특전 있어요 #카페무드 #Hongdae_1',
      media_url: null,
      hashtags: ['카페무드', 'Hongdae_1'],
      created_at: '2026-05-21T00:00:00.000Z',
    },
    error: null,
  });

  await expect(
    sendTextMessage(
      'room-1',
      ' #카페무드 특전 있어요 #카페무드 #Hongdae_1 ',
      user,
    ),
  ).resolves.toEqual(
    expect.objectContaining({
      body: '#카페무드 특전 있어요 #카페무드 #Hongdae_1',
      hashtags: ['카페무드', 'Hongdae_1'],
    }),
  );

  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining({
      body: '#카페무드 특전 있어요 #카페무드 #Hongdae_1',
      hashtags: ['카페무드', 'Hongdae_1'],
    }),
  );
});

test('removes path separators from uploaded chat media filenames', async () => {
  await sendImageMessage({
    roomId: 'room-1',
    user,
    imageUri: 'file:///photo.jpg',
    fileName: '../nested/photo bad.jpg',
    contentType: 'image/jpeg',
  });

  expect(mockUpload).toHaveBeenCalledWith(
    'room-1/user-1/1234-photo-bad.jpg',
    expect.any(ArrayBuffer),
    expect.any(Object),
  );
});

test('keeps listing messages when a private image signed URL cannot be created', async () => {
  mockCreateSignedUrl.mockResolvedValueOnce({
    data: null,
    error: {message: 'not found'},
  });
  mockLimit.mockResolvedValueOnce({
    data: [
      {
        id: 'message-1',
        room_id: 'room-1',
        user_id: 'user-1',
        nickname: '테스터',
        type: 'image',
        body: '사진',
        media_url: 'room-1/user-1/missing.jpg',
        created_at: '2026-05-19T00:00:00.000Z',
      },
    ],
    error: null,
  });
  mockFrom.mockReturnValueOnce({select: mockListSelect});

  await expect(listMessages('room-1')).resolves.toEqual([
    expect.objectContaining({
      id: 'message-1',
      mediaUrl: undefined,
      type: 'image',
    }),
  ]);
});

test('creates signed URLs for legacy public chat media URLs', async () => {
  mockLimit.mockResolvedValueOnce({
    data: [
      {
        id: 'message-1',
        room_id: 'room-1',
        user_id: 'user-1',
        nickname: '테스터',
        type: 'image',
        body: '사진',
        media_url:
          'https://example.supabase.co/storage/v1/object/public/chat-media/room-1/user-1/legacy.jpg',
        created_at: '2026-05-19T00:00:00.000Z',
      },
    ],
    error: null,
  });
  mockFrom.mockReturnValueOnce({select: mockListSelect});

  await expect(listMessages('room-1')).resolves.toEqual([
    expect.objectContaining({
      mediaUrl: 'https://example.supabase.co/signed/photo.jpg',
    }),
  ]);
  expect(mockCreateSignedUrl).toHaveBeenCalledWith(
    'room-1/user-1/legacy.jpg',
    3600,
  );
});
