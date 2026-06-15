import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '../config/supabase';

import type { Coordinate } from '../screens/mapPicker/useMapCenterSelection';

export type KakaoPlaceSearchResult = {
  id: string;
  name: string;
  address?: string;
  roadAddress?: string;
  latitude: number;
  longitude: number;
  categoryName?: string;
  phone?: string;
  placeUrl?: string;
  resultType: 'place' | 'address';
};

type KakaoPlaceSearchParams = {
  query: string;
  center?: Coordinate;
  preferAddress?: boolean;
  radius?: number;
  page?: number;
  size?: number;
};

type SupabasePlaceSearchResponse = {
  error?: unknown;
  message?: unknown;
  places?: unknown;
};

const DEFAULT_RADIUS = 20000;
const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;
const DEFAULT_ERROR_MESSAGE = '장소를 검색하지 못했습니다.';
const LOGIN_REQUIRED_MESSAGE = '로그인이 필요한 장소 검색입니다.';

function toOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function toFiniteNumber(value: unknown) {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
      ? Number(value)
      : NaN;

  return Number.isFinite(numberValue) ? numberValue : null;
}

function toPlaceSearchResult(value: unknown): KakaoPlaceSearchResult | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const place = value as Record<string, unknown>;
  const id = toOptionalString(place.id);
  const name = toOptionalString(place.name);
  const latitude = toFiniteNumber(place.latitude);
  const longitude = toFiniteNumber(place.longitude);

  if (!id || !name || latitude === null || longitude === null) {
    return null;
  }

  return {
    id,
    name,
    address: toOptionalString(place.address),
    roadAddress: toOptionalString(place.roadAddress),
    latitude,
    longitude,
    categoryName: toOptionalString(place.categoryName),
    phone: toOptionalString(place.phone),
    placeUrl: toOptionalString(place.placeUrl),
    resultType: place.resultType === 'address' ? 'address' : 'place',
  };
}

function normalizeServerErrorMessage(message: string) {
  if (message.toLowerCase().includes('invalid jwt')) {
    return LOGIN_REQUIRED_MESSAGE;
  }

  if (message.includes('Kakao REST API key')) {
    return 'Kakao REST API 키가 Supabase에 설정되지 않았습니다.';
  }

  return message;
}

function getStatusErrorMessage(status: number | undefined) {
  switch (status) {
    case 401:
      return LOGIN_REQUIRED_MESSAGE;
    case 404:
      return '장소 검색 서버 함수가 배포되지 않았습니다.';
    case 429:
      return '장소 검색 요청이 너무 많습니다. 잠시 후 다시 시도하세요.';
    case 500:
      return '장소 검색 서버 설정을 확인하세요.';
    case 502:
      return 'Kakao 장소 검색 요청에 실패했습니다.';
    default:
      return DEFAULT_ERROR_MESSAGE;
  }
}

function getResponseErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const response = payload as Record<string, unknown>;
  const message =
    toOptionalString(response.error) ?? toOptionalString(response.message);

  return message ? normalizeServerErrorMessage(message) : null;
}

async function readFunctionHttpError(error: FunctionsHttpError) {
  const response = error.context as Response | undefined;
  const statusMessage = getStatusErrorMessage(response?.status);

  try {
    const payload = await response?.clone().json();
    return getResponseErrorMessage(payload) ?? statusMessage;
  } catch {
    return statusMessage;
  }
}

async function getFunctionInvokeErrorMessage(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    return readFunctionHttpError(error);
  }

  if (
    error instanceof FunctionsFetchError ||
    error instanceof FunctionsRelayError
  ) {
    return '장소 검색 서버에 연결하지 못했습니다.';
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return normalizeServerErrorMessage(error.message.trim());
  }

  return DEFAULT_ERROR_MESSAGE;
}

export function getPlaceSearchErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message.trim()
    : DEFAULT_ERROR_MESSAGE;
}

export async function searchKakaoPlaces({
  query,
  center,
  preferAddress = false,
  radius = DEFAULT_RADIUS,
  page = DEFAULT_PAGE,
  size = DEFAULT_SIZE,
}: KakaoPlaceSearchParams): Promise<KakaoPlaceSearchResult[]> {
  const trimmedQuery = query.trim();

  if (
    trimmedQuery.length < 2 ||
    !center ||
    !isSupabaseConfigured ||
    !supabase
  ) {
    return [];
  }

  const body: Record<string, number | string> = {
    page,
    query: trimmedQuery,
    radius,
    size,
    x: center.longitude,
    y: center.latitude,
  };

  if (preferAddress) {
    body.preferAddress = 'true';
  }

  const {data: sessionData, error: sessionError} =
    await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE);
  }

  const { data, error } = await supabase.functions.invoke(
    'kakao-place-search',
    {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (error) {
    throw new Error(await getFunctionInvokeErrorMessage(error));
  }

  const response = data as SupabasePlaceSearchResponse;
  const responseErrorMessage = getResponseErrorMessage(response);
  if (responseErrorMessage) {
    throw new Error(responseErrorMessage);
  }

  if (!Array.isArray(response.places)) {
    return [];
  }

  return response.places
    .map(toPlaceSearchResult)
    .filter((place): place is KakaoPlaceSearchResult => place !== null);
}
