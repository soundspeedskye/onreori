import {ALERT_MESSAGES} from '../constants/alertMessages';
import {isSupabaseConfigured, supabase} from '../config/supabase';
import {i18n} from '../i18n';
import type {EventUrlPreview} from '../types';
import {
  EVENT_URL_PREVIEW_FETCH_HEADERS,
  type ParsedEventUrlPreview,
  isSupportedEventUrlPreviewUrl,
  parseEventUrlPreviewHtml,
} from '../utils/eventUrlPreviewParser';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function toPreviewConfidence(value: unknown): EventUrlPreview['confidence'] {
  return value === 'high' || value === 'medium' || value === 'low'
    ? value
    : 'low';
}

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

function normalizeEventUrlPreview(
  value: unknown,
  fallbackUrl: string,
): EventUrlPreview {
  if (!isRecord(value)) {
    return createLowConfidencePreview(fallbackUrl);
  }

  const title = toOptionalString(value.title);
  const description = toOptionalString(value.description);

  return {
    url: toOptionalString(value.url) ?? fallbackUrl,
    ...(title ? {title} : {}),
    ...(description ? {description} : {}),
    dateCandidates: toStringArray(value.dateCandidates),
    locationCandidates: toStringArray(value.locationCandidates),
    confidence: toPreviewConfidence(value.confidence),
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
    throw new Error(i18n.t('eventUrlHttpsOnly', {ns: 'rooms'}));
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

  const preview = normalizeEventUrlPreview(data, trimmedUrl);
  if (shouldTryClientSideTicketPreview(trimmedUrl, preview)) {
    return fetchClientSideTicketPreview(trimmedUrl).catch(() => preview);
  }

  return preview;
}
