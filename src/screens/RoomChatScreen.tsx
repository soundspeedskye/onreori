import React, {useEffect, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {
  AndroidSoftInputModes,
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
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

const keyboardStickyOffset = {
  closed: 0,
  opened: 0,
} as const;

export function RoomChatScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const roomId = route.params.roomId;
  const [hashtagFilter, setHashtagFilter] = useState('');

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
    }
  }, [navigation, user]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    KeyboardController.setInputMode(
      AndroidSoftInputModes.SOFT_INPUT_ADJUST_NOTHING,
    );

    return () => {
      KeyboardController.setDefaultMode();
    };
  }, []);

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
      <View style={styles.keyboardAwareArea}>
        <ChatMessageList
          messages={visibleMessages}
          hashtagFilter={hashtagFilter}
          currentUserId={user?.id}
          loading={loading}
          botTyping={botTyping}
          onHashtagFilterChange={setHashtagFilter}
          onClearHashtagFilter={() => setHashtagFilter('')}
        />
        <KeyboardStickyView
          offset={keyboardStickyOffset}
          style={styles.composerDock}>
          <ChatComposer
            body={body}
            onBodyChange={setBody}
            onSendImage={handleSendImage}
            onSendText={handleSendText}
            sending={sending}
          />
        </KeyboardStickyView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardAwareArea: {
    flex: 1,
  },
  composerDock: {
    backgroundColor: colors.surface,
  },
});
