import { useState } from 'react';

import { isCafeEventCategory } from '../../constants/eventCategories';
import { createRoom } from '../../services/rooms';
import type { AuthUser, EventCategory, EventRoom } from '../../types';
import { ALERT_MESSAGES, showAlert, showError } from '../../utils/appAlert';
import {
  EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT,
  EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT,
} from '../../utils/date';
import {
  buildRoomTitle,
  validateRoomCreationDraft,
  type RoomCreationConfig,
} from '../../utils/eventRoomForm';
import { shouldShowRoomInTodayList } from '../../utils/eventRoomVisibility';
import type { useRoomCreationForm } from './useRoomCreationForm';

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
  const [creating, setCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!user || !category) {
      return;
    }

    const validationMessage = validateRoomCreationDraft(category.id, {
      title: form.title,
      eventDate: form.eventDate,
      entryCode: form.newRoomCode,
      location: form.location,
    });

    if (validationMessage) {
      showAlert({ title: validationMessage });
      return;
    }

    try {
      setCreating(true);
      const selectedPlaceForRoom = creationConfig.requiresPlace
        ? form.selectedPlaceForRoom
        : undefined;
      const room = await createRoom({
        categoryId: category.id,
        title: buildRoomTitle(category.id, form.title),
        eventDate: form.eventDate,
        location: creationConfig.requiresPlace ? form.location : '',
        eventUrl: creationConfig.allowsEventUrlPreview
          ? form.eventUrl
          : undefined,
        locationName: selectedPlaceForRoom?.name,
        address: selectedPlaceForRoom?.address,
        roadAddress: selectedPlaceForRoom?.roadAddress,
        latitude: selectedPlaceForRoom?.latitude,
        longitude: selectedPlaceForRoom?.longitude,
        subjectName: isCafeEventCategory(category.id)
          ? form.title.trim()
          : undefined,
        entryCode: form.newRoomCode,
        user,
      });
      if (shouldShowRoomInTodayList(room)) {
        onVisibleRoomCreated(room);
      } else {
        showAlert({
          title: '생성했습니다.',
          message: `이 단톡방은 이벤트 ${EVENT_ROOM_ACTIVE_DAYS_BEFORE_EVENT}일 전부터 ${EVENT_ROOM_ACTIVE_DAYS_AFTER_EVENT}일 후까지 오늘의 단톡방에 표시됩니다.`,
        });
      }
      form.reset();
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.createFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setCreating(false);
    }
  };

  return {
    creating,
    handleCreateRoom,
  };
}
