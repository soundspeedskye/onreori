import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import {colors, radii} from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const indicatorColor =
    variant === 'primary'
      ? colors.actionText
      : variant === 'dark'
        ? colors.textInverse
        : colors.brandMuted;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.button,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primary: {
    backgroundColor: colors.action,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  dark: {
    backgroundColor: colors.dark,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.65,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
  },
  primaryText: {
    color: colors.actionText,
  },
  secondaryText: {
    color: colors.text,
  },
  darkText: {
    color: colors.textInverse,
  },
  ghostText: {
    color: colors.brandMuted,
  },
});
