import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {colors, radii, spacing} from '../theme/tokens';

import {useAuth} from '../auth/AuthContext';
import {ChatComposer} from '../components/rooms/ChatComposer';
import {ChatMessageBubble} from '../components/rooms/ChatMessageBubble';
import {Button} from '../components/ui/Button';
import {TextField} from '../components/ui/TextField';
import {
  createTutorialBotReply,
  ensureTutorialWelcomeMessages,
  isTutorialRoomId,
  listMessages,
  sendImageMessage,
  sendTextMessage,
  subscribeToRoomMessages,
} from '../services/rooms';
import type {ChatMessage, RootStackParamList} from '../types';
import {ALERT_MESSAGES, showAlert, showError} from '../utils/appAlert';
import {filterMessagesByHashtag} from '../utils/hashtags';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomChat'>;
type MessageStateUpdater = (
  updater: (currentMessages: ChatMessage[]) => ChatMessage[],
) => void;
const TUTORIAL_BOT_TYPING_DELAY_MS = 700;

type ChatMessagePresentation = {
  isMine: boolean;
  showNickname: boolean;
  showTime: boolean;
  timeLabel: string;
};

function getChatMessageMinuteKey(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt.slice(0, 16);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatChatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function getChatMessagePresentation(
  messages: ChatMessage[],
  index: number,
  currentUserId: string | undefined,
): ChatMessagePresentation {
  const message = messages[index];
  const previousMessage = index > 0 ? messages[index - 1] : undefined;
  const isMine = message.userId === currentUserId;
  const sameAuthor = previousMessage?.userId === message.userId;
  const sameMinute =
    sameAuthor &&
    previousMessage !== undefined &&
    getChatMessageMinuteKey(previousMessage.createdAt) ===
      getChatMessageMinuteKey(message.createdAt);

  return {
    isMine,
    showNickname: !isMine && !sameAuthor,
    showTime: !sameAuthor || !sameMinute,
    timeLabel: formatChatMessageTime(message.createdAt),
  };
}

export function mergeMessagesByCreatedAt(
  currentMessages: ChatMessage[],
  ...incomingMessages: ChatMessage[]
): ChatMessage[] {
  const messagesById = new Map(
    currentMessages.map(message => [message.id, message]),
  );

  incomingMessages.forEach(message => {
    const existingMessage = messagesById.get(message.id);

    if (!existingMessage) {
      messagesById.set(message.id, message);
      return;
    }

    if (
      message.type === 'image' &&
      message.mediaUrl &&
      existingMessage.mediaUrl !== message.mediaUrl
    ) {
      messagesById.set(message.id, {
        ...existingMessage,
        mediaUrl: message.mediaUrl,
      });
    }
  });

  return Array.from(messagesById.values()).sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

export function mergeRoomMessagesByCreatedAt(
  roomId: string,
  currentMessages: ChatMessage[],
  ...incomingMessages: ChatMessage[]
): ChatMessage[] {
  return mergeMessagesByCreatedAt(
    currentMessages.filter(message => message.roomId === roomId),
    ...incomingMessages.filter(message => message.roomId === roomId),
  );
}

export function getVisibleMessagesForHashtagFilter(
  messages: ChatMessage[],
  filter: string,
): ChatMessage[] {
  const normalizedFilter = filter.trim();

  return normalizedFilter
    ? filterMessagesByHashtag(messages, normalizedFilter)
    : messages;
}

export function appendRealtimeMessageIfActive(
  isActive: boolean,
  updateMessages: MessageStateUpdater,
  message: ChatMessage,
): void {
  if (!isActive) {
    return;
  }

  updateMessages(current => mergeMessagesByCreatedAt(current, message));
}

export function RoomChatScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [hashtagFilter, setHashtagFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const tutorialBotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTutorialBotTimers() {
    tutorialBotTimersRef.current.forEach(timer => clearTimeout(timer));
    tutorialBotTimersRef.current = [];
  }

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
      return;
    }

    let active = true;
    const roomId = route.params.roomId;
    const tutorialRoom = isTutorialRoomId(roomId);

    setLoading(true);
    setBotTyping(false);
    clearTutorialBotTimers();
    setMessages(current =>
      current.filter(message => message.roomId === roomId),
    );

    function scheduleTutorialWelcomeMessages() {
      setBotTyping(true);
      const timer = setTimeout(async () => {
        try {
          const welcomeMessages = await ensureTutorialWelcomeMessages(roomId);
          if (active) {
            setMessages(current =>
              mergeRoomMessagesByCreatedAt(
                roomId,
                current,
                ...welcomeMessages,
              ),
            );
          }
        } finally {
          if (active) {
            setBotTyping(false);
          }
        }
      }, TUTORIAL_BOT_TYPING_DELAY_MS);

      tutorialBotTimersRef.current.push(timer);
    }

    async function load() {
      try {
        const nextMessages = await listMessages(roomId);
        if (active) {
          setMessages(current =>
            mergeRoomMessagesByCreatedAt(roomId, current, ...nextMessages),
          );

          if (tutorialRoom && nextMessages.length === 0) {
            scheduleTutorialWelcomeMessages();
          }
        }
      } catch (error) {
        showError(error, {
          title: ALERT_MESSAGES.loadFailed,
          fallbackMessage: ALERT_MESSAGES.retry,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    const unsubscribe = subscribeToRoomMessages(roomId, message => {
      if (message.roomId === roomId) {
        appendRealtimeMessageIfActive(active, setMessages, message);
      }
    });

    return () => {
      active = false;
      clearTutorialBotTimers();
      unsubscribe();
    };
  }, [navigation, route.params.roomId, user]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 50);
    }
  }, [messages.length]);

  const handleSendText = async () => {
    if (!user || sending) {
      return;
    }

    try {
      setSending(true);
      const message = await sendTextMessage(route.params.roomId, body, user);
      setMessages(current => mergeMessagesByCreatedAt(current, message));
      setBody('');
      if (isTutorialRoomId(route.params.roomId)) {
        setBotTyping(true);
        const timer = setTimeout(async () => {
          try {
            const botReply = await createTutorialBotReply(route.params.roomId);
            setMessages(current => mergeMessagesByCreatedAt(current, botReply));
          } finally {
            setBotTyping(false);
          }
        }, TUTORIAL_BOT_TYPING_DELAY_MS);
        tutorialBotTimersRef.current.push(timer);
      }
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.sendFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    if (!user || sending) {
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    const asset = result.assets?.[0];

    if (!asset?.uri) {
      showAlert({title: ALERT_MESSAGES.loadFailed});
      return;
    }

    try {
      setSending(true);
      const message = await sendImageMessage({
        roomId: route.params.roomId,
        user,
        imageUri: asset.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        contentType: asset.type ?? 'image/jpeg',
      });
      setMessages(current => mergeMessagesByCreatedAt(current, message));
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.sendFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setSending(false);
    }
  };

  const visibleMessages = getVisibleMessagesForHashtagFilter(
    messages,
    hashtagFilter,
  );
  const tutorialRoom = isTutorialRoomId(route.params.roomId);

  const renderMessage = ({item, index}: {item: ChatMessage; index: number}) => {
    const presentation = getChatMessagePresentation(
      visibleMessages,
      index,
      user?.id,
    );

    return <ChatMessageBubble message={item} {...presentation} />;
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{route.params.title}</Text>
        <Text style={styles.description}>
          {tutorialRoom
            ? '오늘의오리가 단톡방 사용법을 안내해요.'
            : '입장코드로 들어온 사람들과만 대화해요.'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <>
          <View style={styles.filterBar}>
            <TextField
              onChangeText={setHashtagFilter}
              placeholder="카페명 또는 #태그 검색"
              style={styles.filterInput}
              value={hashtagFilter}
            />
            {hashtagFilter.trim() ? (
              <Button
                onPress={() => setHashtagFilter('')}
                style={styles.clearFilterButton}
                title="해제"
                variant="secondary"
              />
            ) : null}
          </View>
          <FlatList
            ref={listRef}
            contentContainerStyle={styles.messageList}
            data={visibleMessages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            ListEmptyComponent={
              botTyping ? null : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>아직 메시지가 없습니다.</Text>
              </View>
              )
            }
            ListFooterComponent={
              botTyping ? (
                <View style={styles.typingBox}>
                  <Text style={styles.typingText}>오늘의오리가 입력 중...</Text>
                </View>
              ) : null
            }
          />
        </>
      )}

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
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  description: {
    color: colors.brandMuted,
    fontSize: 13,
  },
  loader: {
    flex: 1,
  },
  filterBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  filterInput: {
    flex: 1,
  },
  clearFilterButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageList: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
  typingBox: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
