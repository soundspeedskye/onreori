import type {
  CafeRoute,
  CafeRouteStop,
  CafeRouteVisibility,
  EventRoom,
  PlaceSelection,
} from '../types';
import {i18n} from '../i18n';
import {EVENT_ROOM_ALWAYS_ACTIVE_UNTIL_AT} from './eventRoomVisibility';
import {createLocalId} from './localId';

const DAY_MS = 24 * 60 * 60 * 1000;
const KOREA_UTC_OFFSET_MS = 9 * 60 * 60 * 1000;
export const CAFE_ROUTE_TITLE_MAX_LENGTH = 40;

function getDefaultCafeRouteTitle() {
  return i18n.t('defaultTitle', {ns: 'cafeRoutes'});
}

type CreateCafeRouteDraftParams = {
  categoryId: string;
  ownerId?: string;
  title?: string;
  now?: string;
};

type RoomLinkStatusState =
  | 'notLinked'
  | 'upcoming'
  | 'active'
  | 'endingToday'
  | 'expired'
  | 'alwaysActive';

export type CafeRouteRoomLinkStatus = {
  state: RoomLinkStatusState;
  label: string;
};

function touchRoute(route: CafeRoute, now = new Date().toISOString()) {
  return {
    ...route,
    updatedAt: now,
  };
}

function getKoreanDayNumber(date: Date): number {
  return Math.floor((date.getTime() + KOREA_UTC_OFFSET_MS) / DAY_MS);
}

function getValidTime(value: string): number | null {
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : null;
}

