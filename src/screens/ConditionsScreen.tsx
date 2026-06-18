import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors, layout, radii, spacing } from '../theme/tokens';

import { ConditionToggle } from '../components/templates/ConditionToggle';
import { BottomActionBar } from '../components/ui/BottomActionBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PixelIconForEmoji } from '../components/ui/PixelIcon';
import {
  conditions,
  createChecklistFromTemplate,
  getTemplateById,
} from '../data/templates';
import { saveChecklistDraft } from '../storage/checklists';
import type { ConditionId, RootStackParamList } from '../types';
import { ALERT_MESSAGES, showAlert } from '../utils/appAlert';
import {
  getLocalizedCondition,
  getLocalizedTemplate,
} from '../utils/checklistTemplateTranslations';

type Props = NativeStackScreenProps<RootStackParamList, 'Conditions'>;

/**
 * 체크리스트 템플릿에 적용할 상황 조건을 선택하고 로컬 초안을 생성한다.
 */
export function ConditionsScreen({ navigation, route }: Props) {
  const { t } = useTranslation('conditions');
  const { t: tTemplates } = useTranslation('checklistTemplates');
  const template = useMemo(
    () => getTemplateById(route.params.templateId),
    [route.params.templateId],
  );
  const localizedTemplate = useMemo(
    () => (template ? getLocalizedTemplate(template, tTemplates) : undefined),
    [tTemplates, template],
  );
  const localizedConditions = useMemo(
    () =>
      conditions.map(condition => getLocalizedCondition(condition, tTemplates)),
    [tTemplates],
  );
  const [selectedConditions, setSelectedConditions] = useState<ConditionId[]>(
    [],
  );

  const toggleCondition = (conditionId: ConditionId, enabled: boolean) => {
    setSelectedConditions(current =>
      enabled
        ? [...current, conditionId]
        : current.filter(item => item !== conditionId),
    );
  };

  const handleCreateChecklist = async () => {
    if (!template) {
      showAlert({ title: ALERT_MESSAGES.notFound });
      return;
    }

    const checklist = createChecklistFromTemplate(template, selectedConditions);

    await saveChecklistDraft(checklist);
    navigation.replace('Checklist', { checklistId: checklist.id });
  };

  if (!template) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState title={t('templateNotFound')} style={styles.emptyState} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <PixelIconForEmoji
            emoji={template.icon}
            fallbackTextStyle={styles.icon}
            size={42}
          />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{localizedTemplate?.title}</Text>
            {/* <Text style={styles.description}>
              {localizedTemplate?.description}
            </Text> */}
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('sectionTitle')}</Text>
          <Text style={styles.sectionDescription}>
            {t('sectionDescription')}
          </Text>
        </View>

        <View style={styles.toggleList}>
          {localizedConditions.map(condition => (
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

      <BottomActionBar>
        <Button onPress={handleCreateChecklist} title={t('createChecklist')} />
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
  headerCard: {
    alignItems: 'center',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  icon: {
    fontSize: 38,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  toggleList: {
    gap: spacing.md,
  },
  emptyState: {
    flex: 1,
  },
});
