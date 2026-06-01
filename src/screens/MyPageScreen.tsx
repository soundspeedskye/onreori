import React, {useCallback, useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {colors, layout, radii, spacing} from '../theme/tokens';

import {useAuth} from '../auth/AuthContext';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {EmptyState} from '../components/ui/EmptyState';
import {listMyRooms, type MyRooms} from '../services/rooms';
import {getAllChecklists} from '../storage/checklists';
import type {Checklist, EventRoom, RootStackParamList} from '../types';
import {ALERT_MESSAGES, showError} from '../utils/appAlert';
import {getChecklistSaveStateLabel} from '../utils/checklistPresentation';
import {getEventRoomMetaLabel} from '../utils/eventRoomPresentation';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;
type MyPageTab = 'checklists' | 'rooms';

export function MyPageScreen({navigation}: Props) {
  const {user, signOut} = useAuth();
  const [activeTab, setActiveTab] = useState<MyPageTab>('checklists');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [myRooms, setMyRooms] = useState<MyRooms>({
    createdRooms: [],
    joinedRooms: [],
  });
  const [loadingMyRooms, setLoadingMyRooms] = useState(false);

  const loadChecklists = useCallback(async () => {
    setChecklists(await getAllChecklists());
  }, []);

  useEffect(() => {
    loadChecklists();
  }, [loadChecklists]);

  const loadMyRooms = useCallback(async () => {
    if (!user) {
      setMyRooms({createdRooms: [], joinedRooms: []});
      return;
    }

    try {
      setLoadingMyRooms(true);
      setMyRooms(await listMyRooms(user));
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.loadFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setLoadingMyRooms(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyRooms();
  }, [loadMyRooms]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace('CategoryHome');
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.failed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    }
  };

  if (!user) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.title}>마이페이지</Text>
            <Text style={styles.description}>
              저장한 체크리스트와 참여한 단톡방은 로그인 후 확인할 수 있어요.
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
          <View style={styles.tabList}>
            <Pressable
              accessibilityLabel="내 체크리스트 탭"
              onPress={() => setActiveTab('checklists')}
              style={[
                styles.tab,
                activeTab === 'checklists' && styles.activeTab,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'checklists' && styles.activeTabText,
                ]}>
                내 체크리스트
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="내 단톡방 탭"
              onPress={() => setActiveTab('rooms')}
              style={[
                styles.tab,
                activeTab === 'rooms' && styles.activeTab,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'rooms' && styles.activeTabText,
                ]}>
                내 단톡방
              </Text>
            </Pressable>
          </View>
        </View>

        {activeTab === 'checklists'
          ? renderChecklistTab(checklists, navigation)
          : renderRoomsTab(myRooms, loadingMyRooms, navigation)}

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

function renderChecklistTab(
  checklists: Checklist[],
  navigation: Props['navigation'],
) {
  if (checklists.length === 0) {
    return (
      <EmptyState
        title="저장된 체크리스트가 없습니다."
        style={styles.emptyBox}
      />
    );
  }

  return (
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
            {getChecklistSaveStateLabel(item.saveState)}
          </Text>
        </Card>
      ))}
    </View>
  );
}

function renderRoomCard(room: EventRoom, navigation: Props['navigation']) {
  return (
    <Card
      accessibilityLabel={`${room.title} 단톡방 열기`}
      key={room.id}
      onPress={() =>
        navigation.navigate('RoomChat', {
          roomId: room.id,
          title: room.title,
          categoryId: room.categoryId,
        })
      }
      style={styles.roomCard}>
      <Text style={styles.roomTitle}>{room.title}</Text>
      <Text style={styles.roomMeta}>{getEventRoomMetaLabel(room)}</Text>
      <Text style={styles.roomMembers}>참여 {room.memberCount}명</Text>
    </Card>
  );
}

function renderRoomsTab(
  myRooms: MyRooms,
  loadingMyRooms: boolean,
  navigation: Props['navigation'],
) {
  const hasCreatedRooms = myRooms.createdRooms.length > 0;
  const hasJoinedRooms = myRooms.joinedRooms.length > 0;

  if (loadingMyRooms) {
    return (
      <EmptyState
        title="단톡방 내역을 불러오는 중입니다."
        style={styles.emptyBox}
      />
    );
  }

  if (!hasCreatedRooms && !hasJoinedRooms) {
    return <EmptyState title="단톡방 내역이 없습니다." style={styles.emptyBox} />;
  }

  return (
    <View style={styles.roomGroups}>
      {hasCreatedRooms ? (
        <View style={styles.roomGroup}>
          <Text style={styles.roomSectionTitle}>내가 만든 단톡방</Text>
          <View style={styles.roomList}>
            {myRooms.createdRooms.map(room => renderRoomCard(room, navigation))}
          </View>
        </View>
      ) : null}

      {hasJoinedRooms ? (
        <View style={styles.roomGroup}>
          <Text style={styles.roomSectionTitle}>참여한 단톡방</Text>
          <View style={styles.roomList}>
            {myRooms.joinedRooms.map(room => renderRoomCard(room, navigation))}
          </View>
        </View>
      ) : null}
    </View>
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
    paddingBottom: layout.screenBottomPadding,
  },
  header: {
    gap: spacing.lg,
  },
  tabList: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  activeTab: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  tabText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  activeTabText: {
    color: colors.text,
  },
  card: {
    borderRadius: radii.xl,
    gap: spacing.md,
    padding: layout.screenPadding,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  profileIcon: {
    fontSize: 36,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
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
    gap: spacing.md,
  },
  checklistCard: {
    borderRadius: radii.card,
    gap: spacing.sm,
    padding: spacing.lg,
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
  roomGroups: {
    gap: spacing.lg,
  },
  roomGroup: {
    gap: spacing.sm,
  },
  roomList: {
    gap: spacing.md,
  },
  roomCard: {
    borderRadius: radii.card,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  roomSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  roomTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  roomMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  roomMembers: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
  signOutButton: {
    minHeight: 0,
    paddingVertical: spacing.lg,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
});
