import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {colors} from '../theme/tokens';

import {ShareChecklistPreview} from '../components/checklist/ShareChecklistPreview';
import {BottomActionBar} from '../components/ui/BottomActionBar';
import {Button} from '../components/ui/Button';
import {EmptyState} from '../components/ui/EmptyState';
import {conditions} from '../data/templates';
import {getChecklistById} from '../storage/checklists';
import type {Checklist, RootStackParamList} from '../types';

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

  const selectedConditionLabels = useMemo(() => {
    if (!checklist) {
      return [];
    }

    return conditions
      .filter(condition => checklist.selectedConditions.includes(condition.id))
      .map(condition => condition.label);
  }, [checklist]);

  const checkedCount = checklist?.items.filter(item => item.checked).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;

  const handleShare = async () => {
    if (!checklist) {
      Alert.alert('공유할 체크리스트를 찾지 못했습니다.');
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
      Alert.alert('공유를 열지 못했습니다.');
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
    gap: 20,
    padding: 20,
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
  },
});
