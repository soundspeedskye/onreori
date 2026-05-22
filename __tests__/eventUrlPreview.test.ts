const mockInvoke = jest.fn();
let mockIsSupabaseConfigured = true;
let mockSupabase: unknown = {
  functions: {
    invoke: mockInvoke,
  },
};

jest.mock('../src/config/supabase', () => ({
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured;
  },
  get supabase() {
    return mockSupabase;
  },
}));

import {fetchEventUrlPreview} from '../src/services/eventUrlPreview';

beforeEach(() => {
  jest.clearAllMocks();
  mockIsSupabaseConfigured = true;
  mockSupabase = {
    functions: {
      invoke: mockInvoke,
    },
  };
});

test('invokes the event URL preview edge function with the trimmed https URL', async () => {
  mockInvoke.mockResolvedValue({
    data: {
      url: 'https://example.com/event',
      title: '공연 안내',
      dateCandidates: ['2026-06-01'],
      locationCandidates: ['KSPO DOME'],
      confidence: 'medium',
    },
    error: null,
  });

  await expect(
    fetchEventUrlPreview('  https://example.com/event  '),
  ).resolves.toEqual({
    url: 'https://example.com/event',
    title: '공연 안내',
    dateCandidates: ['2026-06-01'],
    locationCandidates: ['KSPO DOME'],
    confidence: 'medium',
  });

  expect(mockInvoke).toHaveBeenCalledWith('event-url-preview', {
    body: {url: 'https://example.com/event'},
  });
});

test('accepts HTTPS URLs case-insensitively', async () => {
  mockInvoke.mockResolvedValue({
    data: {
      url: 'HTTPS://example.com/event',
      dateCandidates: [],
      locationCandidates: [],
      confidence: 'low',
    },
    error: null,
  });

  await expect(
    fetchEventUrlPreview('  HTTPS://example.com/event  '),
  ).resolves.toEqual({
    url: 'HTTPS://example.com/event',
    dateCandidates: [],
    locationCandidates: [],
    confidence: 'low',
  });

  expect(mockInvoke).toHaveBeenCalledWith('event-url-preview', {
    body: {url: 'HTTPS://example.com/event'},
  });
});

test('throws the Supabase function error message when invoke fails', async () => {
  mockInvoke.mockResolvedValue({
    data: null,
    error: {message: '미리보기를 가져오지 못했습니다.'},
  });

  await expect(
    fetchEventUrlPreview('https://example.com/event'),
  ).rejects.toThrow('미리보기를 가져오지 못했습니다.');
});

const melonTicketHtml = `
  <html>
    <head>
      <meta property="og:title" content="〈Somewhere in Between〉" />
      <meta property="og:description" content="듣다·보다·만나다, 멜론티켓" />
    </head>
    <body>
      <dd class="txt_info" id="periodInfo">2026.05.25 - 2026.05.31</dd>
      <span class="place">플라츠2 성수&nbsp;</span>
    </body>
  </html>
`;

const yanoljaTicketHtml = `
  <html>
    <head>
      <meta property="og:title" content="NOL 티켓 단독 공연" />
      <meta property="og:description" content="공연기간: 2026.06.12 - 2026.06.14 / 장소: 블루스퀘어 마스터카드홀" />
    </head>
    <body>
      <dl>
        <dt>공연기간</dt>
        <dd>2026.06.12 - 2026.06.14</dd>
        <dt>공연장</dt>
        <dd>블루스퀘어 마스터카드홀</dd>
      </dl>
    </body>
  </html>
`;

const naverBookingHtml = `
  <html>
    <head>
      <meta property="og:title" content="서울 전시 예약" />
      <meta property="og:description" content="2026.07.05 - 2026.07.06 / 장소: 성수 스퀘어" />
    </head>
    <body>
      <section>
        <strong>일시</strong>
        <p>2026.07.05 - 2026.07.06</p>
        <strong>장소</strong>
        <p>성수 스퀘어</p>
      </section>
    </body>
  </html>
`;

test('falls back to client-side Melon Ticket parsing when the edge preview is empty', async () => {
  mockInvoke.mockResolvedValue({
    data: {
      url: 'https://ticket.melon.com/performance/index.htm?prodId=213295',
      dateCandidates: [],
      locationCandidates: [],
      confidence: 'low',
    },
    error: null,
  });
  globalThis.fetch = jest.fn().mockResolvedValueOnce(
    new Response(melonTicketHtml, {
      status: 200,
      headers: {'content-type': 'text/html;charset=utf-8'},
    }),
  ) as unknown as typeof fetch;

  await expect(
    fetchEventUrlPreview(
      'https://ticket.melon.com/performance/index.htm?prodId=213295',
    ),
  ).resolves.toEqual({
    url: 'https://ticket.melon.com/performance/index.htm?prodId=213295',
    title: '〈Somewhere in Between〉',
    dateCandidates: ['2026-05-25', '2026-05-31'],
    locationCandidates: ['플라츠2 성수'],
    confidence: 'medium',
  });
});

