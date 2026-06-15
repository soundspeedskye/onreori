import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {getTemplateById} from '../../data/templates';
import {colors, radii, spacing} from '../../theme/tokens';
import type {RemoteChecklistSummary} from '../../types';
import {getChecklistSaveStateLabel} from '../../utils/checklistPresentation';
import {Card} from '../ui/Card';
import {EmptyState} from '../ui/EmptyState';
import {PixelIcon, getPixelIconNameForEmoji} from '../ui/PixelIcon';

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
      {checklists.map(item => {
        const iconName =
          getPixelIconNameForEmoji(getTemplateById(item.templateId)?.icon) ??
          'checkOn';

        return (
          <Card
            key={item.remoteId}
            onPress={() => onOpenChecklist(item)}
            style={styles.checklistCard}>
            <View style={styles.checklistTitleRow}>
              <PixelIcon name={iconName} size={28} />
              <Text style={styles.checklistTitle}>{item.title}</Text>
            </View>
            <Text style={styles.checklistMeta}>
              {getChecklistSaveStateLabel('synced')}
            </Text>
          </Card>
        );
      })}
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
  checklistTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  checklistTitle: {
    color: colors.text,
    flex: 1,
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
