import {ALERT_MESSAGES} from '../constants/alertMessages';
import {isSupabaseConfigured, supabase} from '../config/supabase';
import type {EventUrlPreview} from '../types';
import {
  EVENT_URL_PREVIEW_FETCH_HEADERS,
  EVENT_URL_PREVIEW_HTTPS_ONLY_MESSAGE,
  type ParsedEventUrlPreview,
  isSupportedEventUrlPreviewUrl,
  parseEventUrlPreviewHtml,
} from '../utils/eventUrlPreviewParser';

function hasPreviewInfo(preview: EventUrlPreview) {
  return Boolean(
    preview.title ||
      preview.dateCandidates.length > 0 ||
      preview.locationCandidates.length > 0,
  );
}

function createLowConfidencePreview(url: string): EventUrlPreview {
  return {
    url,
    dateCandidates: [],
    locationCandidates: [],
    confidence: 'low',
  };
}

function toAppEventUrlPreview(preview: ParsedEventUrlPreview): EventUrlPreview {
  return {
    url: preview.url,
    title: preview.title,
    dateCandidates: preview.dateCandidates,
    locationCandidates: preview.locationCandidates,
    confidence: preview.confidence,
  };
}

function shouldTryClientSideTicketPreview(
  url: string,
  preview: EventUrlPreview,
) {
  return (
    isSupportedEventUrlPreviewUrl(url) &&
    (!hasPreviewInfo(preview) || preview.locationCandidates.length === 0)
  );
}

async function fetchClientSideTicketPreview(url: string) {
  const response = await fetch(url, {
    headers: EVENT_URL_PREVIEW_FETCH_HEADERS,
  });
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('text/html')) {
    throw new Error(ALERT_MESSAGES.loadFailed);
  }

  return toAppEventUrlPreview(parseEventUrlPreviewHtml(url, await response.text()));
}

export async function fetchEventUrlPreview(
  url: string,
): Promise<EventUrlPreview> {
  const trimmedUrl = url.trim();

  if (!trimmedUrl.toLowerCase().startsWith('https://')) {
    throw new Error(EVENT_URL_PREVIEW_HTTPS_ONLY_MESSAGE);
  }

  if (!isSupabaseConfigured || !supabase) {
    return createLowConfidencePreview(trimmedUrl);
  }

  const {data, error} = await supabase.functions.invoke('event-url-preview', {
    body: {url: trimmedUrl},
  });

  if (error) {
    if (isSupportedEventUrlPreviewUrl(trimmedUrl)) {
      return fetchClientSideTicketPreview(trimmedUrl).catch(() =>
        createLowConfidencePreview(trimmedUrl),
      );
    }

    throw new Error(error.message);
  }

  const preview = data as EventUrlPreview;
  if (shouldTryClientSideTicketPreview(trimmedUrl, preview)) {
    return fetchClientSideTicketPreview(trimmedUrl).catch(() => preview);
  }

  return preview;
}