test('falls back to client-side Melon Ticket parsing when the edge function returns non-2xx', async () => {
  mockInvoke.mockResolvedValue({
    data: null,
    error: {message: 'Edge Function returned a non-2xx status code'},
  });
  globalThis.fetch = jest.fn().mockResolvedValueOnce(
    new Response(melonTicketHtml, {
      status: 200,
      headers: {'content-type': 'text/html;charset=utf-8'},
    }),
  ) as unknown as typeof fetch;

  await expect(
    fetchEventUrlPreview(
      'https://ticket.melon.com/performance/index.htm?prodId=213295',
    ),
  ).resolves.toMatchObject({
    title: '〈Somewhere in Between〉',
    dateCandidates: ['2026-05-25', '2026-05-31'],
    locationCandidates: ['플라츠2 성수'],
  });
});

test('falls back to client-side parsing for supported ticket sites when the edge function returns non-2xx', async () => {
  mockInvoke.mockResolvedValue({
    data: null,
    error: {message: 'Edge Function returned a non-2xx status code'},
  });
  globalThis.fetch = jest.fn().mockResolvedValueOnce(
    new Response(yanoljaTicketHtml, {
      status: 200,
      headers: {'content-type': 'text/html;charset=utf-8'},
    }),
  ) as unknown as typeof fetch;

  await expect(
    fetchEventUrlPreview('https://nol.yanolja.com/ticket/products/12345'),
  ).resolves.toMatchObject({
    title: 'NOL 티켓 단독 공연',
    dateCandidates: ['2026-06-12', '2026-06-14'],
    locationCandidates: ['블루스퀘어 마스터카드홀'],
    confidence: 'medium',
  });
});

test('returns a low confidence preview for supported ticket sites when all preview fetches fail', async () => {
  mockInvoke.mockResolvedValue({
    data: null,
    error: {message: 'Edge Function returned a non-2xx status code'},
  });
  globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('blocked'));

  await expect(
    fetchEventUrlPreview('https://www.ticketbay.co.kr/product/12345'),
  ).resolves.toEqual({
    url: 'https://www.ticketbay.co.kr/product/12345',
    dateCandidates: [],
    locationCandidates: [],
    confidence: 'low',
  });
});

test('falls back to client-side parsing for Naver Booking links when the edge function returns non-2xx', async () => {
  mockInvoke.mockResolvedValue({
    data: null,
    error: {message: 'Edge Function returned a non-2xx status code'},
  });
  globalThis.fetch = jest.fn().mockResolvedValueOnce(
    new Response(naverBookingHtml, {
      status: 200,
      headers: {'content-type': 'text/html;charset=utf-8'},
    }),
  ) as unknown as typeof fetch;

  await expect(
    fetchEventUrlPreview('https://booking.naver.com/booking/12/bizes/12345'),
  ).resolves.toMatchObject({
    title: '서울 전시 예약',
    dateCandidates: ['2026-07-05', '2026-07-06'],
    locationCandidates: ['성수 스퀘어'],
    confidence: 'medium',
  });
});

test('rejects non-https URLs before invoking Supabase', async () => {
  await expect(fetchEventUrlPreview('http://example.com/event')).rejects.toThrow(
    'https:// 주소만 사용할 수 있습니다.',
  );

  expect(mockInvoke).not.toHaveBeenCalled();
});

test('returns a low confidence fallback when Supabase is not configured', async () => {
  mockIsSupabaseConfigured = false;
  mockSupabase = null;

  await expect(
    fetchEventUrlPreview('  https://example.com/event  '),
  ).resolves.toEqual({
    url: 'https://example.com/event',
    dateCandidates: [],
    locationCandidates: [],
    confidence: 'low',
  });

  expect(mockInvoke).not.toHaveBeenCalled();
});

