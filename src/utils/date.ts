export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return undefined;
  }

  return parsedDate;
}

export const KOREAN_EVENT_TIME_ZONE = 'Asia/Seoul';

const KOREA_UTC_OFFSET_MS = 9 * 60 * 60 * 1000;

type DateInputParts = {
  year: number;
  monthIndex: number;
  day: number;
};

function parseDateInputParts(value: string): DateInputParts | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return undefined;
  }

  return {year, monthIndex: month - 1, day};
}

function getKoreanDateStartInstant(
  value: string,
  dayOffset: number,
): string | undefined {
  const parts = parseDateInputParts(value);

  if (!parts) {
    return undefined;
  }

  return new Date(
    Date.UTC(parts.year, parts.monthIndex, parts.day + dayOffset) -
      KOREA_UTC_OFFSET_MS,
  ).toISOString();
}

export function getKoreanEventRoomAvailability(eventDate: string):
  | {
      eventTimezone: string;
      activeFromAt: string;
      activeUntilAt: string;
    }
  | undefined {
  const activeFromAt = getKoreanDateStartInstant(eventDate, -5);
  const activeUntilAt = getKoreanDateStartInstant(eventDate, 4);

  if (!activeFromAt || !activeUntilAt) {
    return undefined;
  }

  return {
    eventTimezone: KOREAN_EVENT_TIME_ZONE,
    activeFromAt,
    activeUntilAt,
  };
}
