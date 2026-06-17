import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, radii, spacing} from '../../theme/tokens';
import type {Checklist} from '../../types';
import {Card} from '../ui/Card';
import {Chip} from '../ui/Chip';
import {PixelIcon, getPixelIconNameForEmoji} from '../ui/PixelIcon';

type ShareChecklistPreviewProps = {
  checklist: Checklist;
  selectedConditionLabels: string[];
  checkedCount: number;
  totalCount: number;
  previewLimit?: number;
};

export function ShareChecklistPreview({
  checklist,
  selectedConditionLabels,
  checkedCount,
  totalCount,
  previewLimit = 5,
}: ShareChecklistPreviewProps) {
  const {t} = useTranslation('checklist');
  const previewItems = checklist.items.slice(0, previewLimit);
  const checklistIconName = getPixelIconNameForEmoji(checklist.icon);

  return (
    <View collapsable={false} style={styles.previewWrap}>
      <Card style={styles.previewCard}>
        <View style={styles.previewHeader}>
          {checklistIconName ? (
            <PixelIcon name={checklistIconName} size={46} />
          ) : (
            <Text style={styles.previewIcon}>{checklist.icon}</Text>
          )}
          <Text style={styles.previewTitle}>{checklist.title}</Text>
          <Text style={styles.previewMeta}>
            {t('progress', {checkedCount, totalCount})}
          </Text>
        </View>

        <View style={styles.previewConditions}>
          {selectedConditionLabels.length > 0 ? (
            selectedConditionLabels.map(label => (
              <Chip key={label} label={label} />
            ))
          ) : (
            <Chip label={t('defaultTemplate')} />
          )}
        </View>

        <Card style={styles.previewList}>
          {previewItems.map(item => (
            <View key={item.id} style={styles.previewItemRow}>
              <PixelIcon
                name={item.checked ? 'checkOn' : 'checkOff'}
                size={20}
              />
              <Text style={styles.previewItem}>{item.name}</Text>
            </View>
          ))}
        </Card>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    alignItems: 'center',
  },
  previewCard: {
    borderRadius: radii.xxl,
    minHeight: 360,
    overflow: 'hidden',
    padding: spacing.xl,
    position: 'relative',
    width: '100%',
  },
  previewHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  previewIcon: {
    fontSize: 42,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewMeta: {
    color: colors.brandMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  previewConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  previewList: {
    borderRadius: radii.card,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  previewItemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewItem: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
});
