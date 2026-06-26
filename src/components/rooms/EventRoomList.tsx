import React, {useCallback} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, layout, radii, spacing} from '../../theme/tokens';
import type {EventRoom} from '../../types';
import {isTutorialRoomId} from '../../services/rooms';
import {EmptyState} from '../ui/EmptyState';
import {RoomCard} from './RoomCard';

type EventRoomListProps = {
  rooms: EventRoom[];
  loading: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onJoinRoom: (room: EventRoom, entryCode: string) => void;
};

export function EventRoomList({
  rooms,
  loading,
  selectedRoomId,
  onSelectRoom,
  onJoinRoom,
}: EventRoomListProps) {
  const {t} = useTranslation('rooms');

  if (loading) {
    return <ActivityIndicator color={colors.brand} style={styles.loader} />;
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        style={styles.emptyBox}
      />
    );
  }

  return (
    <View style={styles.roomList}>
      {rooms.map(item => (
        <EventRoomListItem
          key={item.id}
          onJoinRoom={onJoinRoom}
          onSelectRoom={onSelectRoom}
          room={item}
          selected={selectedRoomId === item.id}
        />
      ))}
    </View>
  );
}

type EventRoomListItemProps = {
  room: EventRoom;
  selected: boolean;
  onSelectRoom: (roomId: string) => void;
  onJoinRoom: (room: EventRoom, entryCode: string) => void;
};

const EventRoomListItem = React.memo(function EventRoomListItem({
  room,
  selected,
  onSelectRoom,
  onJoinRoom,
}: EventRoomListItemProps) {
  const handleJoin = useCallback(
    (entryCode: string) => {
      onJoinRoom(room, entryCode);
    },
    [onJoinRoom, room],
  );
  const handleSelect = useCallback(() => {
    onSelectRoom(room.id);
  }, [onSelectRoom, room.id]);

  return (
    <RoomCard
      isTutorial={isTutorialRoomId(room.id)}
      onJoin={handleJoin}
      onSelect={handleSelect}
      room={room}
      selected={selected}
    />
  );
});

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
