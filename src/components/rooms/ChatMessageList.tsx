import React, {useEffect, useRef} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';
import type {ChatMessage} from '../../types';
import {getChatMessagePresentation} from '../../utils/chatMessages';
import {ChatMessageBubble} from './ChatMessageBubble';
import {HashtagFilterBar} from './HashtagFilterBar';

type ChatMessageListProps = {
  messages: ChatMessage[];
  hashtagFilter: string;
  currentUserId?: string;
  loading: boolean;
  botTyping: boolean;
  onHashtagFilterChange: (value: string) => void;
  onClearHashtagFilter: () => void;
};

export function ChatMessageList({
  messages,
  hashtagFilter,
  currentUserId,
  loading,
  botTyping,
  onHashtagFilterChange,
  onClearHashtagFilter,
}: ChatMessageListProps) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 50);
    }
  }, [messages.length]);

  if (loading) {
    return <ActivityIndicator color={colors.brand} style={styles.loader} />;
  }

  const renderMessage = ({item, index}: {item: ChatMessage; index: number}) => {
    const presentation = getChatMessagePresentation(
      messages,
      index,
      currentUserId,
    );

    return <ChatMessageBubble message={item} {...presentation} />;
  };

  return (
    <>
      <View style={styles.filterWrap}>
        <HashtagFilterBar
          value={hashtagFilter}
          onChange={onHashtagFilterChange}
          onClear={onClearHashtagFilter}
        />
      </View>
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.messageList}
        data={messages}
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
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
  },
  filterWrap: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  list: {
    flex: 1,
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
