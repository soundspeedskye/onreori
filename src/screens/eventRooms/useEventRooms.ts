import {useCallback, useState} from 'react';

import {
  getTutorialRoomForCategory,
  listRoomsByCategory,
} from '../../services/rooms';
import type {EventRoom} from '../../types';

export function useEventRooms(categoryId: string | undefined) {
  const [rooms, setRooms] = useState<EventRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingTutorialFallback, setUsingTutorialFallback] = useState(false);

  const loadRooms = useCallback(async () => {
    if (!categoryId) {
      return;
    }

    setLoading(true);
    try {
      setRooms(await listRoomsByCategory(categoryId));
      setUsingTutorialFallback(false);
    } catch {
      setRooms([getTutorialRoomForCategory(categoryId)]);
      setUsingTutorialFallback(true);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const addRoomToList = useCallback((room: EventRoom) => {
    setRooms(current => [room, ...current]);
  }, []);

  return {
    rooms,
    loading,
    usingTutorialFallback,
    loadRooms,
    addRoomToList,
  };
}
