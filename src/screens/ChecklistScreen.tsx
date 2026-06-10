import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {ChecklistActionBar} from '../components/checklist/ChecklistActionBar';
import {ChecklistAddItemForm} from '../components/checklist/ChecklistAddItemForm';
import {ChecklistHeroCard} from '../components/checklist/ChecklistHeroCard';
import {ChecklistSections} from '../components/checklist/ChecklistSections';
import {EmptyState} from '../components/ui/EmptyState';
import {colors, layout, spacing} from '../theme/tokens';
import type {RootStackParamList} from '../types';
import {getChecklistSaveStateLabel} from '../utils/checklistPresentation';
import {useChecklistAccountActions} from './checklist/useChecklistAccountActions';
import {useChecklistItemActions} from './checklist/useChecklistItemActions';
import {useChecklistState} from './checklist/useChecklistState';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

export function ChecklistScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const {
    checklist,
    setChecklist,
    groupedItems,
    selectedConditionLabels,
    checkedCount,
    persistChecklist,
  } = useChecklistState(route.params.checklistId);
  const accountActions = useChecklistAccountActions({
    user,
    navigation,
    setChecklist,
  });
  const itemActions = useChecklistItemActions({
    checklist,
    persistChecklist,
    shouldSyncToAccount: accountActions.shouldSyncToAccount,
    syncChecklistToAccount: accountActions.syncChecklistToAccount,
  });

  if (!checklist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="체크리스트를 불러오지 못했습니다."
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  const saveStateLabel = getChecklistSaveStateLabel(checklist.saveState, {
    syncing: accountActions.syncingToAccount,
  });

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ChecklistHeroCard
          icon={checklist.icon}
          title={checklist.title}
          meta={`${checkedCount}/${checklist.items.length} 완료`}
          saveStateLabel={saveStateLabel}
          conditionLabels={selectedConditionLabels}
        />

        <ChecklistAddItemForm
          name={itemActions.customItemName}
          description={itemActions.customItemDescription}
          onNameChange={itemActions.setCustomItemName}
          onDescriptionChange={itemActions.setCustomItemDescription}
          onAdd={itemActions.handleAddCustomItem}
        />

        <ChecklistSections
          sections={groupedItems}
          onToggleItem={itemActions.toggleItem}
          onDeleteItem={itemActions.handleDeleteItem}
        />
      </ScrollView>

      <ChecklistActionBar
        savingToAccount={accountActions.savingToAccount}
        syncingToAccount={accountActions.syncingToAccount}
        syncFailed={checklist.saveState === 'syncFailed'}
        onSaveToAccount={() => accountActions.handleSaveToAccount(checklist)}
        onRetrySync={() => accountActions.syncChecklistToAccount(checklist)}
        onOpenShareCard={() =>
          navigation.navigate('ShareCard', {checklistId: checklist.id})
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.screen,
    padding: layout.screenPadding,
    paddingBottom: layout.bottomActionScrollPadding,
  },
  emptyState: {
    flex: 1,
  },
});
