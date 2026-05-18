import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
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
          <View style={styles.card}>
            <Text style={styles.title}>마이페이지</Text>
            <Text style={styles.description}>
              내 계정에 저장한 체크리스트와 참여한 단톡방은 로그인 후 확인할 수
              있어요.
            </Text>
            <Pressable
              onPress={() =>
                navigation.navigate('Auth', {redirect: {type: 'myPage'}})
              }
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>로그인하기</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.profileCard}>
            <Text style={styles.profileIcon}>💗</Text>
            <View style={styles.profileCopy}>
              <Text style={styles.title}>{user.nickname}</Text>
              <Text style={styles.description}>{user.email}</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>내 체크리스트</Text>
        </View>

        {checklists.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>저장된 체크리스트가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.checklistList}>
            {checklists.map(item => (
              <Pressable
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
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutButtonText}>로그아웃</Text>
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
    gap: 14,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 18,
  },
  card: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 24,
    borderWidth: 1,
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
    color: '#241b16',
    fontSize: 26,
    fontWeight: '900',
  },
  description: {
    color: '#5f5047',
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    color: '#241b16',
    fontSize: 19,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  checklistList: {
    gap: 12,
  },
  checklistCard: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  checklistTitle: {
    color: '#241b16',
    fontSize: 17,
    fontWeight: '800',
  },
  checklistMeta: {
    color: '#b05f3c',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: '#7a6d64',
    fontSize: 14,
    fontWeight: '700',
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signOutButtonText: {
    color: '#b05f3c',
    fontSize: 14,
    fontWeight: '900',
  },
});
