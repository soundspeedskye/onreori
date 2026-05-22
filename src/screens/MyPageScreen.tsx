import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {colors} from '../theme/tokens';

import {useAuth} from '../auth/AuthContext';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {EmptyState} from '../components/ui/EmptyState';
import {getAllChecklists} from '../storage/checklists';
import type {Checklist, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

export function MyPageScreen({navigation}: Props) {
  const {user, signOut} = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  const loadChecklists = useCallback(async () => {
    setChecklists(await getAllChecklists());
  }, []);

  useEffect(() => {
    loadChecklists();
  }, [loadChecklists]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace('CategoryHome');
    } catch {
      Alert.alert('로그아웃에 실패했습니다.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.title}>마이페이지</Text>
            <Text style={styles.description}>
              내 계정에 저장한 체크리스트와 참여한 단톡방은 로그인 후 확인할 수
              있어요.
            </Text>
            <Button
              onPress={() =>
                navigation.navigate('Auth', {redirect: {type: 'myPage'}})
              }
              title="로그인하기"
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Card style={styles.profileCard}>
            <Text style={styles.profileIcon}>💗</Text>
            <View style={styles.profileCopy}>
              <Text style={styles.title}>{user.nickname}</Text>
              <Text style={styles.description}>{user.email}</Text>
            </View>
          </Card>
          <Text style={styles.sectionTitle}>내 체크리스트</Text>
        </View>

        {checklists.length === 0 ? (
          <EmptyState
            title="저장된 체크리스트가 없습니다."
            style={styles.emptyBox}
          />
        ) : (
          <View style={styles.checklistList}>
            {checklists.map(item => (
              <Card
                key={item.id}
                onPress={() =>
                  navigation.navigate('Checklist', {checklistId: item.id})
                }
                style={styles.checklistCard}>
                <Text style={styles.checklistTitle}>
                  {item.icon} {item.title}
                </Text>
                <Text style={styles.checklistMeta}>
                  {item.saveState === 'synced'
                    ? '내 계정에 저장됨'
                    : item.saveState === 'localOnly'
                      ? '로컬에 저장됨'
                    : '임시 저장'}
                </Text>
              </Card>
            ))}
          </View>
        )}

        <Button
          onPress={handleSignOut}
          style={styles.signOutButton}
          textStyle={styles.signOutButtonText}
          title="로그아웃"
          variant="ghost"
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
    gap: 14,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 18,
  },
  card: {
    borderRadius: 24,
    gap: 12,
    padding: 20,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  profileIcon: {
    fontSize: 36,
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  checklistList: {
    gap: 12,
  },
  checklistCard: {
    borderRadius: 18,
    gap: 6,
    padding: 16,
  },
  checklistTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  checklistMeta: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  signOutButton: {
    minHeight: 0,
    paddingVertical: 16,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
});
