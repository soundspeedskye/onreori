import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {saveChecklistToAccount} from '../services/checklistAccount';
import {
  consumePendingAccountSaveChecklistId,
  getChecklistById,
  saveChecklistSynced,
} from '../storage/checklists';
import type {AuthUser, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({navigation, route}: Props) {
  const {signIn, signUp, serverConfigured} = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const completeRedirect = async (nextUser: AuthUser) => {
    const redirect = route.params?.redirect;

    if (!redirect) {
      navigation.replace('CategoryHome');
      return;
    }

    if (redirect.type === 'eventRooms') {
      navigation.replace('EventRooms', {categoryId: redirect.categoryId});
      return;
    }

    if (redirect.type === 'myPage') {
      navigation.replace('MyPage');
      return;
    }

    const pendingChecklistId =
      (await consumePendingAccountSaveChecklistId()) ?? redirect.checklistId;
    const checklist = await getChecklistById(pendingChecklistId);

    if (!checklist) {
      Alert.alert('체크리스트를 찾지 못했습니다.');
      navigation.replace('CategoryHome');
      return;
    }

    const remoteReference = await saveChecklistToAccount(checklist, nextUser);
    await saveChecklistSynced(checklist, remoteReference);
    navigation.replace('Checklist', {checklistId: checklist.id});
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const nextUser =
        mode === 'signIn'
          ? await signIn(email, password)
          : await signUp(email, password, nickname);
      await completeRedirect(nextUser);
    } catch (error) {
      Alert.alert(
        mode === 'signIn' ? '로그인 실패' : '회원가입 실패',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'signIn' ? '로그인' : '회원가입'}
          </Text>
          <Text style={styles.description}>
            이벤트 단톡방 입장과 내 계정 저장은 로그인한 사용자만 사용할 수
            있어요.
          </Text>
          {!serverConfigured ? (
            <Text style={styles.previewNotice}>
              Supabase 설정 전이라 현재는 로컬 프리뷰 로그인으로 동작합니다.
            </Text>
          ) : null}
        </View>

        <View style={styles.form}>
          {mode === 'signUp' ? (
            <TextInput
              onChangeText={setNickname}
              placeholder="닉네임"
              placeholderTextColor="#9d8f86"
              style={styles.input}
              value={nickname}
            />
          ) : null}
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor="#9d8f86"
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor="#9d8f86"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <Pressable
          disabled={submitting}
          onPress={handleSubmit}
          style={[styles.primaryButton, submitting && styles.disabledButton]}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'signIn' ? '로그인하기' : '가입하고 계속하기'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          style={styles.switchButton}>
          <Text style={styles.switchButtonText}>
            {mode === 'signIn'
              ? '계정이 없다면 회원가입'
              : '이미 계정이 있다면 로그인'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7f1ea',
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: '#241b16',
    fontSize: 30,
    fontWeight: '900',
  },
  description: {
    color: '#5f5047',
    fontSize: 15,
    lineHeight: 22,
  },
  previewNotice: {
    backgroundColor: '#fff2c7',
    borderRadius: 14,
    color: '#76521b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
    overflow: 'hidden',
    padding: 12,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 16,
    borderWidth: 1,
    color: '#241b16',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 17,
    minHeight: 54,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchButtonText: {
    color: '#b05f3c',
    fontSize: 14,
    fontWeight: '800',
  },
});
