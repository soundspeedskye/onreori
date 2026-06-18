import React from 'react';
import { useTranslation } from 'react-i18next';

import { BottomActionBar } from '../ui/BottomActionBar';
import { Button } from '../ui/Button';

type ChecklistActionBarProps = {
  savingToAccount: boolean;
  syncingToAccount: boolean;
  syncFailed: boolean;
  onSaveToAccount: () => void;
  onRetrySync: () => void;
  onOpenShareCard: () => void;
};

export function ChecklistActionBar({
  savingToAccount,
  syncingToAccount,
  syncFailed,
  onSaveToAccount,
  onRetrySync,
  onOpenShareCard,
}: ChecklistActionBarProps) {
  const { t } = useTranslation('checklist');

  return (
    <BottomActionBar>
      <Button
        disabled={savingToAccount}
        onPress={onSaveToAccount}
        title={savingToAccount ? t('savingToAccount') : t('saveToAccount')}
      />
      {syncFailed ? (
        <Button
          disabled={syncingToAccount}
          onPress={onRetrySync}
          title={syncingToAccount ? t('syncing') : t('retrySync')}
          variant="secondary"
        />
      ) : null}
      <Button
        onPress={onOpenShareCard}
        title={t('shareCard')}
        variant="brand"
      />
    </BottomActionBar>
  );
}
