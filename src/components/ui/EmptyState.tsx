import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';

import {colors} from '../../theme/tokens';

type EmptyStateProps = {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({title, description, style}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
});
