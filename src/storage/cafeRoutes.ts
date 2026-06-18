import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CafeRoute, CafeRouteStop } from '../types';
import { normalizeCafeRouteTitle } from '../utils/cafeRoutes';

const STORAGE_KEY = '@onreori/cafeRoutes';
const FALLBACK_TIMESTAMP = '1970-01-01T00:00:00.000Z';
let cafeRouteMutationQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

function getFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function getTime(value: string): number | undefined {
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : undefined;
}

function getTimestamp(value: unknown, fallback?: string): string {
  const timestamp = getString(value);

  if (timestamp && getTime(timestamp) !== undefined) {
    return timestamp;
  }

  if (fallback && getTime(fallback) !== undefined) {
    return fallback;
  }

  return FALLBACK_TIMESTAMP;
}

function normalizeCafeRouteStops(value: unknown): CafeRouteStop[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<CafeRouteStop[]>((stops, item) => {
    if (!isRecord(item)) {
      return stops;
    }

    const id = getString(item.id);
    const name = getString(item.name);
    const latitude = getFiniteNumber(item.latitude);
    const longitude = getFiniteNumber(item.longitude);
    const createdAt = getTimestamp(item.createdAt);

    if (!id || !name || latitude === undefined || longitude === undefined) {
      return stops;
    }

    const source =
      item.source === 'center' ||
      item.source === 'pin' ||
      item.source === 'search' ||
      item.source === 'address'
        ? item.source
        : 'search';

    stops.push({
      id,
      provider: 'kakao',
      name,
      address: getString(item.address),
      roadAddress: getString(item.roadAddress),
      latitude,
      longitude,
      source,
      order: stops.length + 1,
      benefitNote: getString(item.benefitNote),
      memo: getString(item.memo),
      createdAt,
    });

    return stops;
  }, []);
}

function normalizeCafeRoute(value: unknown): CafeRoute | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = getString(value.id);
  const categoryId = getString(value.categoryId);

  if (!id || !categoryId) {
    return undefined;
  }

  const createdAt = getTimestamp(value.createdAt);

  return {
    id,
    ownerId: getString(value.ownerId),
    categoryId,
    title: normalizeCafeRouteTitle(getString(value.title) ?? ''),
    subjectName: getString(value.subjectName),
    stops: normalizeCafeRouteStops(value.stops),
    createdAt,
    updatedAt: getTimestamp(value.updatedAt, createdAt),
  };
}

async function readCafeRoutes(): Promise<CafeRoute[]> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap(item => {
      const route = normalizeCafeRoute(item);

      return route ? [route] : [];
    });
  } catch {
    return [];
  }
}

async function writeCafeRoutes(routes: CafeRoute[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

async function enqueueCafeRouteMutation(
  mutate: (routes: CafeRoute[]) => CafeRoute[],
): Promise<void> {
  const nextMutation = cafeRouteMutationQueue
    .catch(() => undefined)
    .then(async () => {
      const routes = await readCafeRoutes();
      await writeCafeRoutes(mutate(routes));
    });

  cafeRouteMutationQueue = nextMutation.catch(() => undefined);

  return nextMutation;
}

export async function getCafeRoutesByCategory(
  categoryId: string,
): Promise<CafeRoute[]> {
  const routes = await readCafeRoutes();

  return routes
    .filter(route => route.categoryId === categoryId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveCafeRoute(route: CafeRoute): Promise<void> {
  const normalizedRoute = normalizeCafeRoute(route);

  if (!normalizedRoute) {
    return;
  }

  await enqueueCafeRouteMutation(routes => {
    const existingIndex = routes.findIndex(
      item => item.id === normalizedRoute.id,
    );

    if (existingIndex >= 0) {
      return routes.map(item =>
        item.id === normalizedRoute.id ? normalizedRoute : item,
      );
    }

    return [normalizedRoute, ...routes];
  });
}

export async function deleteCafeRoute(routeId: string): Promise<void> {
  await enqueueCafeRouteMutation(routes =>
    routes.filter(route => route.id !== routeId),
  );
}
