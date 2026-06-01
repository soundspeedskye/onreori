import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

import {colors, spacing} from '../../theme/tokens';

type BottomActionBarProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function BottomActionBar({children, style}: BottomActionBarProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
