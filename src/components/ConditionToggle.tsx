import React from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';

import type {TemplateCondition} from '../types';

type ConditionToggleProps = {
  condition: TemplateCondition;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
};

export function ConditionToggle({
  condition,
  value,
  onValueChange,
}: ConditionToggleProps) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.label}>{condition.label}</Text>
        <Text style={styles.description}>{condition.description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: '#d8ccc1', true: '#ffad8f'}}
        thumbColor={value ? '#ff6b6b' : '#ffffff'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#241b16',
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    color: '#6d5e55',
    fontSize: 13,
    lineHeight: 18,
  },
});
