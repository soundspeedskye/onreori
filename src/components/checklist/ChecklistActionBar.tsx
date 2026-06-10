import React from 'react';
import {CHECKLIST_SYNCING_LABEL} from '../../utils/checklistPresentation';
import {BottomActionBar} from '../ui/BottomActionBar';
import {Button} from '../ui/Button';

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
  return (
    <BottomActionBar>
      <Button
        disabled={savingToAccount}
        onPress={onSaveToAccount}
        title={savingToAccount ? '저장 중...' : '내 계정에 저장'}
      />
      {syncFailed ? (
        <Button
          disabled={syncingToAccount}
          onPress={onRetrySync}
          title={syncingToAccount ? CHECKLIST_SYNCING_LABEL : '다시 동기화'}
          variant="secondary"
        />
      ) : null}
      <Button onPress={onOpenShareCard} title="공유 카드" variant="dark" />
    </BottomActionBar>
  );
}
