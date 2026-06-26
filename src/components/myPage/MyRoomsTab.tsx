import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, radii, spacing} from '../../theme/tokens';
import type {EventRoom} from '../../types';
import type {MyRooms} from '../../services/rooms';
import {isEventRoomActiveAt} from '../../utils/eventRoomVisibility';
import {RoomSummaryCard} from '../rooms/RoomSummaryCard';
import {EmptyState} from '../ui/EmptyState';

type MyRoomsTabProps = {
  myRooms: MyRooms;
  loadingMyRooms: boolean;
  onOpenRoom: (room: EventRoom) => void;
};

export function MyRoomsTab({
  myRooms,
  loadingMyRooms,
  onOpenRoom,
}: MyRoomsTabProps) {
  const {t} = useTranslation('myPage');
  const hasCreatedRooms = myRooms.createdRooms.length > 0;
  const hasJoinedRooms = myRooms.joinedRooms.length > 0;

  if (loadingMyRooms) {
    return (
      <EmptyState
        title={t('roomsLoading')}
        style={styles.emptyBox}
      />
    );
  }

  if (!hasCreatedRooms && !hasJoinedRooms) {
    return <EmptyState title={t('roomsEmpty')} style={styles.emptyBox} />;
  }

  return (
    <View style={styles.roomGroups}>
      {hasCreatedRooms ? (
        <RoomGroup
          title={t('createdRooms')}
          rooms={myRooms.createdRooms}
          onOpenRoom={onOpenRoom}
        />
      ) : null}

      {hasJoinedRooms ? (
        <RoomGroup
          title={t('joinedRooms')}
          rooms={myRooms.joinedRooms}
          onOpenRoom={onOpenRoom}
        />
      ) : null}
    </View>
  );
}

function RoomGroup({
  title,
  rooms,
  onOpenRoom,
}: {
  title: string;
  rooms: EventRoom[];
  onOpenRoom: (room: EventRoom) => void;
}) {
  return (
    <View style={styles.roomGroup}>
      <Text style={styles.roomSectionTitle}>{title}</Text>
      <View style={styles.roomList}>
        {rooms.map(room => {
          const disabled = !isEventRoomActiveAt(room);

          return (
            <RoomHistoryCard
              disabled={disabled}
              key={room.id}
              room={room}
              onOpenRoom={onOpenRoom}
            />
          );
        })}
      </View>
    </View>
  );
}

function RoomHistoryCard({
  disabled,
  room,
  onOpenRoom,
}: {
  disabled: boolean;
  room: EventRoom;
  onOpenRoom: (room: EventRoom) => void;
}) {
  const {t: tMyPage} = useTranslation('myPage');

  return (
    <RoomSummaryCard
      accessibilityLabel={tMyPage('openRoomAccessibility', {
        title: room.title,
      })}
      disabled={disabled}
      onPress={() => onOpenRoom(room)}
      room={room}
      variant="history"
    />
  );
}

const styles = StyleSheet.create({
  roomGroups: {
    gap: spacing.lg,
  },
  roomGroup: {
    gap: spacing.sm,
  },
  roomList: {
    gap: spacing.md,
  },
  roomSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
