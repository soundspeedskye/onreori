import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {colors} from '../theme/tokens';

import {useAuth} from '../auth/AuthContext';
import {ChatComposer} from '../components/rooms/ChatComposer';
import {ChatMessageBubble} from '../components/rooms/ChatMessageBubble';
import {Button} from '../components/ui/Button';
import {TextField} from '../components/ui/TextField';
import {
  listMessages,
  sendImageMessage,
  sendTextMessage,
  subscribeToRoomMessages,
} from '../services/rooms';
import type {ChatMessage, RootStackParamList} from '../types';
import {filterMessagesByHashtag} from '../utils/hashtags';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomChat'>;
type MessageStateUpdater = (
  updater: (currentMessages: ChatMessage[]) => ChatMessage[],
) => void;

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
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
      return;
    }

    let active = true;
    const roomId = route.params.roomId;

    setMessages(current =>
      current.filter(message => message.roomId === roomId),
    );

    async function load() {
      try {
        const nextMessages = await listMessages(roomId);
        if (active) {
          setMessages(current =>
            mergeRoomMessagesByCreatedAt(roomId, current, ...nextMessages),
          );
        }
      } catch (error) {
        Alert.alert(
          '메시지를 불러오지 못했습니다.',
          error instanceof Error ? error.message : '다시 시도하세요.',
        );
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
    } catch (error) {
      Alert.alert(
        '메시지를 보내지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
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
      Alert.alert('선택한 사진을 읽지 못했습니다.');
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
      Alert.alert(
        '사진을 보내지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setSending(false);
    }
  };

  const visibleMessages = getVisibleMessagesForHashtagFilter(
    messages,
    hashtagFilter,
  );

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
        <Text style={styles.description}>입장코드로 들어온 사람들과만 대화해요.</Text>
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
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>아직 메시지가 없습니다.</Text>
              </View>
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
    gap: 4,
    padding: 16,
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
    gap: 8,
    padding: 12,
  },
  filterInput: {
    flex: 1,
  },
  clearFilterButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageList: {
    gap: 8,
    padding: 16,
    paddingBottom: 22,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 28,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
});
