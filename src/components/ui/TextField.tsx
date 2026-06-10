import React from 'react';
import {StyleSheet, TextInput, TextInputProps} from 'react-native';

import {colors, radii} from '../../theme/tokens';

type TextFieldProps = TextInputProps;

export function TextField({
  placeholderTextColor = colors.muted,
  style,
  ...props
}: TextFieldProps) {
  return (
    <TextInput
      placeholderTextColor={placeholderTextColor}
      style={[styles.input, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
});
