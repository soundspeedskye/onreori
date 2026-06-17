import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {useAppLanguage} from '../../i18n/AppLanguageProvider';
import {getIntlLocale} from '../../i18n/languages';
import { colors, radii, spacing } from '../../theme/tokens';
import type { EventRoom } from '../../types';
import { getEventRoomMetaLabel } from '../../utils/eventRoomPresentation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextField } from '../ui/TextField';
import { RoomLanguageChips } from './RoomLanguageChips';

type RoomCardProps = {
  room: EventRoom;
  selected: boolean;
  entryCode: string;
  isTutorial?: boolean;
  onEntryCodeChange: (entryCode: string) => void;
  onSelect: () => void;
  onJoin: () => void;
};

export function RoomCard({
  room,
  selected,
  entryCode,
  isTutorial = false,
  onEntryCodeChange,
  onSelect,
  onJoin,
}: RoomCardProps) {
  const { t } = useTranslation('rooms');
  const {language} = useAppLanguage();
  const intlLocale = getIntlLocale(language);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{room.title}</Text>
      <Text style={styles.meta}>{getEventRoomMetaLabel(room, intlLocale)}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.members}>
          {t('memberCount', { count: room.memberCount })}
        </Text>
        <RoomLanguageChips languageCodes={room.languageCodes} />
      </View>
      {isTutorial ? (
        <Button
          onPress={onJoin}
          style={styles.joinButton}
          title={t('startTutorial')}
        />
      ) : selected ? (
        <View style={styles.joinBox}>
          <TextField
            onChangeText={onEntryCodeChange}
            placeholder={t('entryCodePlaceholder')}
            secureTextEntry
            value={entryCode}
          />
          <Button onPress={onJoin} title={t('join')} />
        </View>
      ) : (
        <Button
          onPress={onSelect}
          style={styles.joinButton}
          title={t('enterEntryCode')}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
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
  joinBox: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  joinButton: {
    marginTop: spacing.xs,
  },
});
