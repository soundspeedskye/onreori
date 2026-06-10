import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';

type CardProps = ViewProps & {
  children: React.ReactNode;
  onPress?: PressableProps['onPress'];
  style?: StyleProp<ViewStyle>;
};

export function Card({children, onPress, style, ...props}: CardProps) {
  const cardStyle = [styles.card, style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={cardStyle} {...props}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
