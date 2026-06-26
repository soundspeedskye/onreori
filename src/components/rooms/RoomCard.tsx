import React, {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {spacing} from '../../theme/tokens';
import type {EventRoom} from '../../types';
import {Button} from '../ui/Button';
import {TextField} from '../ui/TextField';
import {RoomSummaryCard} from './RoomSummaryCard';

type RoomCardProps = {
  room: EventRoom;
  selected: boolean;
  isTutorial?: boolean;
  onSelect: () => void;
  onJoin: (entryCode: string) => void;
};

export function RoomCard({
  room,
  selected,
  isTutorial = false,
  onSelect,
  onJoin,
}: RoomCardProps) {
  const {t} = useTranslation('rooms');
  const entryCodeRef = useRef('');

  useEffect(() => {
    if (!selected) {
      entryCodeRef.current = '';
    }
  }, [selected]);

  function handleJoin() {
    onJoin(isTutorial ? '' : entryCodeRef.current);
  }

  return (
    <RoomSummaryCard room={room}>
      {isTutorial ? (
        <Button
          onPress={handleJoin}
          style={styles.joinButton}
          title={t('startTutorial')}
        />
      ) : selected ? (
        <View style={styles.joinBox}>
          <TextField
            onChangeText={value => {
              entryCodeRef.current = value;
            }}
            placeholder={t('entryCodePlaceholder')}
            secureTextEntry
          />
          <Button onPress={handleJoin} title={t('join')} />
        </View>
      ) : (
        <Button
          onPress={onSelect}
          style={styles.joinButton}
          title={t('enterEntryCode')}
        />
      )}
    </RoomSummaryCard>
  );
}

const styles = StyleSheet.create({
  joinBox: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  joinButton: {
    marginTop: spacing.xs,
  },
});
