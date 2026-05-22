import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../theme/tokens';
import type {ChecklistItem} from '../../types';
import {Card} from '../ui/Card';
import {Chip} from '../ui/Chip';

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
  return (
    <Card onPress={onToggle} style={styles.row}>
      <Text style={styles.checkbox}>{item.checked ? '☑︎' : '☐'}</Text>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, item.checked && styles.checkedText]}>
              {item.name}
            </Text>
            {item.essential ? (
              <Chip label="필수" tone="action" style={styles.badge} />
            ) : null}
            {item.custom ? <Chip label="직접 추가" style={styles.badge} /> : null}
          </View>
          {canDelete ? (
            <Pressable
              accessibilityHint="항목을 삭제합니다."
              accessibilityLabel={`${item.name} 삭제`}
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
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  checkbox: {
    color: colors.brand,
    fontSize: 26,
    lineHeight: 28,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
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
