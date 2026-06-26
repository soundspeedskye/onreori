import {useCallback, useEffect, useRef, useState} from 'react';

import {listMyRooms, type MyRooms} from '../../services/rooms';
import type {AuthUser} from '../../types';
import {ALERT_MESSAGES, showError} from '../../utils/appAlert';

type LoadOptions = {
  force?: boolean;
};

export function useMyRooms(user: AuthUser | null, enabled: boolean) {
  const [myRooms, setMyRooms] = useState<MyRooms>({
    createdRooms: [],
    joinedRooms: [],
  });
  const [loadingMyRooms, setLoadingMyRooms] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);

  const loadMyRooms = useCallback(async (options: LoadOptions = {}) => {
    const force = options.force === true;

    if (!user) {
      loadedUserIdRef.current = null;
      setMyRooms({createdRooms: [], joinedRooms: []});
      setLoadingMyRooms(false);
      return;
    }

    if (!force && loadedUserIdRef.current === user.id) {
      return;
    }

    try {
      setLoadingMyRooms(true);
      setMyRooms(await listMyRooms(user));
      loadedUserIdRef.current = user.id;
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
    if (loadedUserIdRef.current && loadedUserIdRef.current !== user?.id) {
      loadedUserIdRef.current = null;
      setMyRooms({createdRooms: [], joinedRooms: []});
    }

    if (!user) {
      setLoadingMyRooms(false);
    }
  }, [user]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    loadMyRooms();
  }, [enabled, loadMyRooms]);
  const reloadMyRooms = useCallback(
    () => loadMyRooms({force: true}),
    [loadMyRooms],
  );

  return {
    myRooms,
    loadingMyRooms,
    reloadMyRooms,
  };
}
