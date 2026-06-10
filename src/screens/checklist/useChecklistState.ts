import {useEffect, useMemo, useState} from 'react';

import {getChecklistById, saveChecklist} from '../../storage/checklists';
import type {Checklist} from '../../types';
import {getSelectedConditionLabels} from '../../utils/checklistPresentation';
import {groupChecklistItemsBySection} from '../../utils/checklistItems';

export function useChecklistState(checklistId: string) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  useEffect(() => {
    const loadChecklist = async () => {
      const storedChecklist = await getChecklistById(checklistId);
      setChecklist(storedChecklist ?? null);
    };

    loadChecklist();
  }, [checklistId]);

  const groupedItems = useMemo(
    () => (checklist ? groupChecklistItemsBySection(checklist.items) : []),
    [checklist],
  );

  const selectedConditionLabels = useMemo(
    () =>
      checklist ? getSelectedConditionLabels(checklist.selectedConditions) : [],
    [checklist],
  );

  const checkedCount = useMemo(
    () => checklist?.items.filter(item => item.checked).length ?? 0,
    [checklist],
  );

  const persistChecklist = async (
    nextChecklist: Checklist,
    options: {afterPersist?: (targetChecklist: Checklist) => Promise<void>} = {},
  ) => {
    setChecklist(nextChecklist);
    await saveChecklist(nextChecklist);

    if (options.afterPersist) {
      await options.afterPersist(nextChecklist);
    }
  };

  return {
    checklist,
    setChecklist,
    groupedItems,
    selectedConditionLabels,
    checkedCount,
    persistChecklist,
  };
}
