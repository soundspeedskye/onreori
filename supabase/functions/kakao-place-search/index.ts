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

type KakaoKeywordResponse = {
  documents?: KakaoPlaceDocument[];
  meta?: unknown;
};

const KAKAO_KEYWORD_SEARCH_URL =
  'https://dapi.kakao.com/v2/local/search/keyword.json';
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

function toPlace(document: KakaoPlaceDocument) {
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
  };
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
  const url = new URL(KAKAO_KEYWORD_SEARCH_URL);

  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  url.searchParams.set('x', String(x));
  url.searchParams.set('y', String(y));
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('sort', 'distance');

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${restApiKey}`,
      },
    });
  } catch {
    return jsonResponse({ error: 'Kakao 장소 검색 요청에 실패했습니다.' }, 502);
  }

  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    const headers: Record<string, string> = {};

    if (response.status === 429 && retryAfter) {
      headers['retry-after'] = retryAfter;
    }

    return jsonResponse(
      { error: 'Kakao 장소 검색 요청에 실패했습니다.' },
      response.status === 429 ? 429 : 502,
      headers,
    );
  }

  try {
    const kakaoResponse = (await response.json()) as KakaoKeywordResponse;
    const places = Array.isArray(kakaoResponse.documents)
      ? kakaoResponse.documents.map(toPlace).filter(place => place !== null)
      : [];

    return jsonResponse({
      places,
      meta: kakaoResponse.meta,
    });
  } catch {
    return jsonResponse(
      { error: 'Kakao 장소 검색 응답을 처리하지 못했습니다.' },
      502,
    );
  }
});
