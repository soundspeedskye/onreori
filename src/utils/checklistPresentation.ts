import {conditions} from '../data/templates';
import type {ChecklistSaveState, ConditionId} from '../types';

export const CHECKLIST_SYNCING_LABEL = '동기화 중...';

export const CHECKLIST_SAVE_STATE_LABELS: Record<ChecklistSaveState, string> = {
  draft: '임시 저장',
  localOnly: '임시 저장',
  deviceSaved: '기기에 저장됨',
  synced: '계정에 저장됨',
  syncFailed: '계정 반영 필요',
};

export function getChecklistSaveStateLabel(
  saveState: ChecklistSaveState,
  options: {syncing?: boolean} = {},
): string {
  return options.syncing
    ? CHECKLIST_SYNCING_LABEL
    : CHECKLIST_SAVE_STATE_LABELS[saveState];
}

export function getSelectedConditionLabels(
  selectedConditions: ConditionId[],
): string[] {
  return conditions
    .filter(condition => selectedConditions.includes(condition.id))
    .map(condition => condition.label);
}
