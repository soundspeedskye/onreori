import {useCallback, useState} from 'react';

import type {Checklist} from '../../types';
import {ALERT_MESSAGES, showAlert} from '../../utils/appAlert';
import {
  addCustomChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
} from '../../utils/checklistItems';

type UseChecklistItemActionsParams = {
  checklist: Checklist | null;
  persistChecklist: (
    nextChecklist: Checklist,
    options?: {afterPersist?: (targetChecklist: Checklist) => Promise<void>},
  ) => Promise<void>;
  shouldSyncToAccount: (targetChecklist: Checklist) => boolean;
  syncChecklistToAccount: (targetChecklist: Checklist) => Promise<void>;
};

export function useChecklistItemActions({
  checklist,
  persistChecklist,
  shouldSyncToAccount,
  syncChecklistToAccount,
}: UseChecklistItemActionsParams) {
  const [customItemDescription, setCustomItemDescription] = useState('');
  const [customItemName, setCustomItemName] = useState('');

  const getSyncAfterPersist = useCallback(
    (targetChecklist: Checklist) =>
      shouldSyncToAccount(targetChecklist) ? syncChecklistToAccount : undefined,
    [shouldSyncToAccount, syncChecklistToAccount],
  );

  const toggleItem = useCallback(
    async (itemId: string) => {
      if (!checklist) {
        return;
      }

      const nextChecklist = toggleChecklistItem(checklist, itemId);
      await persistChecklist(nextChecklist, {
        afterPersist: getSyncAfterPersist(checklist),
      });
    },
    [checklist, getSyncAfterPersist, persistChecklist],
  );

  const handleAddCustomItem = useCallback(async () => {
    if (!checklist) {
      return;
    }

    const nextName = customItemName.trim();

    if (!nextName) {
      showAlert({title: ALERT_MESSAGES.requiredInput});
      return;
    }

    const nextChecklist = addCustomChecklistItem(checklist, {
      id: `custom-${Date.now()}`,
      name: nextName,
      description: customItemDescription,
    });

    setCustomItemDescription('');
    setCustomItemName('');
    await persistChecklist(nextChecklist, {
      afterPersist: getSyncAfterPersist(checklist),
    });
  }, [
    checklist,
    customItemDescription,
    customItemName,
    getSyncAfterPersist,
    persistChecklist,
  ]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!checklist) {
        return;
      }

      const nextChecklist = deleteChecklistItem(checklist, itemId);

      if (nextChecklist === checklist) {
        return;
      }

      await persistChecklist(nextChecklist, {
        afterPersist: getSyncAfterPersist(checklist),
      });
    },
    [checklist, getSyncAfterPersist, persistChecklist],
  );

  return {
    customItemDescription,
    setCustomItemDescription,
    customItemName,
    setCustomItemName,
    toggleItem,
    handleAddCustomItem,
    handleDeleteItem,
  };
}
