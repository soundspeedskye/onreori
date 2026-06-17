import {ALERT_MESSAGES} from '../constants/alertMessages';
import {i18n} from '../i18n';

export type AppliedPreviewValues = {
  eventDate?: string;
  location?: string;
  title?: string;
};

type PreviewField = keyof AppliedPreviewValues;

const EVENT_URL_PREVIEW_FIELD_LABELS: Record<PreviewField, string> = {
  title: 'title',
  eventDate: 'eventDate',
  location: 'location',
};

const EVENT_URL_PREVIEW_FIELDS: PreviewField[] = [
  'title',
  'eventDate',
  'location',
];

export function shouldApplyPreviewValue(
  currentValue: string,
  nextValue: string | undefined,
  previousPreviewValue: string | undefined,
) {
  return Boolean(
    nextValue &&
      (!currentValue.trim() || currentValue === previousPreviewValue),
  );
}

export function getEventUrlPreviewLoadAlert(
  previewValues: AppliedPreviewValues,
) {
  const missingFields = EVENT_URL_PREVIEW_FIELDS.filter(
    field => !previewValues[field]?.trim(),
  );

  if (missingFields.length === EVENT_URL_PREVIEW_FIELDS.length) {
    return {
      title: ALERT_MESSAGES.loadFailed,
      message: i18n.t('preview.noAutoInfo', {ns: 'rooms'}),
    };
  }

  if (missingFields.length > 0) {
    const missingLabels = missingFields
      .map(field => EVENT_URL_PREVIEW_FIELD_LABELS[field])
      .map(labelKey => i18n.t(`preview.fields.${labelKey}`, {ns: 'rooms'}))
      .join(', ');

    return {
      title: ALERT_MESSAGES.partialLoad,
      message: i18n.t('preview.missingFields', {
        fields: missingLabels,
        ns: 'rooms',
      }),
    };
  }

  return {
    title: ALERT_MESSAGES.checkInput,
    message: i18n.t('preview.confirmLoadedInfo', {ns: 'rooms'}),
  };
}
