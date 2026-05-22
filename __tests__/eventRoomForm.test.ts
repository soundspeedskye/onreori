import {
  getRoomCreationConfig,
  validateRoomCreationDraft,
} from '../src/utils/eventRoomForm';

test('requires place for concert and popup rooms', () => {
  expect(getRoomCreationConfig('EVENT_DAY').requiresPlace).toBe(true);
  expect(getRoomCreationConfig('EVENT_DAY').allowsEventUrlPreview).toBe(true);
  expect(getRoomCreationConfig('POPUP').requiresPlace).toBe(true);
  expect(getRoomCreationConfig('POPUP').allowsEventUrlPreview).toBe(true);
  expect(getRoomCreationConfig('POPUP').titlePlaceholder).toBe(
    '예: 성수 팝업 재고방',
  );

  expect(
    validateRoomCreationDraft('EVENT_DAY', {
      title: 'KSPO 2일차 대기방',
      eventDate: '2026-06-01',
      entryCode: '1234',
      location: '',
    }),
  ).toEqual('장소를 선택하세요.');
});

test('checks required place before entry code for place-based rooms', () => {
  expect(
    validateRoomCreationDraft('EVENT_DAY', {
      title: '공연장 대기방',
      eventDate: '2026-06-01',
      entryCode: '',
      location: '',
    }),
  ).toEqual('장소를 선택하세요.');
});

test('does not require place for birthday cafe rooms', () => {
  expect(getRoomCreationConfig('CAFE_EVENT').requiresPlace).toBe(false);
  expect(getRoomCreationConfig('CAFE_EVENT').allowsEventUrlPreview).toBe(false);

  expect(
    validateRoomCreationDraft('CAFE_EVENT', {
      title: '민지',
      eventDate: '2026-06-01',
      entryCode: '1234',
      location: '',
    }),
  ).toBeNull();
});

test('requires title date and entry code for all room categories', () => {
  expect(
    validateRoomCreationDraft('CAFE_EVENT', {
      title: '',
      eventDate: '2026-06-01',
      entryCode: '1234',
      location: '',
    }),
  ).toEqual('아티스트/멤버명을 입력하세요.');

  expect(
    validateRoomCreationDraft('POPUP', {
      title: '팝업 재고방',
      eventDate: '',
      entryCode: '1234',
      location: '성수',
    }),
  ).toEqual('날짜를 선택하세요.');

  expect(
    validateRoomCreationDraft('EVENT_DAY', {
      title: '공연장 대기방',
      eventDate: '2026-06-01',
      entryCode: '',
      location: 'KSPO DOME',
    }),
  ).toEqual('입장코드를 입력하세요.');
});
