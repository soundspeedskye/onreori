import {useCallback, useEffect, useRef, useState} from 'react';

import {listAccountChecklists} from '../../services/checklistAccount';
import type {AuthUser, RemoteChecklistSummary} from '../../types';
import {ALERT_MESSAGES, showError} from '../../utils/appAlert';

type LoadOptions = {
  force?: boolean;
};

export function useMyChecklists(user: AuthUser | null, enabled: boolean) {
  const [checklists, setChecklists] = useState<RemoteChecklistSummary[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);

  const loadChecklists = useCallback(async (options: LoadOptions = {}) => {
    const force = options.force === true;

    if (!user) {
      loadedUserIdRef.current = null;
      setChecklists([]);
      setLoadingChecklists(false);
      return;
    }

    if (!force && loadedUserIdRef.current === user.id) {
      return;
    }

    try {
      setLoadingChecklists(true);
      setChecklists(await listAccountChecklists(user));
      loadedUserIdRef.current = user.id;
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.loadFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setLoadingChecklists(false);
    }
  }, [user]);

  useEffect(() => {
    if (loadedUserIdRef.current && loadedUserIdRef.current !== user?.id) {
      loadedUserIdRef.current = null;
      setChecklists([]);
    }

    if (!user) {
      setLoadingChecklists(false);
    }
  }, [user]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    loadChecklists();
  }, [enabled, loadChecklists]);
  const reloadChecklists = useCallback(
    () => loadChecklists({force: true}),
    [loadChecklists],
  );

  return {
    checklists,
    loadingChecklists,
    reloadChecklists,
  };
}
