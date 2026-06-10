import {useCallback, useEffect, useState} from 'react';

import {listMyRooms, type MyRooms} from '../../services/rooms';
import type {AuthUser} from '../../types';
import {ALERT_MESSAGES, showError} from '../../utils/appAlert';

export function useMyRooms(user: AuthUser | null) {
  const [myRooms, setMyRooms] = useState<MyRooms>({
    createdRooms: [],
    joinedRooms: [],
  });
  const [loadingMyRooms, setLoadingMyRooms] = useState(false);

  const loadMyRooms = useCallback(async () => {
    if (!user) {
      setMyRooms({createdRooms: [], joinedRooms: []});
      return;
    }

    try {
      setLoadingMyRooms(true);
      setMyRooms(await listMyRooms(user));
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.loadFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setLoadingMyRooms(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyRooms();
  }, [loadMyRooms]);

  return {
    myRooms,
    loadingMyRooms,
    reloadMyRooms: loadMyRooms,
  };
}
