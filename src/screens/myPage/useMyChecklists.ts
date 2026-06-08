import {useCallback, useEffect, useState} from 'react';

import {listAccountChecklists} from '../../services/checklistAccount';
import type {AuthUser, RemoteChecklistSummary} from '../../types';
import {ALERT_MESSAGES, showError} from '../../utils/appAlert';

export function useMyChecklists(user: AuthUser | null) {
  const [checklists, setChecklists] = useState<RemoteChecklistSummary[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);

  const loadChecklists = useCallback(async () => {
    if (!user) {
      setChecklists([]);
      return;
    }

    try {
      setLoadingChecklists(true);
      setChecklists(await listAccountChecklists(user));
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
    loadChecklists();
  }, [loadChecklists]);

  return {
    checklists,
    loadingChecklists,
    reloadChecklists: loadChecklists,
  };
}
