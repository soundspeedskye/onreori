import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';

import {colors} from '../../theme/tokens';

type ScreenHeaderProps = {
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({
  title,
  description,
  trailing,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
