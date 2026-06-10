import {
  ALLOWED_HOSTS_ENV,
  DEFAULT_ALLOWED_HOST_ENTRIES,
  FETCH_TIMEOUT_MS,
  HTTPS_ONLY_MESSAGE,
  MAX_REDIRECTS,
  PREVIEW_FETCH_HEADERS,
  REDIRECT_STATUSES,
} from './constants.ts';
import type {FetchInit} from './types.ts';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeHostname(hostname: string) {
  let normalized = hostname.trim().toLowerCase();
  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    normalized = normalized.slice(1, -1);
  }

  const zoneIndex = normalized.indexOf('%');
  if (zoneIndex >= 0) {
    normalized = normalized.slice(0, zoneIndex);
  }

  return normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
}

function parseIpv4Octets(hostname: string) {
  const parts = hostname.split('.');
  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map(part => Number(part));
  if (
    octets.some(
      (octet, partIndex) =>
        !Number.isInteger(octet) ||
        octet < 0 ||
        octet > 255 ||
        String(octet) !== parts[partIndex],
    )
  ) {
    return null;
  }

  return octets;
}

function isPrivateIpv4(octets: number[]) {
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function parseIpv4MappedIpv6(hostname: string) {
  if (!hostname.startsWith('::ffff:')) {
    return null;
  }

  const suffix = hostname.slice('::ffff:'.length);
  const dotted = parseIpv4Octets(suffix);
  if (dotted) {
    return dotted;
  }

  const hextets = suffix.split(':');
  if (hextets.length !== 2) {
    return null;
  }

  const values = hextets.map(hextet => Number.parseInt(hextet, 16));
  if (
    values.some(
      value => Number.isNaN(value) || value < 0 || value > 0xffff,
    )
  ) {
    return null;
  }

  return [
    Math.floor(values[0] / 256),
    values[0] % 256,
    Math.floor(values[1] / 256),
    values[1] % 256,
  ];
}

function isBlockedIpv6(hostname: string) {
  if (hostname === '::' || hostname === '::1') {
    return true;
  }

  const mappedIpv4 = parseIpv4MappedIpv6(hostname);
  if (mappedIpv4) {
    return isPrivateIpv4(mappedIpv4);
  }

  const firstHextet = Number.parseInt(hostname.split(':')[0], 16);
  if (Number.isNaN(firstHextet)) {
    return false;
  }

  return (
    (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) ||
    (firstHextet >= 0xfc00 && firstHextet <= 0xfdff)
  );
}

function isBlockedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local')
  ) {
    return true;
  }

  const ipv4 = parseIpv4Octets(normalized);
  if (ipv4) {
    return isPrivateIpv4(ipv4);
  }

  return normalized.includes(':') && isBlockedIpv6(normalized);
}

export function getAllowedHostEntries() {
  const configuredEntries = (Deno.env.get(ALLOWED_HOSTS_ENV) ?? '')
    .split(',')
    .map(entry => normalizeHostname(entry))
    .filter(Boolean);

  return unique([...DEFAULT_ALLOWED_HOST_ENTRIES, ...configuredEntries]);
}

function isAllowedHostname(hostname: string, allowedEntries: string[]) {
  const normalized = normalizeHostname(hostname);

  return allowedEntries.some(entry => {
    if (entry.startsWith('*.')) {
      const baseHost = entry.slice(2);
      return Boolean(baseHost) && normalized.endsWith(`.${baseHost}`);
    }

    return normalized === entry;
  });
}

function assertSafeHttpsUrl(url: URL, allowedHostEntries: string[]) {
  if (url.protocol !== 'https:') {
    throw new Error(HTTPS_ONLY_MESSAGE);
  }

  if (
    isBlockedHostname(url.hostname) ||
    !isAllowedHostname(url.hostname, allowedHostEntries)
  ) {
    throw new Error('허용되지 않는 주소입니다.');
  }
}

export async function fetchHtmlWithSafeRedirects(
  startUrl: URL,
  allowedHostEntries: string[],
) {
  let currentUrl = startUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    assertSafeHttpsUrl(currentUrl, allowedHostEntries);

    const abortController = new AbortController();
    const timeoutId = setTimeout(
      () => abortController.abort(),
      FETCH_TIMEOUT_MS,
    );

    let response: Response;
    try {
      response = await fetch(currentUrl.toString(), {
        redirect: 'manual',
        headers: PREVIEW_FETCH_HEADERS,
        signal: abortController.signal,
      } as FetchInit);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!REDIRECT_STATUSES.has(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new Error('리디렉션 주소가 없습니다.');
    }

    const nextUrl = new URL(location, currentUrl);
    assertSafeHttpsUrl(nextUrl, allowedHostEntries);
    currentUrl = nextUrl;
  }

  throw new Error('리디렉션이 너무 많습니다.');
}
