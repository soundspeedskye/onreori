import type {EventRoom} from '../types';
import {formatEventRoomDate, getEventRoomMetaLabel} from './eventRoomPresentation';

const baseRoom: EventRoom = {
  id: 'room-1',
  categoryId: 'EVENT_DAY',
  title: 'Concert day 1',
  eventDate: '2026-06-16',
  location: 'KSPO Dome',
  primaryLanguage: 'en',
  languageCodes: ['en'],
  status: 'active',
  eventTimezone: 'Asia/Seoul',
  activeFromAt: '2026-06-09T15:00:00.000Z',
  activeUntilAt: '2026-06-23T15:00:00.000Z',
  memberCount: 3,
  createdBy: 'user-1',
  createdAt: '2026-06-01T00:00:00.000Z',
};

describe('event room presentation', () => {
  it('formats ISO event dates with the provided locale', () => {
    expect(formatEventRoomDate('2026-06-16', 'en-US')).toBe('June 16, 2026');
  });

  it('uses the provided locale in room meta labels', () => {
    expect(getEventRoomMetaLabel(baseRoom, 'en-US')).toBe(
      'June 16, 2026 · KSPO Dome',
    );
  });

  it('keeps non-date event labels unchanged', () => {
    expect(formatEventRoomDate('Always on', 'en-US')).toBe('Always on');
  });
});
