import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

import {colors, layout, radii, spacing} from '../../theme/tokens';
import type {EventRoom} from '../../types';
import {isTutorialRoomId} from '../../services/rooms';
import {EmptyState} from '../ui/EmptyState';
import {RoomCard} from './RoomCard';

type EventRoomListProps = {
  rooms: EventRoom[];
  loading: boolean;
  selectedRoomId: string | null;
  entryCode: string;
  onEntryCodeChange: (entryCode: string) => void;
  onSelectRoom: (roomId: string) => void;
  onJoinRoom: (room: EventRoom) => void;
};

export function EventRoomList({
  rooms,
  loading,
  selectedRoomId,
  entryCode,
  onEntryCodeChange,
  onSelectRoom,
  onJoinRoom,
}: EventRoomListProps) {
  if (loading) {
    return <ActivityIndicator color={colors.brand} style={styles.loader} />;
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="아직 만들어진 방이 없습니다."
        description="첫 방을 만들어 현장 정보를 모아보세요."
        style={styles.emptyBox}
      />
    );
  }

  return (
    <View style={styles.roomList}>
      {rooms.map(item => (
        <RoomCard
          key={item.id}
          entryCode={entryCode}
          isTutorial={isTutorialRoomId(item.id)}
          onEntryCodeChange={onEntryCodeChange}
          onJoin={() => {
            onJoinRoom(item);
          }}
          onSelect={() => onSelectRoom(item.id)}
          room={item}
          selected={selectedRoomId === item.id}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.lg,
  },
  roomList: {
    gap: spacing.md,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: layout.screenPadding,
  },
});
