import {useCallback, useState} from 'react';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {
  isTutorialRoomId,
  joinRoomWithCode,
} from '../../services/rooms';
import type {AuthUser, EventRoom, RootStackParamList} from '../../types';
import {ALERT_MESSAGES, showError} from '../../utils/appAlert';

type EventRoomsNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'EventRooms'
>;

type UseRoomJoinActionParams = {
  user: AuthUser | null;
  navigation: EventRoomsNavigation;
};

export function useRoomJoinAction({
  user,
  navigation,
}: UseRoomJoinActionParams) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleJoinRoom = useCallback(
    async (room: EventRoom, entryCode: string) => {
      if (!user) {
        return;
      }

      try {
        await joinRoomWithCode(
          room.id,
          isTutorialRoomId(room.id) ? '' : entryCode,
          user,
        );
        setSelectedRoomId(null);
        navigation.navigate('RoomChat', {
          roomId: room.id,
          title: room.title,
          categoryId: room.categoryId,
          languageCodes: room.languageCodes,
        });
      } catch (error) {
        showError(error, {
          title: ALERT_MESSAGES.failed,
          fallbackMessage: ALERT_MESSAGES.checkInput,
        });
      }
    },
    [navigation, user],
  );

  return {
    selectedRoomId,
    setSelectedRoomId,
    handleJoinRoom,
  };
}
