import {useCallback, useState} from 'react';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {saveChecklistToAccount} from '../../services/checklistAccount';
import {
  saveChecklistDraft,
  saveChecklistSyncFailed,
  saveChecklistSynced,
  setPendingAccountSaveChecklistId,
} from '../../storage/checklists';
import type {AuthUser, Checklist, RootStackParamList} from '../../types';
import {ALERT_MESSAGES, showAlert, showError} from '../../utils/appAlert';

type ChecklistNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'Checklist'
>;

type UseChecklistAccountActionsParams = {
  user: AuthUser | null;
  navigation: ChecklistNavigation;
  setChecklist: (checklist: Checklist) => void;
};

export function useChecklistAccountActions({
  user,
  navigation,
  setChecklist,
}: UseChecklistAccountActionsParams) {
  const {t} = useTranslation('checklist');
  const [savingToAccount, setSavingToAccount] = useState(false);
  const [syncingToAccount, setSyncingToAccount] = useState(false);

  const shouldSyncToAccount = useCallback(
    (targetChecklist: Checklist) =>
      Boolean(
        user &&
          targetChecklist.remoteId &&
          (targetChecklist.saveState === 'synced' ||
            targetChecklist.saveState === 'syncFailed'),
      ),
    [user],
  );

  const syncChecklistToAccount = useCallback(
    async (targetChecklist: Checklist) => {
      if (!user) {
        return;
      }

      try {
        setSyncingToAccount(true);
        const remoteReference = await saveChecklistToAccount(
          targetChecklist,
          user,
        );
        const syncedChecklist = await saveChecklistSynced(
          targetChecklist,
          remoteReference,
        );
        setChecklist(syncedChecklist);
      } catch {
        const failedChecklist = await saveChecklistSyncFailed(targetChecklist);
        setChecklist(failedChecklist);
        showAlert({
          title: ALERT_MESSAGES.syncFailed,
          message: t('localSavedRetrySync'),
        });
      } finally {
        setSyncingToAccount(false);
      }
    },
    [setChecklist, t, user],
  );

  const handleSaveToAccount = useCallback(
    async (checklist: Checklist) => {
      if (!user) {
        const draftChecklist = await saveChecklistDraft(checklist);
        setChecklist(draftChecklist);
        await setPendingAccountSaveChecklistId(draftChecklist.id);
        navigation.navigate('Auth', {
          redirect: {type: 'accountSave', checklistId: draftChecklist.id},
        });
        return;
      }

      try {
        setSavingToAccount(true);
        const remoteReference = await saveChecklistToAccount(checklist, user);
        const nextChecklist = await saveChecklistSynced(
          checklist,
          remoteReference,
        );
        setChecklist(nextChecklist);
        showAlert({title: t('saved')});
      } catch (error) {
        showError(error, {
          title: ALERT_MESSAGES.saveFailed,
          fallbackMessage: ALERT_MESSAGES.retry,
        });
      } finally {
        setSavingToAccount(false);
      }
    },
    [navigation, setChecklist, t, user],
  );

  return {
    savingToAccount,
    syncingToAccount,
    shouldSyncToAccount,
    syncChecklistToAccount,
    handleSaveToAccount,
  };
}
