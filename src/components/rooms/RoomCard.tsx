import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';
import type {EventRoom} from '../../types';
import {getEventRoomMetaLabel} from '../../utils/eventRoomPresentation';
import {Button} from '../ui/Button';
import {Card} from '../ui/Card';
import {TextField} from '../ui/TextField';

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
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{room.title}</Text>
      <Text style={styles.meta}>{getEventRoomMetaLabel(room)}</Text>
      <Text style={styles.members}>참여 {room.memberCount}명</Text>
      {isTutorial ? (
        <Button
          onPress={onJoin}
          style={styles.joinButton}
          title="튜토리얼 시작"
        />
      ) : selected ? (
        <View style={styles.joinBox}>
          <TextField
            onChangeText={onEntryCodeChange}
            placeholder="입장코드"
            secureTextEntry
            value={entryCode}
          />
          <Button onPress={onJoin} title="입장하기" />
        </View>
      ) : (
        <Button
          onPress={onSelect}
          style={styles.joinButton}
          title="입장코드 입력"
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
  joinBox: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  joinButton: {
    marginTop: spacing.xs,
  },
});
