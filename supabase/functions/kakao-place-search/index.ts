declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
declare const atob: (data: string) => string;
declare const TextDecoder: {
  new (): {
    decode(input?: Uint8Array): string;
  };
};

type KakaoPlaceDocument = {
  id?: string;
  place_name?: string;
  category_name?: string;
  phone?: string;
  address_name?: string;
  road_address_name?: string;
  x?: string;
  y?: string;
  place_url?: string;
};

type KakaoAddressDetail = {
  address_name?: string;
  x?: string;
  y?: string;
};

type KakaoRoadAddressDetail = KakaoAddressDetail & {
  building_name?: string;
};

type KakaoAddressDocument = {
  address_name?: string;
  address_type?: string;
  x?: string;
  y?: string;
  address?: KakaoAddressDetail | null;
  road_address?: KakaoRoadAddressDetail | null;
};

type KakaoKeywordResponse = {
  documents?: KakaoPlaceDocument[];
  meta?: unknown;
};

type KakaoAddressResponse = {
  documents?: KakaoAddressDocument[];
  meta?: unknown;
};

type KakaoSearchResult = {
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

const KAKAO_KEYWORD_SEARCH_URL =
  'https://dapi.kakao.com/v2/local/search/keyword.json';
const KAKAO_ADDRESS_SEARCH_URL =
  'https://dapi.kakao.com/v2/local/search/address.json';
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const DEFAULT_RADIUS = 20000;
const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;
const MAX_RADIUS = 20000;
const MAX_SIZE = 15;
const MAX_PAGE = 45;

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

function toNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function clampInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const numberValue = toNumber(value);
  if (numberValue === null) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(numberValue)));
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getBoolean(value: unknown) {
  return value === true || value === 'true';
}

function isValidLongitude(value: number | null): value is number {
  return value !== null && value >= 124 && value <= 132;
}

