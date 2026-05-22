import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native';

import {colors} from '../../theme/tokens';

type ChipTone = 'brand' | 'action';

type ChipProps = {
  label?: string;
  children?: React.ReactNode;
  tone?: ChipTone;
  style?: StyleProp<TextStyle>;
};

export function Chip({label, children, tone = 'brand', style}: ChipProps) {
  return (
    <Text style={[styles.base, styles[tone], style]}>
      {children ?? label}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  brand: {
    backgroundColor: colors.surfaceMuted,
    color: colors.brandText,
  },
  action: {
    backgroundColor: colors.actionSoft,
    color: colors.text,
  },
});
