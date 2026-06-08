import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

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
  return (
    <>
      {!serverConfigured ? (
        <Text style={styles.previewNotice}>
          Supabase 설정 전이라 현재는 로컬 프리뷰 로그인으로 동작합니다.
        </Text>
      ) : null}

      <View style={styles.form}>
        {mode === 'signUp' ? (
          <TextField
            onChangeText={onNicknameChange}
            placeholder="닉네임"
            style={styles.input}
            value={nickname}
          />
        ) : null}
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={onEmailChange}
          placeholder="이메일"
          style={styles.input}
          value={email}
        />
        <TextField
          onChangeText={onPasswordChange}
          placeholder="비밀번호"
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>

      <Button
        loading={submitting}
        onPress={onSubmit}
        style={styles.primaryButton}
        title={mode === 'signIn' ? '로그인하기' : '가입하고 계속하기'}
      />

      <Button
        onPress={onToggleMode}
        style={styles.switchButton}
        textStyle={styles.switchButtonText}
        title={
          mode === 'signIn'
            ? '계정이 없다면 회원가입'
            : '이미 계정이 있다면 로그인'
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
