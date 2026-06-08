import React, {useEffect, useState} from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {ChatComposer} from '../components/rooms/ChatComposer';
import {ChatHeader} from '../components/rooms/ChatHeader';
import {ChatMessageList} from '../components/rooms/ChatMessageList';
import {isTutorialRoomId} from '../services/rooms';
import {colors} from '../theme/tokens';
import type {RootStackParamList} from '../types';
import {getVisibleMessagesForHashtagFilter} from '../utils/chatMessages';
import {useChatSendActions} from './roomChat/useChatSendActions';
import {useRoomMessages} from './roomChat/useRoomMessages';

export {
  appendRealtimeMessageIfActive,
  getChatMessagePresentation,
  getVisibleMessagesForHashtagFilter,
  mergeMessagesByCreatedAt,
  mergeRoomMessagesByCreatedAt,
} from '../utils/chatMessages';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomChat'>;

export function RoomChatScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const roomId = route.params.roomId;
  const [hashtagFilter, setHashtagFilter] = useState('');

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
    }
  }, [navigation, user]);

  const {messages, setMessages, loading, botTyping, scheduleTutorialReply} =
    useRoomMessages(roomId, Boolean(user));
  const {body, setBody, sending, handleSendText, handleSendImage} =
    useChatSendActions({
      roomId,
      user,
      setMessages,
      scheduleTutorialReply,
    });
  const visibleMessages = getVisibleMessagesForHashtagFilter(
    messages,
    hashtagFilter,
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ChatHeader
        title={route.params.title}
        tutorialRoom={isTutorialRoomId(roomId)}
      />
      <ChatMessageList
        messages={visibleMessages}
        hashtagFilter={hashtagFilter}
        currentUserId={user?.id}
        loading={loading}
        botTyping={botTyping}
        onHashtagFilterChange={setHashtagFilter}
        onClearHashtagFilter={() => setHashtagFilter('')}
      />
      <ChatComposer
        body={body}
        onBodyChange={setBody}
        onSendImage={handleSendImage}
        onSendText={handleSendText}
        sending={sending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
