import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {MyChecklistTab} from '../components/myPage/MyChecklistTab';
import {MyPageGuest} from '../components/myPage/MyPageGuest';
import {MyPageProfileHeader} from '../components/myPage/MyPageProfileHeader';
import {MyPageTabs, type MyPageTab} from '../components/myPage/MyPageTabs';
import {MyRoomsTab} from '../components/myPage/MyRoomsTab';
import {Button} from '../components/ui/Button';
import {restoreChecklistFromAccount} from '../services/checklistAccount';
import {saveChecklistRestoredFromAccount} from '../storage/checklists';
import {colors, layout, spacing} from '../theme/tokens';
import type {EventRoom, RemoteChecklistSummary, RootStackParamList} from '../types';
import {ALERT_MESSAGES, showError} from '../utils/appAlert';
import {useMyChecklists} from './myPage/useMyChecklists';
import {useMyRooms} from './myPage/useMyRooms';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

export function MyPageScreen({navigation}: Props) {
  const {user, signOut} = useAuth();
  const [activeTab, setActiveTab] = useState<MyPageTab>('checklists');
  const {checklists, loadingChecklists} = useMyChecklists(user);
  const {myRooms, loadingMyRooms} = useMyRooms(user);

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

  const openRoom = (room: EventRoom) => {
    navigation.navigate('RoomChat', {
      roomId: room.id,
      title: room.title,
      categoryId: room.categoryId,
    });
  };

  const openChecklist = async (checklist: RemoteChecklistSummary) => {
    if (!user) {
      return;
    }

    try {
      const restoredChecklist = await restoreChecklistFromAccount(
        checklist.remoteId,
        user,
      );
      await saveChecklistRestoredFromAccount(restoredChecklist);
      navigation.navigate('Checklist', {checklistId: restoredChecklist.id});
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.loadFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    }
  };

  if (!user) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <MyPageGuest
          onLogin={() =>
            navigation.navigate('Auth', {redirect: {type: 'myPage'}})
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MyPageProfileHeader user={user} />
          <MyPageTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        </View>

        {activeTab === 'checklists' ? (
          <MyChecklistTab
            checklists={checklists}
            loadingChecklists={loadingChecklists}
            onOpenChecklist={openChecklist}
          />
        ) : (
          <MyRoomsTab
            myRooms={myRooms}
            loadingMyRooms={loadingMyRooms}
            onOpenRoom={openRoom}
          />
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
    gap: spacing.lg,
    padding: layout.screenPadding,
    paddingBottom: layout.screenBottomPadding,
  },
  header: {
    gap: spacing.lg,
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
