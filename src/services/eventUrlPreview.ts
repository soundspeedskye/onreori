import {isSupabaseConfigured, supabase} from '../config/supabase';
import type {EventUrlPreview} from '../types';

const HTTPS_ONLY_MESSAGE = 'https:// 주소만 사용할 수 있습니다.';
const SUPPORTED_TICKET_HOST_ENTRIES = [
  'ticket.melon.com',
  'nol.yanolja.com',
  '*.yanolja.com',
  'www.ticketbay.co.kr',
  'ticketbay.co.kr',
  'ticket.yes24.com',
  'www.yes24.com',
  'yes24.com',
  'tickets.interpark.com',
  'ticket.interpark.com',
  '*.interpark.com',
  'www.ticketlink.co.kr',
  'ticketlink.co.kr',
  'booking.naver.com',
  'm.booking.naver.com',
];
const TICKET_FETCH_HEADERS = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'ko,en;q=0.8',
};

function decodeHtmlEntity(value: string) {
  return value
    .split('&amp;')
    .join('&')
    .split('&apos;')
    .join("'")
    .split('&gt;')
    .join('>')
    .split('&lt;')
    .join('<')
    .split('&nbsp;')
    .join(' ')
    .split('&quot;')
    .join('"');
}

function normalizeWhitespace(value: string) {
  return decodeHtmlEntity(value).replace(/\s+/g, ' ').trim();
}

function readAttribute(tag: string, attributeName: string) {
  const pattern = new RegExp(`${attributeName}=["']([^"']*)["']`, 'i');
  return tag.match(pattern)?.[1];
}

function readMetaContent(html: string, property: string) {
  const lowerHtml = html.toLowerCase();
  let index = 0;

  while (index >= 0) {
    const metaStart = lowerHtml.indexOf('<meta', index);
    if (metaStart < 0) {
      return undefined;
    }

    const metaEnd = html.indexOf('>', metaStart);
    if (metaEnd < 0) {
      return undefined;
    }

    const tag = html.slice(metaStart, metaEnd + 1);
    const tagProperty =
      readAttribute(tag, 'property') ?? readAttribute(tag, 'name');

    if (tagProperty?.toLowerCase() === property.toLowerCase()) {
      return readAttribute(tag, 'content');
    }

    index = metaEnd + 1;
  }

  return undefined;
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, ' ');
}

function extractTitle(html: string) {
  const metaTitle =
    readMetaContent(html, 'og:title') ?? readMetaContent(html, 'twitter:title');
  if (metaTitle) {
    return normalizeWhitespace(metaTitle);
  }

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? normalizeWhitespace(title) : undefined;
}

function extractDescription(html: string) {
  const description =
    readMetaContent(html, 'og:description') ??
    readMetaContent(html, 'description') ??
    readMetaContent(html, 'twitter:description');

  return description ? normalizeWhitespace(description) : undefined;
}

function toIsoDate(year: string, month: string, day: string) {
  const normalizedYear =
    year.length === 2 ? `20${year}` : year.padStart(4, '0');
  return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function cleanLocationCandidate(value: string) {
  let candidate = normalizeWhitespace(value).replace(/[,.]$/, '');
  const nextLabelIndex = candidate.search(
    /\s(?:공연기간|기간|일시|날짜|공연장|장소|위치|행사장)(?:\s|[:：]|$)/,
  );

  if (nextLabelIndex > 0) {
    candidate = candidate.slice(0, nextLabelIndex);
  }

  return candidate
    .replace(/^(?:티켓링크|ticketlink|네이버 예약|MY플레이스 홈|MY플레이스)\s*/i, '')
    .replace(/^[0-9.\-\s년월일~]+/, '')
    .replace(/^(?:공연장|장소|위치|행사장)\s*/, '')
    .trim();
}

function isUsefulLocationCandidate(value: string) {
  return Boolean(value) && !/고객\s*센터|고객센터|MY플레이스/i.test(value);
}

function extractDateCandidates(text: string) {
  const candidates: string[] = [];
  const patterns = [
    /([12][0-9][0-9][0-9])[-./년]\s*([0-9]{1,2})[-./월]\s*([0-9]{1,2})\s*일?/g,
    /([0-9]{2})[.]\s*([0-9]{1,2})[.]\s*([0-9]{1,2})/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      candidates.push(toIsoDate(match[1], match[2], match[3]));
    }
  }

  return unique(candidates).slice(0, 5);
}

