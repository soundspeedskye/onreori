import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';

type ChatHeaderProps = {
  title: string;
  tutorialRoom: boolean;
};

export function ChatHeader({ title, tutorialRoom }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>
        {tutorialRoom
          ? '오늘의오리가 단톡방 사용법을 안내해요.'
          : '현장에 계신가요? 실시간 정보를 공유해주세요.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
