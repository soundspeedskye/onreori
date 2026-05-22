import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

import {colors} from '../../theme/tokens';
import type {ChatMessage} from '../../types';

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  showNickname: boolean;
  showTime: boolean;
  timeLabel: string;
};

export function ChatMessageBubble({
  message,
  isMine,
  showNickname,
  showTime,
  timeLabel,
}: ChatMessageBubbleProps) {
  return (
    <View style={[styles.messageWrap, isMine && styles.myMessageWrap]}>
      <View style={[styles.bubble, isMine && styles.myBubble]}>
        {showNickname ? (
          <Text style={styles.nickname}>{message.nickname}</Text>
        ) : null}
        {message.type === 'image' && message.mediaUrl ? (
          <Image source={{uri: message.mediaUrl}} style={styles.messageImage} />
        ) : (
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {message.body}
          </Text>
        )}
      </View>
      {showTime && timeLabel ? (
        <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
          {timeLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrap: {
    alignItems: 'flex-start',
    gap: 4,
  },
  myMessageWrap: {
    alignItems: 'flex-end',
  },
  nickname: {
    color: colors.brandMuted,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 17,
    borderWidth: 1,
    maxWidth: '82%',
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  myBubble: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: colors.textInverse,
  },
  messageTime: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  myMessageTime: {
    textAlign: 'right',
  },
  messageImage: {
    borderRadius: 12,
    height: 190,
    width: 190,
  },
});
