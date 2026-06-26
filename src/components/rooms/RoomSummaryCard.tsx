import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useAppLanguage} from '../../i18n/AppLanguageProvider';
import {getIntlLocale} from '../../i18n/languages';
import {colors, radii, spacing} from '../../theme/tokens';
import type {EventRoom} from '../../types';
import {getEventRoomMetaLabel} from '../../utils/eventRoomPresentation';
import {Card} from '../ui/Card';
import {RoomLanguageChips} from './RoomLanguageChips';

type RoomSummaryCardVariant = 'default' | 'history';

type RoomSummaryCardProps = {
  accessibilityLabel?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onPress?: PressableProps['onPress'];
  room: EventRoom;
  style?: StyleProp<ViewStyle>;
  variant?: RoomSummaryCardVariant;
};

export function RoomSummaryCard({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  room,
  style,
  variant = 'default',
}: RoomSummaryCardProps) {
  const {t} = useTranslation('rooms');
  const {language} = useAppLanguage();
  const intlLocale = getIntlLocale(language);
  const historyVariant = variant === 'history';

  return (
    <Card
      accessibilityLabel={accessibilityLabel}
      accessibilityState={disabled ? {disabled: true} : undefined}
      onPress={disabled ? undefined : onPress}
      style={[
        styles.card,
        historyVariant && styles.historyCard,
        disabled && styles.disabledCard,
        style,
      ]}>
      <Text style={[styles.title, historyVariant && styles.historyTitle]}>
        {room.title}
      </Text>
      <Text style={[styles.meta, historyVariant && styles.historyMeta]}>
        {getEventRoomMetaLabel(room, intlLocale)}
      </Text>
      <View
        style={[styles.metaRow, historyVariant && styles.historyMetaRow]}>
        <Text style={styles.members}>
          {t('memberCount', {count: room.memberCount})}
        </Text>
        <RoomLanguageChips languageCodes={room.languageCodes} />
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  historyCard: {
    borderRadius: radii.card,
  },
  disabledCard: {
    opacity: 0.45,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  historyTitle: {
    fontSize: 17,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
  },
  historyMeta: {
    fontSize: 13,
    lineHeight: 19,
  },
  members: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  historyMetaRow: {
    gap: spacing.xs,
  },
});
