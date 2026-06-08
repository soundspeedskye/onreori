import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {getTemplateById} from '../../data/templates';
import {colors, radii, spacing} from '../../theme/tokens';
import type {RemoteChecklistSummary} from '../../types';
import {getChecklistSaveStateLabel} from '../../utils/checklistPresentation';
import {Card} from '../ui/Card';
import {EmptyState} from '../ui/EmptyState';

type MyChecklistTabProps = {
  checklists: RemoteChecklistSummary[];
  loadingChecklists: boolean;
  onOpenChecklist: (checklist: RemoteChecklistSummary) => void;
};

export function MyChecklistTab({
  checklists,
  loadingChecklists,
  onOpenChecklist,
}: MyChecklistTabProps) {
  if (loadingChecklists) {
    return (
      <EmptyState
        title="저장된 체크리스트를 불러오는 중입니다."
        style={styles.emptyBox}
      />
    );
  }

  if (checklists.length === 0) {
    return (
      <EmptyState
        title="저장된 체크리스트가 없습니다."
        style={styles.emptyBox}
      />
    );
  }

  return (
    <View style={styles.checklistList}>
      {checklists.map(item => (
        <Card
          key={item.remoteId}
          onPress={() => onOpenChecklist(item)}
          style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>
            {getTemplateById(item.templateId)?.icon ?? '✅'} {item.title}
          </Text>
          <Text style={styles.checklistMeta}>
            {getChecklistSaveStateLabel('synced')}
          </Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  checklistList: {
    gap: spacing.md,
  },
  checklistCard: {
    borderRadius: radii.card,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  checklistTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  checklistMeta: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
