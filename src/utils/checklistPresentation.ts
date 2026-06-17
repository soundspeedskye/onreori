import {i18n} from '../i18n';
import type {ChecklistSaveState} from '../types';

export function getChecklistSaveStateLabel(
  saveState: ChecklistSaveState,
  options: {syncing?: boolean} = {},
): string {
  return options.syncing
    ? i18n.t('syncing', {ns: 'checklist'})
    : i18n.t(`saveStates.${saveState}`, {ns: 'checklist'});
}
