import {ALERT_MESSAGES} from '../constants/alertMessages';

export type AppliedPreviewValues = {
  eventDate?: string;
  location?: string;
  title?: string;
};

type PreviewField = keyof AppliedPreviewValues;

const EVENT_URL_PREVIEW_FIELD_LABELS: Record<PreviewField, string> = {
  title: '제목',
  eventDate: '날짜',
  location: '장소',
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
      message:
        '자동으로 불러올 수 있는 정보가 없습니다. 제목, 날짜, 장소를 직접 입력해 주세요.',
    };
  }

  if (missingFields.length > 0) {
    const missingLabels = missingFields
      .map(field => EVENT_URL_PREVIEW_FIELD_LABELS[field])
      .join(', ');

    return {
      title: ALERT_MESSAGES.partialLoad,
      message: `${missingLabels}는 직접 입력해 주세요.`,
    };
  }

  return {
    title: ALERT_MESSAGES.checkInput,
    message: '불러온 정보가 정확한지 확인해 주세요. 필요한 경우 수정할 수 있습니다.',
  };
}
