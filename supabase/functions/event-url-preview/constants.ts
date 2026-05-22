export const MAX_HTML_BYTES = 500_000;
export const MAX_REDIRECTS = 5;
export const FETCH_TIMEOUT_MS = 8_000;
export const ALLOWED_HOSTS_ENV = 'EVENT_URL_PREVIEW_ALLOWED_HOSTS';
export const DEFAULT_ALLOWED_HOST_ENTRIES = [
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
export const HTTPS_ONLY_MESSAGE = 'https:// 주소만 사용할 수 있습니다.';
export const PREVIEW_FETCH_HEADERS = {
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'ko,en;q=0.8',
  'user-agent':
    'Mozilla/5.0 (compatible; onreori-event-url-preview/1.0)',
};
export const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
