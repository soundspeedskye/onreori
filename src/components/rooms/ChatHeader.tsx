import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, spacing} from '../../theme/tokens';
import {RoomLanguageChips} from './RoomLanguageChips';

type ChatHeaderProps = {
  title: string;
  tutorialRoom: boolean;
  languageCodes: unknown;
};

export function ChatHeader({
  title,
  tutorialRoom,
  languageCodes,
}: ChatHeaderProps) {
  const {t} = useTranslation('rooms');

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <RoomLanguageChips languageCodes={languageCodes} />
      <Text style={styles.description}>
        {tutorialRoom
          ? t('tutorialRoomDescription')
          : t('chatRoomDescription')}
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
