import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors} from '../../theme/tokens';
import {Card} from '../ui/Card';
import {Chip} from '../ui/Chip';

type ChecklistHeroCardProps = {
  icon: string;
  title: string;
  meta: string;
  saveStateLabel?: string;
  conditionLabels: string[];
  fallbackConditionLabel?: string;
};

export function ChecklistHeroCard({
  icon,
  title,
  meta,
  saveStateLabel,
  conditionLabels,
  fallbackConditionLabel = '선택한 추가 조건 없음',
}: ChecklistHeroCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{meta}</Text>
          {saveStateLabel ? (
            <Text style={styles.saveState}>{saveStateLabel}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.conditions}>
        {conditionLabels.length > 0 ? (
          conditionLabels.map(label => <Chip key={label} label={label} />)
        ) : (
          <Text style={styles.fallback}>{fallbackConditionLabel}</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    gap: 14,
    padding: 18,
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  icon: {
    fontSize: 38,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  meta: {
    color: colors.brandMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  saveState: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  conditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fallback: {
    color: colors.muted,
    fontSize: 13,
  },
});