function extractStructuredLocationCandidates(html: string) {
  const candidates: string[] = [];
  const placePattern =
    /<span\b(?=[^>]*class=["'][^"']*\bplace\b[^"']*["'])[^>]*>([\s\S]*?)<\/span>/gi;

  for (const match of html.matchAll(placePattern)) {
    const place = normalizeWhitespace(stripTags(match[1]));
    if (place) {
      candidates.push(place);
    }
  }

  return unique(candidates).slice(0, 5);
}

function extractTextLocationCandidates(text: string) {
  const candidates: string[] = [];
  const patterns = [
    /(?:장소|위치|공연장|행사장)\s*[:：]\s*([^\n\r<|/]{2,60})/g,
    /([가-힣A-Za-z0-9\s]+(?:DOME|돔|홀|센터|광장|카페|팝업|스퀘어|아레나|스타디움))/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      candidates.push(cleanLocationCandidate(match[1]));
    }
  }

  return unique(candidates.filter(isUsefulLocationCandidate)).slice(0, 5);
}

function parseEventUrlPreviewHtml(url: string, html: string): EventUrlPreview {
  const plainText = normalizeWhitespace(stripTags(html));
  const title = extractTitle(html);
  const description = extractDescription(html);
  const dateCandidates = extractDateCandidates(
    `${title ?? ''} ${description ?? ''} ${plainText}`,
  );
  const locationCandidates = unique([
    ...extractStructuredLocationCandidates(html),
    ...extractTextLocationCandidates(
      `${title ?? ''} ${description ?? ''} ${plainText}`,
    ),
  ]).slice(0, 5);

  return {
    url,
    title,
    dateCandidates,
    locationCandidates,
    confidence: title && dateCandidates.length > 0 ? 'medium' : 'low',
  };
}

function hasPreviewInfo(preview: EventUrlPreview) {
  return Boolean(
    preview.title ||
      preview.dateCandidates.length > 0 ||
      preview.locationCandidates.length > 0,
  );
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function isSupportedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  return SUPPORTED_TICKET_HOST_ENTRIES.some(entry => {
    if (entry.startsWith('*.')) {
      const baseHost = entry.slice(2);
      return Boolean(baseHost) && normalized.endsWith(`.${baseHost}`);
    }

    return normalized === entry;
  });
}

function isSupportedTicketUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol.toLowerCase() === 'https:' &&
      isSupportedHostname(parsedUrl.hostname)
    );
  } catch {
    return false;
  }
}

function createLowConfidencePreview(url: string): EventUrlPreview {
  return {
    url,
    dateCandidates: [],
    locationCandidates: [],
    confidence: 'low',
  };
}

async function fetchClientSideTicketPreview(url: string) {
  const response = await fetch(url, {
    headers: TICKET_FETCH_HEADERS,
  });
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('text/html')) {
    throw new Error('티켓 페이지를 가져오지 못했습니다.');
  }

  return parseEventUrlPreviewHtml(url, await response.text());
}

export async function fetchEventUrlPreview(
  url: string,
): Promise<EventUrlPreview> {
  const trimmedUrl = url.trim();

  if (!trimmedUrl.toLowerCase().startsWith('https://')) {
    throw new Error(HTTPS_ONLY_MESSAGE);
  }

  if (!isSupabaseConfigured || !supabase) {
    return createLowConfidencePreview(trimmedUrl);
  }

  const {data, error} = await supabase.functions.invoke('event-url-preview', {
    body: {url: trimmedUrl},
  });

  if (error) {
    if (isSupportedTicketUrl(trimmedUrl)) {
      return fetchClientSideTicketPreview(trimmedUrl).catch(() =>
        createLowConfidencePreview(trimmedUrl),
      );
    }

    throw new Error(error.message);
  }

  const preview = data as EventUrlPreview;
  if (!hasPreviewInfo(preview) && isSupportedTicketUrl(trimmedUrl)) {
    return fetchClientSideTicketPreview(trimmedUrl).catch(() => preview);
  }

  return preview;
}
