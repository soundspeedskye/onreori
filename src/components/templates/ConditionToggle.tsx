import React from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';

import {colors} from '../../theme/tokens';
import type {TemplateCondition} from '../../types';
import {Card} from '../ui/Card';

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
    <Card style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.label}>{condition.label}</Text>
        <Text style={styles.description}>{condition.description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: colors.border, true: colors.brand}}
        thumbColor={value ? colors.brand : colors.surface}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
