import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, radii, spacing} from '../../theme/tokens';
import type {ChecklistItem} from '../../types';
import {Card} from '../ui/Card';
import {Chip} from '../ui/Chip';
import {PixelIcon} from '../ui/PixelIcon';

type ChecklistItemRowProps = {
  canDelete?: boolean;
  item: ChecklistItem;
  onDelete: () => void;
  onToggle: () => void;
};

export function ChecklistItemRow({
  canDelete = true,
  item,
  onDelete,
  onToggle,
}: ChecklistItemRowProps) {
  const {t} = useTranslation('checklist');

  return (
    <Card
      accessibilityLabel={t('checkAccessibility', {itemName: item.name})}
      accessibilityRole="checkbox"
      accessibilityState={{checked: item.checked}}
      onPress={onToggle}
      style={styles.row}>
      <View style={styles.checkbox}>
        <PixelIcon name={item.checked ? 'checkOn' : 'checkOff'} size={28} />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, item.checked && styles.checkedText]}>
              {item.name}
            </Text>
            {item.essential ? (
              <Chip label={t('essential')} tone="action" style={styles.badge} />
            ) : null}
            {item.custom ? (
              <Chip label={t('custom')} style={styles.badge} />
            ) : null}
          </View>
          {canDelete ? (
            <Pressable
              accessibilityHint={t('deleteAccessibilityHint')}
              accessibilityLabel={t('deleteAccessibility', {
                itemName: item.name,
              })}
              accessibilityRole="button"
              hitSlop={8}
              onPress={event => {
                event?.stopPropagation?.();
                onDelete();
              }}
              style={styles.deleteButton}>
              <Text style={styles.deleteIcon}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.section}>{item.section}</Text>
        <Text style={styles.tip}>{item.tip}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    borderRadius: radii.card,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  checkbox: {
    height: 30,
    marginTop: 2,
    width: 30,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  deleteIcon: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 19,
  },
  name: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  checkedText: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  badge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  section: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tip: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
