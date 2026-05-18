import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {ChecklistItemRow} from '../components/ChecklistItemRow';
import {conditions} from '../data/templates';
import {saveChecklistToAccount} from '../services/checklistAccount';
import {
  getChecklistById,
  saveChecklist,
  saveChecklistDraft,
  saveChecklistLocalOnly,
  saveChecklistSynced,
  setPendingAccountSaveChecklistId,
} from '../storage/checklists';
import type {Checklist, ChecklistItem, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

type SectionGroup = {
  title: string;
  items: ChecklistItem[];
};

export function ChecklistScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [customItemName, setCustomItemName] = useState('');
  const [savingToAccount, setSavingToAccount] = useState(false);

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

  const selectedConditionLabels = useMemo(() => {
    if (!checklist) {
      return [];
    }

    return conditions
      .filter(condition => checklist.selectedConditions.includes(condition.id))
      .map(condition => condition.label);
  }, [checklist]);

  const persistChecklist = async (nextChecklist: Checklist) => {
    setChecklist(nextChecklist);
    await saveChecklist(nextChecklist);
  };

  const toggleItem = async (itemId: string) => {
    if (!checklist) {
      return;
    }

    const nextChecklist = {
      ...checklist,
      updatedAt: new Date().toISOString(),
      items: checklist.items.map(item =>
        item.id === itemId ? {...item, checked: !item.checked} : item,
      ),
    };

    await persistChecklist(nextChecklist);
  };

  const handleAddCustomItem = async () => {
    if (!checklist) {
      return;
    }

    const nextName = customItemName.trim();

    if (!nextName) {
      Alert.alert('추가할 항목 이름을 입력하세요.');
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
          tip: '직접 추가한 항목입니다.',
          when: [],
          checked: false,
          custom: true,
        },
      ],
    };

    setCustomItemName('');
    await persistChecklist(nextChecklist);
  };

  const handleSaveLocal = async () => {
    if (!checklist) {
      return;
    }

    const nextChecklist = await saveChecklistLocalOnly(checklist);
    setChecklist(nextChecklist);
    Alert.alert('로컬에 저장했습니다.');
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
      Alert.alert('내 계정에 저장했습니다.');
    } catch (error) {
      Alert.alert(
        '계정 저장 실패',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setSavingToAccount(false);
    }
  };

  if (!checklist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>체크리스트를 불러오지 못했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const checkedCount = checklist.items.filter(item => item.checked).length;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroIcon}>{checklist.icon}</Text>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{checklist.title}</Text>
              <Text style={styles.heroMeta}>
                {checkedCount}/{checklist.items.length} 완료
              </Text>
              <Text style={styles.saveStateText}>
                {checklist.saveState === 'synced'
                  ? '내 계정에 저장됨'
                  : checklist.saveState === 'localOnly'
                    ? '로컬에 저장됨'
                    : '아직 저장하지 않은 체크리스트'}
              </Text>
            </View>
          </View>
          <View style={styles.conditionWrap}>
            {selectedConditionLabels.length > 0 ? (
              selectedConditionLabels.map(label => (
                <Text key={label} style={styles.conditionChip}>
                  {label}
                </Text>
              ))
            ) : (
              <Text style={styles.conditionFallback}>선택한 추가 조건 없음</Text>
            )}
          </View>
        </View>

        <View style={styles.addBox}>
          <Text style={styles.sectionTitle}>항목 추가</Text>
          <View style={styles.addRow}>
            <TextInput
              onChangeText={setCustomItemName}
              placeholder="직접 챙길 항목을 입력하세요"
              placeholderTextColor="#9d8f86"
              style={styles.input}
              value={customItemName}
            />
            <Pressable onPress={handleAddCustomItem} style={styles.addButton}>
              <Text style={styles.addButtonText}>추가</Text>
            </Pressable>
          </View>
        </View>

        {groupedItems.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionList}>
              {section.items.map(item => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => {
                    toggleItem(item.id);
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Pressable onPress={handleSaveLocal} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>로컬에 저장</Text>
          </Pressable>
          <Pressable
            disabled={savingToAccount}
            onPress={handleSaveToAccount}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {savingToAccount ? '저장 중...' : '내 계정에 저장'}
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => navigation.navigate('ShareCard', {checklistId: checklist.id})}
          style={styles.shareButton}>
          <Text style={styles.shareButtonText}>공유 카드</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroIcon: {
    fontSize: 38,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: '#241b16',
    fontSize: 20,
    fontWeight: '800',
  },
  heroMeta: {
    color: '#b05f3c',
    fontSize: 14,
    fontWeight: '700',
  },
  saveStateText: {
    color: '#7a6d64',
    fontSize: 12,
    fontWeight: '700',
  },
  conditionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChip: {
    backgroundColor: '#ffe4d6',
    borderRadius: 999,
    color: '#8a4d2b',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  conditionFallback: {
    color: '#7a6d64',
    fontSize: 13,
  },
  addBox: {
    gap: 12,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 16,
    borderWidth: 1,
    color: '#241b16',
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#241b16',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionList: {
    gap: 10,
  },
  footer: {
    backgroundColor: '#f7f1ea',
    gap: 10,
    borderTopColor: '#eadccd',
    borderTopWidth: 1,
    padding: 16,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    flex: 1,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: '#241b16',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: '#241b16',
    borderRadius: 16,
    paddingVertical: 14,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '700',
  },
});
