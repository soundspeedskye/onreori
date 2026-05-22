import {MAX_HTML_BYTES} from './constants.ts';
import {parseEventUrlPreviewHtml} from './parser.ts';
import {fetchHtmlWithSafeRedirects, getAllowedHostEntries} from './urlSafety.ts';

declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

async function readCappedText(response: Response) {
  const html = await response.text();
  return html.slice(0, MAX_HTML_BYTES);
}

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return jsonResponse({error: 'POST only'}, 405);
  }

  try {
    const body = (await request.json()) as {url?: unknown};
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const parsedUrl = new URL(rawUrl);
    const allowedHostEntries = getAllowedHostEntries();
    const response = await fetchHtmlWithSafeRedirects(
      parsedUrl,
      allowedHostEntries,
    );

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('text/html')) {
      return jsonResponse({error: 'HTML 페이지가 아닙니다.'}, 415);
    }

    return jsonResponse(
      parseEventUrlPreviewHtml(rawUrl, await readCappedText(response)),
    );
  } catch {
    return jsonResponse({error: '링크 정보를 가져오지 못했습니다.'}, 400);
  }
});