async function loadEdgePreviewHandler(allowedHosts: string | undefined) {
  jest.resetModules();

  const serve = jest.fn();
  const envGet = jest.fn((key: string) =>
    key === 'EVENT_URL_PREVIEW_ALLOWED_HOSTS' ? allowedHosts : undefined,
  );

  (globalThis as typeof globalThis & {
    Deno: {env: {get: typeof envGet}; serve: typeof serve};
  }).Deno = {
    env: {get: envGet},
    serve,
  };

  require('../supabase/functions/event-url-preview/index');

  return serve.mock.calls[0]?.[0] as (request: Request) => Promise<Response>;
}

test('edge function denies previews when no allowed host matches', async () => {
  const handler = await loadEdgePreviewHandler(undefined);
  globalThis.fetch = jest.fn() as unknown as typeof fetch;

  const response = await handler(
    new Request('https://edge.example.test', {
      method: 'POST',
      body: JSON.stringify({url: 'https://events.example.com/event'}),
    }),
  );

  await expect(response.json()).resolves.toEqual({
    error: '링크 정보를 가져오지 못했습니다.',
  });
  expect(response.status).toBe(400);
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

test('edge function previews Melon Ticket links by default', async () => {
  const handler = await loadEdgePreviewHandler(undefined);
  globalThis.fetch = jest.fn().mockResolvedValueOnce(
    new Response(
      `
        <html>
          <head>
            <meta property="og:title" content="〈Somewhere in Between〉" />
            <meta property="og:description" content="듣다·보다·만나다, 멜론티켓" />
          </head>
          <body>
            <dt class="tit_info">공연기간</dt>
            <dd class="txt_info" id="periodInfo">2026.05.25 - 2026.05.31</dd>
            <dt class="tit_info">공연장</dt>
            <dd class="txt_info">
              <a href="javascript:;" id="performanceHallBtn">
                <span class="place">플라츠2 성수&nbsp;</span>
              </a>
            </dd>
          </body>
        </html>
      `,
      {
        status: 200,
        headers: {'content-type': 'text/html;charset=utf-8'},
      },
    ),
  ) as unknown as typeof fetch;

  const response = await handler(
    new Request('https://edge.example.test', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://ticket.melon.com/performance/index.htm?prodId=213295',
      }),
    }),
  );

  await expect(response.json()).resolves.toMatchObject({
    url: 'https://ticket.melon.com/performance/index.htm?prodId=213295',
    title: '〈Somewhere in Between〉',
    dateCandidates: ['2026-05-25', '2026-05-31'],
    locationCandidates: ['플라츠2 성수'],
    confidence: 'medium',
  });
  expect(response.status).toBe(200);
  expect(globalThis.fetch).toHaveBeenCalledWith(
    'https://ticket.melon.com/performance/index.htm?prodId=213295',
    expect.any(Object),
  );
});

test('edge function previews representative ticket sites by default', async () => {
  const handler = await loadEdgePreviewHandler(undefined);
  globalThis.fetch = jest.fn().mockImplementation(() =>
    new Response(yanoljaTicketHtml, {
      status: 200,
      headers: {'content-type': 'text/html;charset=utf-8'},
    }),
  ) as unknown as typeof fetch;

  for (const url of [
    'https://nol.yanolja.com/ticket/products/12345',
    'https://www.ticketbay.co.kr/product/12345',
    'https://ticket.yes24.com/Perf/12345',
    'https://www.ticketlink.co.kr/product/12345',
    'https://booking.naver.com/booking/12/bizes/12345',
  ]) {
    const response = await handler(
      new Request('https://edge.example.test', {
        method: 'POST',
        body: JSON.stringify({url}),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      url,
      title: 'NOL 티켓 단독 공연',
      dateCandidates: ['2026-06-12', '2026-06-14'],
      locationCandidates: ['블루스퀘어 마스터카드홀'],
      confidence: 'medium',
    });
  }
});

test('edge function allows wildcard hosts and blocks disallowed redirect targets', async () => {
  const handler = await loadEdgePreviewHandler('*.example.com');
  globalThis.fetch = jest.fn().mockResolvedValueOnce(
    new Response('', {
      status: 302,
      headers: {location: 'https://evil.example.net/event'},
    }),
  ) as unknown as typeof fetch;

  const response = await handler(
    new Request('https://edge.example.test', {
      method: 'POST',
      body: JSON.stringify({url: 'https://events.example.com/event'}),
    }),
  );

  await expect(response.json()).resolves.toEqual({
    error: '링크 정보를 가져오지 못했습니다.',
  });
  expect(response.status).toBe(400);
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(globalThis.fetch).toHaveBeenCalledWith(
    'https://events.example.com/event',
    expect.any(Object),
  );
});