function isValidLatitude(value: number | null): value is number {
  return value !== null && value >= 33 && value <= 39;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function readAuthorizationJwtClaims(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return null;
  }

  const [, token] = match;
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    return null;
  }

  const [, payload] = tokenParts;

  try {
    const claims = JSON.parse(decodeBase64Url(payload));

    return claims && typeof claims === 'object'
      ? (claims as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function isAuthenticatedUserRequest(request: Request) {
  const claims = readAuthorizationJwtClaims(request);

  return (
    claims?.role === 'authenticated' && getString(claims.sub) !== undefined
  );
}

function toPlace(document: KakaoPlaceDocument): KakaoSearchResult | null {
  const latitude = toNumber(document.y);
  const longitude = toNumber(document.x);
  const id = getString(document.id);
  const name = getString(document.place_name);

  if (!id || !name || latitude === null || longitude === null) {
    return null;
  }

  return {
    id,
    name,
    address: getString(document.address_name),
    roadAddress: getString(document.road_address_name),
    latitude,
    longitude,
    categoryName: getString(document.category_name),
    phone: getString(document.phone),
    placeUrl: getString(document.place_url),
    resultType: 'place',
  };
}

function createAddressResultId(
  addressName: string,
  latitude: number,
  longitude: number,
) {
  return `address:${longitude.toFixed(7)}:${latitude.toFixed(7)}:${addressName}`;
}

function toAddressPlace(
  document: KakaoAddressDocument,
): KakaoSearchResult | null {
  const latitude = toNumber(
    document.road_address?.y ?? document.address?.y ?? document.y,
  );
  const longitude = toNumber(
    document.road_address?.x ?? document.address?.x ?? document.x,
  );
  const addressName = getString(
    document.address_name ?? document.address?.address_name,
  );
  const roadAddressName = getString(document.road_address?.address_name);

  if (!addressName || latitude === null || longitude === null) {
    return null;
  }

  const buildingName = getString(document.road_address?.building_name);
  const name = buildingName ?? roadAddressName ?? addressName;

  return {
    id: createAddressResultId(addressName, latitude, longitude),
    name,
    address: addressName,
    roadAddress: roadAddressName,
    latitude,
    longitude,
    categoryName: '주소 위치',
    resultType: 'address',
  };
}

function isAddressLikeQuery(query: string) {
  return (
    /\d/.test(query) ||
    /(시|군|구|읍|면|동|대로|번길|로|길|번지)(\s|$|\d)/.test(query)
  );
}

async function fetchKakaoJson(url: URL, restApiKey: string) {
  let response: Response;

  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${restApiKey}`,
      },
    });
  } catch {
    return {
      errorResponse: jsonResponse(
        { error: 'Kakao 장소 검색 요청에 실패했습니다.' },
        502,
      ),
      payload: null,
    };
  }

  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    const headers: Record<string, string> = {};

    if (response.status === 429 && retryAfter) {
      headers['retry-after'] = retryAfter;
    }

    return {
      errorResponse: jsonResponse(
        { error: 'Kakao 장소 검색 요청에 실패했습니다.' },
        response.status === 429 ? 429 : 502,
        headers,
      ),
      payload: null,
    };
  }

  try {
    return {
      errorResponse: null,
      payload: await response.json(),
    };
  } catch {
    return {
      errorResponse: jsonResponse(
        { error: 'Kakao 장소 검색 응답을 처리하지 못했습니다.' },
        502,
      ),
      payload: null,
    };
  }
}

function createKeywordSearchUrl({
  page,
  query,
  radius,
  size,
  x,
  y,
}: {
  page: number;
  query: string;
  radius: number;
  size: number;
  x: number;
  y: number;
}) {
  const url = new URL(KAKAO_KEYWORD_SEARCH_URL);

  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  url.searchParams.set('x', String(x));
  url.searchParams.set('y', String(y));
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('sort', 'distance');

  return url;
}

function createAddressSearchUrl({
  page,
  query,
  size,
}: {
  page: number;
  query: string;
  size: number;
}) {
  const url = new URL(KAKAO_ADDRESS_SEARCH_URL);

  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));

  return url;
}

function dedupeResults<T extends { id: string }>(results: T[]) {
  const seenIds = new Set<string>();
  const dedupedResults: T[] = [];

  for (const result of results) {
    if (seenIds.has(result.id)) {
      continue;
    }

    seenIds.add(result.id);
    dedupedResults.push(result);
  }

  return dedupedResults;
}

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST only' }, 405);
  }

  if (!isAuthenticatedUserRequest(request)) {
    return jsonResponse({ error: '로그인이 필요한 장소 검색입니다.' }, 401);
  }

  const restApiKey = Deno.env.get('KAKAO_REST_API_KEY');
  if (!restApiKey) {
    return jsonResponse(
      { error: 'Kakao REST API key is not configured.' },
      500,
    );
  }

  let body: Record<string, unknown>;

  try {
    const parsedBody = await request.json();

    if (!parsedBody || typeof parsedBody !== 'object') {
      return jsonResponse(
        { error: '장소 검색 요청이 올바르지 않습니다.' },
        400,
      );
    }

    body = parsedBody as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: '장소 검색 요청이 올바르지 않습니다.' }, 400);
  }

  const query = getString(body.query);

  if (!query || query.length < MIN_QUERY_LENGTH) {
    return jsonResponse({ places: [] });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return jsonResponse({ error: '검색어는 100자 이하로 입력하세요.' }, 400);
  }

  const x = toNumber(body.x);
  const y = toNumber(body.y);

  if (!isValidLongitude(x) || !isValidLatitude(y)) {
    return jsonResponse({ error: '검색 중심 좌표가 올바르지 않습니다.' }, 400);
  }

  const page = clampInteger(body.page, DEFAULT_PAGE, 1, MAX_PAGE);
  const size = clampInteger(body.size, DEFAULT_SIZE, 1, MAX_SIZE);
  const radius = clampInteger(body.radius, DEFAULT_RADIUS, 0, MAX_RADIUS);
  const preferAddress = getBoolean(body.preferAddress);

  const keywordResponse = await fetchKakaoJson(
    createKeywordSearchUrl({page, query, radius, size, x, y}),
    restApiKey,
  );

  if (keywordResponse.errorResponse) {
    return keywordResponse.errorResponse;
  }

  const kakaoKeywordResponse = keywordResponse.payload as KakaoKeywordResponse;
  const placeResults = Array.isArray(kakaoKeywordResponse.documents)
    ? kakaoKeywordResponse.documents
        .map(toPlace)
        .filter(place => place !== null)
    : [];
  const shouldSearchAddress =
    preferAddress || placeResults.length === 0 || isAddressLikeQuery(query);
  let addressResults: KakaoSearchResult[] = [];
  let addressMeta: unknown;

  if (shouldSearchAddress) {
    const addressResponse = await fetchKakaoJson(
      createAddressSearchUrl({page, query, size}),
      restApiKey,
    );

    if (addressResponse.errorResponse) {
      return addressResponse.errorResponse;
    }

    const kakaoAddressResponse = addressResponse.payload as KakaoAddressResponse;
    addressMeta = kakaoAddressResponse.meta;
    addressResults = Array.isArray(kakaoAddressResponse.documents)
      ? kakaoAddressResponse.documents
          .map(toAddressPlace)
          .filter(place => place !== null)
      : [];
  }

  const places = preferAddress || isAddressLikeQuery(query)
    ? dedupeResults([...addressResults, ...placeResults])
    : dedupeResults([...placeResults, ...addressResults]);

  return jsonResponse({
    places,
    meta: {
      address: addressMeta,
      keyword: kakaoKeywordResponse.meta,
    },
  });
});
