import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, Share, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {colors, layout, spacing} from '../theme/tokens';

import {ShareChecklistPreview} from '../components/checklist/ShareChecklistPreview';
import {BottomActionBar} from '../components/ui/BottomActionBar';
import {Button} from '../components/ui/Button';
import {EmptyState} from '../components/ui/EmptyState';
import {getChecklistById} from '../storage/checklists';
import type {Checklist, RootStackParamList} from '../types';
import {ALERT_MESSAGES, showAlert} from '../utils/appAlert';
import {getSelectedConditionLabels} from '../utils/checklistPresentation';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareCard'>;

export function ShareCardScreen({route}: Props) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  useEffect(() => {
    const loadChecklist = async () => {
      const storedChecklist = await getChecklistById(route.params.checklistId);
      setChecklist(storedChecklist ?? null);
    };

    loadChecklist();
  }, [route.params.checklistId]);

  const selectedConditionLabels = useMemo(
    () =>
      checklist ? getSelectedConditionLabels(checklist.selectedConditions) : [],
    [checklist],
  );

  const checkedCount = checklist?.items.filter(item => item.checked).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;

  const handleShare = async () => {
    if (!checklist) {
      showAlert({title: ALERT_MESSAGES.notFound});
      return;
    }

    const completedItems = checklist.items
      .filter(item => item.checked)
      .slice(0, 5)
      .map(item => `• ${item.name}`)
      .join('\n');

    const shareMessage = [
      `${checklist.icon} ${checklist.title}`,
      `진행률: ${checkedCount}/${totalCount}`,
      selectedConditionLabels.length > 0
        ? `상황: ${selectedConditionLabels.join(', ')}`
        : '상황: 기본 템플릿',
      completedItems || '• 아직 체크된 항목이 없습니다.',
    ].join('\n');

    try {
      await Share.share({message: shareMessage});
    } catch {
      showAlert({title: ALERT_MESSAGES.openFailed});
    }
  };

  if (!checklist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="공유 카드를 불러오지 못했습니다."
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ShareChecklistPreview
          checklist={checklist}
          checkedCount={checkedCount}
          selectedConditionLabels={selectedConditionLabels}
          totalCount={totalCount}
        />
      </ScrollView>

      <BottomActionBar>
        <Button onPress={handleShare} title="내보내기" variant="dark" />
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
  emptyState: {
    flex: 1,
  },
});
