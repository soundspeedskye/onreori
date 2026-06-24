'use client';

import {useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';

import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {PixelIcon, getPixelIconNameForEmoji} from '@/components/ui/PixelIcon';
import {conditions, createChecklistFromTemplate} from '@/data/templates';
import {saveChecklistDraft} from '@/lib/storage/checklists';
import type {ConditionId, Template} from '@/types';

type ConditionsClientProps = {
  template: Template;
};

export function ConditionsClient({template}: ConditionsClientProps) {
  const router = useRouter();
  const [selectedConditions, setSelectedConditions] = useState<ConditionId[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const iconName = getPixelIconNameForEmoji(template.icon);

  const selectedConditionSet = useMemo(
    () => new Set(selectedConditions),
    [selectedConditions],
  );

  function toggleCondition(conditionId: ConditionId) {
    setSelectedConditions(currentConditions =>
      currentConditions.includes(conditionId)
        ? currentConditions.filter(id => id !== conditionId)
        : [...currentConditions, conditionId],
    );
  }

  async function handleCreateChecklist() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const checklist = createChecklistFromTemplate(
        template,
        selectedConditions,
      );
      const savedChecklist = await saveChecklistDraft(checklist);
      router.push(`/checklists/${savedChecklist.id}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="screen screen-with-bottom-action stack">
      <Card className="condition-template-card">
        <div className="condition-template-card__icon" aria-hidden="true">
          {iconName ? (
            <PixelIcon name={iconName} size={52} />
          ) : (
            <span>{template.icon}</span>
          )}
        </div>
        <div>
          <h1>{template.title}</h1>
          <p>{template.description}</p>
        </div>
      </Card>

      <section className="condition-list" aria-labelledby="condition-title">
        <div className="condition-list__header">
          <h2 id="condition-title">상황 선택</h2>
          <p>공연 당일의 예상 컨디션을 선택해주세요.</p>
        </div>

        <div className="condition-list__rows">
          {conditions.map(condition => {
            const isSelected = selectedConditionSet.has(condition.id);

            return (
              <Card
                aria-pressed={isSelected}
                className={[
                  'condition-row-card',
                  isSelected ? 'condition-row-card--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={condition.id}
                onClick={() => toggleCondition(condition.id)}
              >
                <span className="condition-row-card__check" aria-hidden="true">
                  {isSelected ? '✓' : ''}
                </span>
                <span className="condition-row-card__copy">
                  <strong>{condition.label}</strong>
                  <span>{condition.description}</span>
                </span>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="ui-bottom-action-bar">
        <div className="ui-bottom-action-bar-inner">
          <Button loading={isSaving} onClick={handleCreateChecklist}>
            체크리스트 만들기
          </Button>
        </div>
      </div>
    </main>
  );
}
