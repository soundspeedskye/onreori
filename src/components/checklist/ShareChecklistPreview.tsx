import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors} from '../../theme/tokens';
import type {Checklist} from '../../types';
import {Card} from '../ui/Card';
import {Chip} from '../ui/Chip';

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
  const previewItems = checklist.items.slice(0, previewLimit);

  return (
    <View style={styles.previewWrap}>
      <Card style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewIcon}>{checklist.icon}</Text>
          <Text style={styles.previewTitle}>{checklist.title}</Text>
          <Text style={styles.previewMeta}>
            진행률 {checkedCount}/{totalCount}
          </Text>
        </View>

        <View style={styles.previewConditions}>
          {selectedConditionLabels.length > 0 ? (
            selectedConditionLabels.map(label => (
              <Chip key={label} label={label} />
            ))
          ) : (
            <Chip label="기본 템플릿" />
          )}
        </View>

        <Card style={styles.previewList}>
          {previewItems.map(item => (
            <Text key={item.id} style={styles.previewItem}>
              {item.checked ? '☑︎' : '☐'} {item.name}
            </Text>
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
    borderRadius: 28,
    minHeight: 360,
    overflow: 'hidden',
    padding: 24,
    position: 'relative',
    width: '100%',
  },
  previewHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
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
    gap: 8,
    justifyContent: 'center',
    marginBottom: 18,
  },
  previewList: {
    borderRadius: 18,
    gap: 10,
    padding: 16,
  },
  previewItem: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
});
