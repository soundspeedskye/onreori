import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, radii, spacing} from '../../theme/tokens';
import {Button} from '../ui/Button';
import {TextField} from '../ui/TextField';

export type AuthFormMode = 'signIn' | 'signUp';

type AuthFormProps = {
  mode: AuthFormMode;
  email: string;
  password: string;
  nickname: string;
  submitting: boolean;
  serverConfigured: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onNicknameChange: (nickname: string) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
};

export function AuthForm({
  mode,
  email,
  password,
  nickname,
  submitting,
  serverConfigured,
  onEmailChange,
  onPasswordChange,
  onNicknameChange,
  onSubmit,
  onToggleMode,
}: AuthFormProps) {
  const {t} = useTranslation('auth');

  return (
    <>
      {!serverConfigured ? (
        <Text style={styles.previewNotice}>
          {t('previewNotice')}
        </Text>
      ) : null}

      <View style={styles.form}>
        {mode === 'signUp' ? (
          <TextField
            onChangeText={onNicknameChange}
            placeholder={t('nicknamePlaceholder')}
            style={styles.input}
            value={nickname}
          />
        ) : null}
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={onEmailChange}
          placeholder={t('emailPlaceholder')}
          style={styles.input}
          value={email}
        />
        <TextField
          onChangeText={onPasswordChange}
          placeholder={t('passwordPlaceholder')}
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>

      <Button
        loading={submitting}
        onPress={onSubmit}
        style={styles.primaryButton}
        title={mode === 'signIn' ? t('signInAction') : t('signUpAction')}
      />

      <Button
        onPress={onToggleMode}
        style={styles.switchButton}
        textStyle={styles.switchButtonText}
        title={
          mode === 'signIn'
            ? t('switchToSignUp')
            : t('switchToSignIn')
        }
        variant="ghost"
      />
    </>
  );
}

const styles = StyleSheet.create({
  previewNotice: {
    backgroundColor: colors.actionSoft,
    borderRadius: radii.md,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    overflow: 'hidden',
    padding: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    borderRadius: radii.button,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButton: {
    borderRadius: radii.bubble,
    minHeight: 54,
  },
  switchButton: {
    minHeight: 0,
    paddingVertical: spacing.sm,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