export function createCafeRouteDraft({
  categoryId,
  ownerId,
  title = getDefaultCafeRouteTitle(),
  now = new Date().toISOString(),
}: CreateCafeRouteDraftParams): CafeRoute {
  return {
    id: createLocalId('cafe-route'),
    ownerId,
    categoryId,
    title: normalizeCafeRouteTitle(title),
    visibility: 'private',
    stops: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeCafeRouteTitle(title: string): string {
  const singleLineTitle = title.replace(/\s+/g, ' ').trim();

  return (
    singleLineTitle.slice(0, CAFE_ROUTE_TITLE_MAX_LENGTH) ||
    getDefaultCafeRouteTitle()
  );
}

export function getCafeRouteDisplayTitle(route: Pick<CafeRoute, 'title'>) {
  return normalizeCafeRouteTitle(route.title);
}

function cleanCafeRouteTitleInput(title: string): string {
  return title.replace(/[\r\n\t]+/g, ' ').slice(0, CAFE_ROUTE_TITLE_MAX_LENGTH);
}

export function addPlaceToCafeRoute(
  route: CafeRoute,
  place: PlaceSelection,
  now = new Date().toISOString(),
): CafeRoute {
  const nextStop: CafeRouteStop = {
    ...place,
    id: createLocalId('cafe-stop'),
    order: route.stops.length + 1,
    createdAt: now,
  };

  return touchRoute(
    {
      ...route,
      stops: [...route.stops, nextStop],
    },
    now,
  );
}

export function removeCafeRouteStop(
  route: CafeRoute,
  stopId: string,
  now = new Date().toISOString(),
): CafeRoute {
  const nextStops = route.stops
    .filter(stop => stop.id !== stopId)
    .map((stop, index) => ({...stop, order: index + 1}));

  return touchRoute({...route, stops: nextStops}, now);
}

export function moveCafeRouteStop(
  route: CafeRoute,
  stopId: string,
  direction: 'up' | 'down',
  now = new Date().toISOString(),
): CafeRoute {
  const currentIndex = route.stops.findIndex(stop => stop.id === stopId);

  if (currentIndex < 0) {
    return route;
  }

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= route.stops.length) {
    return route;
  }

  const nextStops = [...route.stops];
  const currentStop = nextStops[currentIndex];
  nextStops[currentIndex] = nextStops[nextIndex];
  nextStops[nextIndex] = currentStop;

  return touchRoute(
    {
      ...route,
      stops: nextStops.map((stop, index) => ({...stop, order: index + 1})),
    },
    now,
  );
}

export function updateCafeRouteTitle(
  route: CafeRoute,
  title: string,
  now = new Date().toISOString(),
): CafeRoute {
  return touchRoute({...route, title: cleanCafeRouteTitleInput(title)}, now);
}

export function updateCafeRouteVisibility(
  route: CafeRoute,
  visibility: CafeRouteVisibility,
  now = new Date().toISOString(),
): CafeRoute {
  return touchRoute(
    {
      ...route,
      visibility,
      linkedRoom: visibility === 'private' ? undefined : route.linkedRoom,
    },
    now,
  );
}

export function linkCafeRouteToRoom(
  route: CafeRoute,
  room: EventRoom,
  now = new Date().toISOString(),
): CafeRoute {
  return touchRoute(
    {
      ...route,
      visibility: 'shared',
      linkedRoom: {
        roomId: room.id,
        title: room.title,
        status: room.status,
        activeFromAt: room.activeFromAt,
        activeUntilAt: room.activeUntilAt,
        closedAt: room.closedAt,
        deletedAt: room.deletedAt,
        linkedAt: now,
      },
    },
    now,
  );
}

export function unlinkCafeRouteFromRoom(
  route: CafeRoute,
  now = new Date().toISOString(),
): CafeRoute {
  return touchRoute(
    {
      ...route,
      linkedRoom: undefined,
    },
    now,
  );
}

export function getCafeRouteRoomLinkStatus(
  route: CafeRoute,
  now = new Date(),
): CafeRouteRoomLinkStatus {
  const linkedRoom = route.linkedRoom;

  if (route.visibility !== 'shared' || !linkedRoom) {
    return {
      state: 'notLinked',
      label: i18n.t('statuses.notLinked', {ns: 'cafeRoutes'}),
    };
  }

  if (linkedRoom.status && linkedRoom.status !== 'active') {
    return {
      state: 'expired',
      label: i18n.t('statuses.expired', {ns: 'cafeRoutes'}),
    };
  }

  if (linkedRoom.activeUntilAt === EVENT_ROOM_ALWAYS_ACTIVE_UNTIL_AT) {
    return {
      state: 'alwaysActive',
      label: i18n.t('statuses.alwaysActive', {ns: 'cafeRoutes'}),
    };
  }

  const activeFromTime = getValidTime(linkedRoom.activeFromAt);
  const activeUntilTime = getValidTime(linkedRoom.activeUntilAt);

  if (
    activeFromTime === null ||
    activeUntilTime === null ||
    activeFromTime >= activeUntilTime
  ) {
    return {
      state: 'notLinked',
      label: i18n.t('statuses.notLinked', {ns: 'cafeRoutes'}),
    };
  }

  const nowTime = now.getTime();

  if (nowTime < activeFromTime) {
    const remainingDays = Math.max(
      1,
      getKoreanDayNumber(new Date(activeFromTime)) - getKoreanDayNumber(now),
    );

    return {
      state: 'upcoming',
      label: i18n.t('statuses.upcoming', {
        count: remainingDays,
        ns: 'cafeRoutes',
      }),
    };
  }

  if (nowTime >= activeUntilTime) {
    return {
      state: 'expired',
      label: i18n.t('statuses.expired', {ns: 'cafeRoutes'}),
    };
  }

  const todayNumber = getKoreanDayNumber(now);
  const lastActiveDayNumber = getKoreanDayNumber(
    new Date(activeUntilTime - 1),
  );
  const remainingDays = lastActiveDayNumber - todayNumber;

  if (remainingDays <= 0) {
    return {
      state: 'endingToday',
      label: i18n.t('statuses.endingToday', {ns: 'cafeRoutes'}),
    };
  }

  return {
    state: 'active',
    label: i18n.t('statuses.active', {
      count: remainingDays,
      ns: 'cafeRoutes',
    }),
  };
}
