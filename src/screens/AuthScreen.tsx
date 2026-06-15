import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {AuthForm, type AuthFormMode} from '../components/auth/AuthForm';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {colors, layout, spacing} from '../theme/tokens';
import type {RootStackParamList} from '../types';
import {ALERT_MESSAGES, showError} from '../utils/appAlert';
import {useAuthRedirect} from './auth/useAuthRedirect';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

/**
 * 로그인과 회원가입을 처리하고 인증 후 요청된 목적 화면으로 리다이렉트한다.
 */
export function AuthScreen({navigation, route}: Props) {
  const {signIn, signUp, serverConfigured} = useAuth();
  const [mode, setMode] = useState<AuthFormMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {completeRedirect} = useAuthRedirect({
    navigation,
    redirect: route.params?.redirect,
  });

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const nextUser =
        mode === 'signIn'
          ? await signIn(email, password)
          : await signUp(email, password, nickname);
      await completeRedirect(nextUser);
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.failed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ScreenHeader
            title={mode === 'signIn' ? '로그인' : '회원가입'}
            description="이벤트 단톡방 입장과 내 계정 저장은 로그인한 사용자만 사용할 수 있어요."
          />
        </View>

        <AuthForm
          mode={mode}
          email={email}
          password={password}
          nickname={nickname}
          submitting={submitting}
          serverConfigured={serverConfigured}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onNicknameChange={setNickname}
          onSubmit={handleSubmit}
          onToggleMode={() =>
            setMode(current => (current === 'signIn' ? 'signUp' : 'signIn'))
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: layout.screenPadding,
  },
  header: {
    marginBottom: spacing.sm,
  },
});
