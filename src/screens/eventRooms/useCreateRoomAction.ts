import {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {isCafeEventCategory} from '../../constants/eventCategories';
import {createRoom} from '../../services/rooms';
import type {AuthUser, EventCategory, EventRoom} from '../../types';
import {ALERT_MESSAGES, showAlert, showError} from '../../utils/appAlert';
import {
  EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT,
  EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT,
} from '../../utils/date';
import {
  buildRoomTitle,
  validateRoomCreationDraft,
  type RoomCreationConfig,
} from '../../utils/eventRoomForm';
import {
  getPrimaryRoomLanguage,
  normalizeRoomLanguageCodes,
} from '../../utils/eventRoomLanguages';
import {shouldShowRoomInTodayList} from '../../utils/eventRoomVisibility';
import type {useRoomCreationForm} from './useRoomCreationForm';

type RoomCreationForm = ReturnType<typeof useRoomCreationForm>;

type UseCreateRoomActionParams = {
  user: AuthUser | null;
  category: EventCategory | undefined;
  creationConfig: RoomCreationConfig;
  form: RoomCreationForm;
  onVisibleRoomCreated: (room: EventRoom) => void;
};

export function useCreateRoomAction({
  user,
  category,
  creationConfig,
  form,
  onVisibleRoomCreated,
}: UseCreateRoomActionParams) {
  const {t: tRooms} = useTranslation('rooms');
  const [creating, setCreating] = useState(false);
  const {
    eventDate,
    eventUrl,
    languageCodes: formLanguageCodes,
    location,
    newRoomCode,
    reset,
    selectedPlaceForRoom: selectedPlaceForRoomDraft,
    title,
  } = form;

  const handleCreateRoom = useCallback(async () => {
    if (!user || !category) {
      return;
    }

    const validationMessage = validateRoomCreationDraft(category.id, {
      title,
      eventDate,
      entryCode: newRoomCode,
      location,
    });

    if (validationMessage) {
      showAlert({title: validationMessage});
      return;
    }

    try {
      setCreating(true);
      const selectedPlaceForRoom = creationConfig.requiresPlace
        ? selectedPlaceForRoomDraft
        : undefined;
      const languageCodes = normalizeRoomLanguageCodes(formLanguageCodes);
      const primaryLanguage = getPrimaryRoomLanguage(languageCodes);
      const room = await createRoom({
        categoryId: category.id,
        title: buildRoomTitle(category.id, title, primaryLanguage),
        eventDate,
        location: creationConfig.requiresPlace ? location : '',
        eventUrl: creationConfig.allowsEventUrlPreview
          ? eventUrl
          : undefined,
        locationName: selectedPlaceForRoom?.name,
        address: selectedPlaceForRoom?.address,
        roadAddress: selectedPlaceForRoom?.roadAddress,
        latitude: selectedPlaceForRoom?.latitude,
        longitude: selectedPlaceForRoom?.longitude,
        subjectName: isCafeEventCategory(category.id)
          ? title.trim()
          : undefined,
        primaryLanguage,
        languageCodes,
        entryCode: newRoomCode,
        user,
      });
      if (shouldShowRoomInTodayList(room)) {
        onVisibleRoomCreated(room);
      } else {
        showAlert({
          title: tRooms('createdTitle'),
          message: tRooms('createdInactiveNotice', {
            beforeCount: EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT,
            afterCount: EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT,
          }),
        });
      }
      reset();
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.createFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setCreating(false);
    }
  }, [
    category,
    creationConfig.allowsEventUrlPreview,
    creationConfig.requiresPlace,
    eventDate,
    eventUrl,
    formLanguageCodes,
    location,
    newRoomCode,
    onVisibleRoomCreated,
    reset,
    selectedPlaceForRoomDraft,
    tRooms,
    title,
    user,
  ]);

  return {
    creating,
    handleCreateRoom,
  };
}
