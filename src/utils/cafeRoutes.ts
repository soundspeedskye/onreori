import type { CafeRoute, CafeRouteStop, PlaceSelection } from '../types';
import { i18n } from '../i18n';
import { createLocalId } from './localId';

export const CAFE_ROUTE_TITLE_MAX_LENGTH = 40;

function getDefaultCafeRouteTitle() {
  return i18n.t('defaultTitle', { ns: 'cafeRoutes' });
}

type CreateCafeRouteDraftParams = {
  categoryId: string;
  ownerId?: string;
  title?: string;
  now?: string;
};

function touchRoute(route: CafeRoute, now = new Date().toISOString()) {
  return {
    ...route,
    updatedAt: now,
  };
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

export function getNextRouteIdAfterDelete(
  routes: Pick<CafeRoute, 'id'>[],
  deletedRouteId: string,
): string | undefined {
  const deletedIndex = routes.findIndex(route => route.id === deletedRouteId);

  if (deletedIndex < 0) {
    return routes[0]?.id;
  }

  return routes[deletedIndex + 1]?.id ?? routes[deletedIndex - 1]?.id;
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
    .map((stop, index) => ({ ...stop, order: index + 1 }));

  return touchRoute({ ...route, stops: nextStops }, now);
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
      stops: nextStops.map((stop, index) => ({ ...stop, order: index + 1 })),
    },
    now,
  );
}

export function updateCafeRouteTitle(
  route: CafeRoute,
  title: string,
  now = new Date().toISOString(),
): CafeRoute {
  return touchRoute({ ...route, title: cleanCafeRouteTitleInput(title) }, now);
}
