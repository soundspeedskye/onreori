import React, {useMemo, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {ConditionToggle} from '../components/ConditionToggle';
import {
  conditions,
  createChecklistFromTemplate,
  getTemplateById,
} from '../data/templates';
import {saveChecklistDraft} from '../storage/checklists';
import type {ConditionId, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Conditions'>;

export function ConditionsScreen({navigation, route}: Props) {
  const template = useMemo(
    () => getTemplateById(route.params.templateId),
    [route.params.templateId],
  );
  const [selectedConditions, setSelectedConditions] = useState<ConditionId[]>([]);

  const toggleCondition = (conditionId: ConditionId, enabled: boolean) => {
    setSelectedConditions(current =>
      enabled
        ? [...current, conditionId]
        : current.filter(item => item !== conditionId),
    );
  };

  const handleCreateChecklist = async () => {
    if (!template) {
      Alert.alert('템플릿을 찾지 못했습니다.');
      return;
    }

    const checklist = createChecklistFromTemplate(template, selectedConditions);

    await saveChecklistDraft(checklist);
    navigation.replace('Checklist', {checklistId: checklist.id});
  };

  if (!template) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>템플릿을 찾지 못했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.icon}>{template.icon}</Text>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{template.title}</Text>
            <Text style={styles.description}>{template.description}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>상황 선택</Text>
          <Text style={styles.sectionDescription}>
            여러 조건을 같이 켜면 해당되는 추천 준비물만 포함해 체크리스트를
            만듭니다.
          </Text>
        </View>

        <View style={styles.toggleList}>
          {conditions.map(condition => (
            <ConditionToggle
              key={condition.id}
              condition={condition}
              value={selectedConditions.includes(condition.id)}
              onValueChange={nextValue =>
                toggleCondition(condition.id, nextValue)
              }
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleCreateChecklist} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>체크리스트 만들기</Text>
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
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 18,
  },
  icon: {
    fontSize: 38,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#241b16',
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    color: '#5f5047',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDescription: {
    color: '#6d5e55',
    fontSize: 14,
    lineHeight: 20,
  },
  toggleList: {
    gap: 12,
  },
  footer: {
    backgroundColor: '#f7f1ea',
    borderTopColor: '#eadccd',
    borderTopWidth: 1,
    padding: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
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
