import React, {useEffect, useMemo, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {
  KeyboardAvoidingView,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {ChatComposer} from '../components/rooms/ChatComposer';
import {ChatHeader} from '../components/rooms/ChatHeader';
import {ChatMessageList} from '../components/rooms/ChatMessageList';
import {useAppLanguage} from '../i18n/AppLanguageProvider';
import {getTutorialRoomCopy, isTutorialRoomId} from '../services/rooms';
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

/**
 * 단톡방 메시지 목록, 해시태그 필터, 텍스트/이미지 전송, 튜토리얼 응답을 연결한다.
 */
export function RoomChatScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const {language} = useAppLanguage();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState(state => state.isVisible);
  const roomId = route.params.roomId;
  const tutorialRoom = isTutorialRoomId(roomId);
  const tutorialCopy = useMemo(() => getTutorialRoomCopy(language), [language]);
  const [hashtagFilter, setHashtagFilter] = useState('');

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
    }
  }, [navigation, user]);

  const {messages, setMessages, loading, botTyping, scheduleTutorialReply} =
    useRoomMessages(roomId, Boolean(user), tutorialCopy);
  const {body, setBody, sending, handleSendText, handleSendImage} =
    useChatSendActions({
      roomId,
      user,
      tutorialCopy,
      setMessages,
      scheduleTutorialReply,
    });
  const visibleMessages = getVisibleMessagesForHashtagFilter(
    messages,
    hashtagFilter,
  );
  const composerDockStyle = useMemo(
    () => [
      styles.composerDock,
      {paddingBottom: keyboardVisible ? 0 : insets.bottom},
    ],
    [insets.bottom, keyboardVisible],
  );

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <ChatHeader
        languageCodes={
          tutorialRoom
            ? [tutorialCopy.languageCode]
            : route.params.languageCodes ?? ['ko']
        }
        title={tutorialRoom ? tutorialCopy.roomTitle : route.params.title}
        tutorialRoom={tutorialRoom}
      />
      <KeyboardAvoidingView
        automaticOffset
        behavior="padding"
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardAwareArea}>
        <ChatMessageList
          messages={visibleMessages}
          hashtagFilter={hashtagFilter}
          currentUserId={user?.id}
          loading={loading}
          botTyping={botTyping}
          onHashtagFilterChange={setHashtagFilter}
          onClearHashtagFilter={() => setHashtagFilter('')}
        />
        <View testID="chat-composer-dock" style={composerDockStyle}>
          <ChatComposer
            body={body}
            onBodyChange={setBody}
            onSendImage={handleSendImage}
            onSendText={handleSendText}
            sending={sending}
          />
        </View>
      </KeyboardAvoidingView>
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
