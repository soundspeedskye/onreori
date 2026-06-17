import React, {useCallback, useEffect, useRef} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useAppLanguage} from '../../i18n/AppLanguageProvider';
import {getIntlLocale} from '../../i18n/languages';
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
  const {t} = useTranslation('rooms');
  const {language} = useAppLanguage();
  const intlLocale = getIntlLocale(language);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const didInitialScrollRef = useRef(false);

  const scrollToBottom = useCallback((animated: boolean) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({animated});
    });
  }, []);

  useEffect(() => {
    if (loading || messages.length === 0) {
      didInitialScrollRef.current = false;
    }
  }, [loading, messages.length]);

  const handleContentSizeChange = useCallback(() => {
    if (loading || messages.length === 0) {
      return;
    }

    const animated = didInitialScrollRef.current;
    scrollToBottom(animated);
    didInitialScrollRef.current = true;
  }, [loading, messages.length, scrollToBottom]);

  if (loading) {
    return <ActivityIndicator color={colors.brand} style={styles.loader} />;
  }

  const renderMessage = ({item, index}: {item: ChatMessage; index: number}) => {
    const {dateLabel, showDateSeparator, ...presentation} =
      getChatMessagePresentation(
        messages,
        index,
        currentUserId,
        intlLocale,
      );

    return (
      <View style={styles.messageItem}>
        {showDateSeparator ? <DateSeparator label={dateLabel} /> : null}
        <ChatMessageBubble message={item} {...presentation} />
      </View>
    );
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
        extraData={intlLocale}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        onContentSizeChange={handleContentSizeChange}
        ListEmptyComponent={
          botTyping ? null : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{t('emptyMessages')}</Text>
            </View>
          )
        }
        ListFooterComponent={
          botTyping ? (
            <View style={styles.typingBox}>
              <Text style={styles.typingText}>{t('botTyping')}</Text>
            </View>
          ) : null
        }
      />
    </>
  );
}

function DateSeparator({label}: {label: string}) {
  return (
    <View style={styles.dateSeparator}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{label}</Text>
      <View style={styles.dateLine} />
    </View>
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
  messageItem: {
    gap: spacing.sm,
  },
  dateSeparator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dateLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  dateText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
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
