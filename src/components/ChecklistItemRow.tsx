import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {ChecklistItem} from '../types';

type ChecklistItemRowProps = {
  item: ChecklistItem;
  onToggle: () => void;
};

export function ChecklistItemRow({item, onToggle}: ChecklistItemRowProps) {
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <Text style={styles.checkbox}>{item.checked ? '☑︎' : '☐'}</Text>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, item.checked && styles.checkedText]}>
            {item.name}
          </Text>
          {item.essential ? <Text style={styles.badge}>필수</Text> : null}
          {item.custom ? <Text style={styles.customBadge}>직접 추가</Text> : null}
        </View>
        <Text style={styles.section}>{item.section}</Text>
        <Text style={styles.tip}>{item.tip}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  checkbox: {
    color: '#ff6b6b',
    fontSize: 26,
    lineHeight: 28,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    color: '#241b16',
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  checkedText: {
    color: '#8b8078',
    textDecorationLine: 'line-through',
  },
  badge: {
    backgroundColor: '#ffe3bf',
    borderRadius: 999,
    color: '#905a22',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  customBadge: {
    backgroundColor: '#e0ebff',
    borderRadius: 999,
    color: '#365da5',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  section: {
    color: '#b05f3c',
    fontSize: 12,
    fontWeight: '700',
  },
  tip: {
    color: '#6d5e55',
    fontSize: 13,
    lineHeight: 18,
  },
});
