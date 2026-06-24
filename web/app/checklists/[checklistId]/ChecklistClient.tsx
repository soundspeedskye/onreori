'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

import {ChecklistAddItemForm} from '@/components/checklist/ChecklistAddItemForm';
import {ChecklistHeroCard} from '@/components/checklist/ChecklistHeroCard';
import {ChecklistSections} from '@/components/checklist/ChecklistSections';
import {Button} from '@/components/ui/Button';
import {EmptyState} from '@/components/ui/EmptyState';
import {conditions} from '@/data/templates';
import {
  getChecklistById,
  saveChecklist,
  setPendingAccountSaveChecklistId,
} from '@/lib/storage/checklists';
import type {Checklist} from '@/types';
import {
  addCustomChecklistItem,
  deleteChecklistItem,
  groupChecklistItemsBySection,
  toggleChecklistItem,
} from '@/utils/checklistItems';
import {getChecklistSaveStateLabel} from '@/utils/checklistPresentation';
import {createLocalId} from '@/utils/localId';

type ChecklistClientProps = {
  checklistId: string;
};

export function getAccountSaveHref(checklistId: string): string {
  return `/auth?redirect=accountSave&checklistId=${encodeURIComponent(
    checklistId,
  )}`;
}

export function getShareHref(checklistId: string): string {
  return `/share/${encodeURIComponent(checklistId)}`;
}

function getConditionLabels(checklist: Checklist): string[] {
  return conditions
    .filter(condition => checklist.selectedConditions.includes(condition.id))
    .map(condition => condition.label);
}

export function ChecklistClient({checklistId}: ChecklistClientProps) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemDescription, setCustomItemDescription] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadChecklist() {
      const loadedChecklist = await getChecklistById(checklistId);

      if (!isMounted) {
        return;
      }

      setChecklist(loadedChecklist ?? null);
      setIsLoading(false);
    }

    void loadChecklist();

    return () => {
      isMounted = false;
    };
  }, [checklistId]);

  const persistChecklist = useCallback(async (nextChecklist: Checklist) => {
    setChecklist(nextChecklist);
    await saveChecklist(nextChecklist);
  }, []);

  const sections = useMemo(
    () => groupChecklistItemsBySection(checklist?.items ?? []),
    [checklist?.items],
  );

  const checkedCount = checklist?.items.filter(item => item.checked).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;

  function handleToggleItem(itemId: string) {
    if (!checklist) {
      return;
    }

    void persistChecklist(toggleChecklistItem(checklist, itemId));
  }

  function handleAddItem() {
    if (!checklist || customItemName.trim().length === 0) {
      return;
    }

    const nextChecklist = addCustomChecklistItem(checklist, {
      id: createLocalId('custom-item'),
      name: customItemName,
      description: customItemDescription,
    });

    setCustomItemName('');
    setCustomItemDescription('');
    void persistChecklist(nextChecklist);
  }

  function handleDeleteItem(itemId: string) {
    if (!checklist) {
      return;
    }

    const targetItem = checklist.items.find(item => item.id === itemId);

    if (!targetItem?.custom) {
      return;
    }

    void persistChecklist(deleteChecklistItem(checklist, itemId));
  }

  async function handleSaveToAccount() {
    if (!checklist) {
      return;
    }

    await setPendingAccountSaveChecklistId(checklist.id);
    window.location.assign(getAccountSaveHref(checklist.id));
  }

  function handleShareCard() {
    if (!checklist) {
      return;
    }

    window.location.assign(getShareHref(checklist.id));
  }

  if (isLoading) {
    return (
      <main className="screen">
        <EmptyState title="불러오는 중..." />
      </main>
    );
  }

  if (!checklist) {
    return (
      <main className="screen">
        <EmptyState
          description="다른 카테고리에서 다시 만들어주세요."
          title="체크리스트를 불러오지 못했습니다."
        />
      </main>
    );
  }

  return (
    <main className="screen screen-with-bottom-action checklist-screen stack">
      <ChecklistHeroCard
        conditionLabels={getConditionLabels(checklist)}
        icon={checklist.icon}
        meta={`${checkedCount}/${totalCount} 완료`}
        saveStateLabel={getChecklistSaveStateLabel(checklist.saveState)}
        title={checklist.title}
      />

      <ChecklistAddItemForm
        description={customItemDescription}
        name={customItemName}
        onAdd={handleAddItem}
        onDescriptionChange={setCustomItemDescription}
        onNameChange={setCustomItemName}
      />

      <ChecklistSections
        onDeleteItem={handleDeleteItem}
        onToggleItem={handleToggleItem}
        sections={sections}
      />

      <div className="ui-bottom-action-bar">
        <div className="ui-bottom-action-bar-inner checklist-bottom-actions">
          <Button onClick={handleSaveToAccount} variant="brand">
            내 계정에 저장
          </Button>
          <Button onClick={handleShareCard} variant="secondary">
            공유 카드
          </Button>
        </div>
      </div>
    </main>
  );
}
