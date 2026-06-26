import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {getChecklistById, saveChecklist} from '../../storage/checklists';
import type {Checklist} from '../../types';
import {getSelectedConditionLabels} from '../../utils/checklistTemplateTranslations';
import {groupChecklistItemsBySection} from '../../utils/checklistItems';

export function useChecklistState(checklistId: string) {
  const {t: tTemplates} = useTranslation('checklistTemplates');
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  useEffect(() => {
    const loadChecklist = async () => {
      const storedChecklist = await getChecklistById(checklistId);
      setChecklist(storedChecklist ?? null);
    };

    loadChecklist();
  }, [checklistId]);

  const groupedItems = useMemo(
    () =>
      checklist
        ? groupChecklistItemsBySection(checklist.items, {
            templateId: checklist.templateId,
            t: tTemplates,
          })
        : [],
    [checklist, tTemplates],
  );

  const selectedConditionLabels = useMemo(
    () =>
      checklist
        ? getSelectedConditionLabels(checklist.selectedConditions, tTemplates)
        : [],
    [checklist, tTemplates],
  );

  const checkedCount = useMemo(
    () => checklist?.items.filter(item => item.checked).length ?? 0,
    [checklist],
  );

  const persistChecklist = useCallback(
    async (
      nextChecklist: Checklist,
      options: {
        afterPersist?: (targetChecklist: Checklist) => Promise<void>;
      } = {},
    ) => {
      setChecklist(nextChecklist);
      await saveChecklist(nextChecklist);

      if (options.afterPersist) {
        await options.afterPersist(nextChecklist);
      }
    },
    [],
  );

  return {
    checklist,
    setChecklist,
    groupedItems,
    selectedConditionLabels,
    checkedCount,
    persistChecklist,
  };
}
