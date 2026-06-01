import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, layout, radii, spacing } from '../theme/tokens';

import { useAuth } from '../auth/AuthContext';
import { ChecklistHeroCard } from '../components/checklist/ChecklistHeroCard';
import { ChecklistItemRow } from '../components/checklist/ChecklistItemRow';
import { BottomActionBar } from '../components/ui/BottomActionBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { TextField } from '../components/ui/TextField';
import { saveChecklistToAccount } from '../services/checklistAccount';
import {
  getChecklistById,
  saveChecklist,
  saveChecklistDraft,
  saveChecklistLocalOnly,
  saveChecklistSyncFailed,
  saveChecklistSynced,
  setPendingAccountSaveChecklistId,
} from '../storage/checklists';
import type { Checklist, ChecklistItem, RootStackParamList } from '../types';
import {
  CHECKLIST_SYNCING_LABEL,
  getChecklistSaveStateLabel,
  getSelectedConditionLabels,
} from '../utils/checklistPresentation';
import {ALERT_MESSAGES, showAlert, showError} from '../utils/appAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

type SectionGroup = {
  title: string;
  items: ChecklistItem[];
};

export function ChecklistScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [customItemDescription, setCustomItemDescription] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [savingToAccount, setSavingToAccount] = useState(false);
  const [syncingToAccount, setSyncingToAccount] = useState(false);

  useEffect(() => {
    const loadChecklist = async () => {
      const storedChecklist = await getChecklistById(route.params.checklistId);
      setChecklist(storedChecklist ?? null);
    };

    loadChecklist();
  }, [route.params.checklistId]);

  const groupedItems = useMemo<SectionGroup[]>(() => {
    if (!checklist) {
      return [];
    }

    const sections = new Map<string, ChecklistItem[]>();

    checklist.items.forEach(item => {
      const currentItems = sections.get(item.section) ?? [];
      currentItems.push(item);
      sections.set(item.section, currentItems);
    });

    return Array.from(sections.entries()).map(([title, items]) => ({
      title,
      items,
    }));
  }, [checklist]);

  const selectedConditionLabels = useMemo(
    () =>
      checklist ? getSelectedConditionLabels(checklist.selectedConditions) : [],
    [checklist],
  );

  const shouldSyncToAccount = (targetChecklist: Checklist) =>
    Boolean(
      user &&
        targetChecklist.remoteId &&
        (targetChecklist.saveState === 'synced' ||
          targetChecklist.saveState === 'syncFailed'),
    );

  const syncChecklistToAccount = async (targetChecklist: Checklist) => {
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
        message: '로컬 변경은 저장했습니다. 다시 동기화해 주세요.',
      });
    } finally {
      setSyncingToAccount(false);
    }
  };

  const persistChecklist = async (
    nextChecklist: Checklist,
    options: {syncToAccount?: boolean} = {},
  ) => {
    setChecklist(nextChecklist);
    await saveChecklist(nextChecklist);

    if (options.syncToAccount) {
      await syncChecklistToAccount(nextChecklist);
    }
  };

  const toggleItem = async (itemId: string) => {
    if (!checklist) {
      return;
    }

    const nextChecklist = {
      ...checklist,
      updatedAt: new Date().toISOString(),
      items: checklist.items.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    };

    await persistChecklist(nextChecklist, {
      syncToAccount: shouldSyncToAccount(checklist),
    });
  };

  const handleAddCustomItem = async () => {
    if (!checklist) {
      return;
    }

    const nextDescription = customItemDescription.trim();
    const nextName = customItemName.trim();

    if (!nextName) {
      showAlert({title: ALERT_MESSAGES.requiredInput});
      return;
    }

    const nextChecklist = {
      ...checklist,
      updatedAt: new Date().toISOString(),
      items: [
        ...checklist.items,
        {
          id: `custom-${Date.now()}`,
          name: nextName,
          section: '추가 항목',
          essential: false,
          tip: nextDescription || '직접 추가한 항목입니다.',
          when: [],
          checked: false,
          custom: true,
        },
      ],
    };

    setCustomItemDescription('');
    setCustomItemName('');
    await persistChecklist(nextChecklist, {
      syncToAccount: shouldSyncToAccount(checklist),
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!checklist) {
      return;
    }

    const targetItem = checklist.items.find(item => item.id === itemId);

    if (!targetItem || targetItem.essential) {
      return;
    }

    const nextChecklist = {
      ...checklist,
      updatedAt: new Date().toISOString(),
      items: checklist.items.filter(item => item.id !== itemId),
    };

    await persistChecklist(nextChecklist, {
      syncToAccount: shouldSyncToAccount(checklist),
    });
  };

  const handleSaveLocal = async () => {
    if (!checklist) {
      return;
    }

    const nextChecklist = await saveChecklistLocalOnly(checklist);
    setChecklist(nextChecklist);
    showAlert({title: '저장했습니다.'});
  };

  const handleSaveToAccount = async () => {
    if (!checklist) {
      return;
    }

    if (!user) {
      const draftChecklist = await saveChecklistDraft(checklist);
      setChecklist(draftChecklist);
      await setPendingAccountSaveChecklistId(draftChecklist.id);
      navigation.navigate('Auth', {
        redirect: { type: 'accountSave', checklistId: draftChecklist.id },
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
      showAlert({title: '저장했습니다.'});
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.saveFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setSavingToAccount(false);
    }
  };

  const handleRetrySync = async () => {
    if (!checklist) {
      return;
    }

    await syncChecklistToAccount(checklist);
  };

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

  const checkedCount = checklist.items.filter(item => item.checked).length;
  const saveStateLabel = getChecklistSaveStateLabel(checklist.saveState, {
    syncing: syncingToAccount,
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

        <Card style={styles.addCard}>
          <Text style={styles.sectionTitle}>아이템 추가</Text>
          <View style={styles.addFields}>
            <TextField
              onChangeText={setCustomItemName}
              placeholder="item"
              value={customItemName}
            />
            <TextField
              multiline
              onChangeText={setCustomItemDescription}
              placeholder="description"
              style={styles.descriptionInput}
              value={customItemDescription}
            />
            <Button
              onPress={handleAddCustomItem}
              style={styles.addButton}
              textStyle={styles.addButtonText}
              title="추가"
              variant="dark"
            />
          </View>
        </Card>

        {groupedItems.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionList}>
              {section.items.map(item => (
                <ChecklistItemRow
                  canDelete={!item.essential}
                  key={item.id}
                  item={item}
                  onDelete={() => {
                    handleDeleteItem(item.id);
                  }}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <BottomActionBar>
        <View style={styles.footerRow}>
          <Button
            onPress={handleSaveLocal}
            style={styles.footerButton}
            title="로컬에 저장"
            variant="secondary"
          />
          <Button
            disabled={savingToAccount}
            onPress={handleSaveToAccount}
            style={styles.footerButton}
            title={savingToAccount ? '저장 중...' : '내 계정에 저장'}
          />
        </View>
        {checklist.saveState === 'syncFailed' ? (
          <Button
            disabled={syncingToAccount}
            onPress={handleRetrySync}
            title={syncingToAccount ? CHECKLIST_SYNCING_LABEL : '다시 동기화'}
            variant="secondary"
          />
        ) : null}
        <Button
          onPress={() =>
            navigation.navigate('ShareCard', { checklistId: checklist.id })
          }
          title="공유 카드"
          variant="dark"
        />
      </BottomActionBar>
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
  addCard: {
    gap: spacing.md,
  },
  addFields: {
    gap: spacing.sm,
  },
  descriptionInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  addButton: {
    borderRadius: radii.button,
    minHeight: 0,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionList: {
    gap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
  },
});
