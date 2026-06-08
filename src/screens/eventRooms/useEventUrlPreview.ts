import type {Dispatch, MutableRefObject, SetStateAction} from 'react';
import {useState} from 'react';

import {fetchEventUrlPreview} from '../../services/eventUrlPreview';
import type {PlaceSelection} from '../../types';
import {ALERT_MESSAGES, showAlert, showError} from '../../utils/appAlert';
import {
  getEventUrlPreviewLoadAlert,
  shouldApplyPreviewValue,
  type AppliedPreviewValues,
} from '../../utils/eventRoomPreviewForm';

type UseEventUrlPreviewParams = {
  eventUrl: string;
  appliedPreviewValuesRef: MutableRefObject<AppliedPreviewValues>;
  setTitle: Dispatch<SetStateAction<string>>;
  setEventDate: Dispatch<SetStateAction<string>>;
  setLocation: Dispatch<SetStateAction<string>>;
  setSelectedPlaceForRoom: Dispatch<SetStateAction<PlaceSelection | null>>;
};

export function useEventUrlPreview({
  eventUrl,
  appliedPreviewValuesRef,
  setTitle,
  setEventDate,
  setLocation,
  setSelectedPlaceForRoom,
}: UseEventUrlPreviewParams) {
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleFetchEventUrlPreview = async () => {
    if (!eventUrl.trim()) {
      showAlert({title: ALERT_MESSAGES.requiredInput});
      return;
    }

    try {
      setPreviewLoading(true);
      const preview = await fetchEventUrlPreview(eventUrl);
      const previewTitle = preview.title;
      const previewDate = preview.dateCandidates[0];
      const previewLocation = preview.locationCandidates[0];
      const previewValues = {
        title: previewTitle,
        eventDate: previewDate,
        location: previewLocation,
      };

      setTitle(current => {
        if (
          !shouldApplyPreviewValue(
            current,
            previewTitle,
            appliedPreviewValuesRef.current.title,
          )
        ) {
          return current;
        }

        appliedPreviewValuesRef.current.title = previewTitle;
        return previewTitle ?? current;
      });
      setEventDate(current => {
        if (
          !shouldApplyPreviewValue(
            current,
            previewDate,
            appliedPreviewValuesRef.current.eventDate,
          )
        ) {
          return current;
        }

        appliedPreviewValuesRef.current.eventDate = previewDate;
        return previewDate ?? current;
      });
      setLocation(current => {
        if (
          !shouldApplyPreviewValue(
            current,
            previewLocation,
            appliedPreviewValuesRef.current.location,
          )
        ) {
          return current;
        }

        setSelectedPlaceForRoom(null);
        appliedPreviewValuesRef.current.location = previewLocation;
        return previewLocation ?? current;
      });
      showAlert(getEventUrlPreviewLoadAlert(previewValues));
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.loadFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return {
    previewLoading,
    handleFetchEventUrlPreview,
  };
}
