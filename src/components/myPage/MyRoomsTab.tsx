import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {RoomLanguageChips} from '../rooms/RoomLanguageChips';
import {useAppLanguage} from '../../i18n/AppLanguageProvider';
import {getIntlLocale} from '../../i18n/languages';
import {colors, radii, spacing} from '../../theme/tokens';
import type {EventRoom} from '../../types';
import type {MyRooms} from '../../services/rooms';
import {getEventRoomMetaLabel} from '../../utils/eventRoomPresentation';
import {Card} from '../ui/Card';
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
        {rooms.map(room => (
          <RoomHistoryCard key={room.id} room={room} onOpenRoom={onOpenRoom} />
        ))}
      </View>
    </View>
  );
}

function RoomHistoryCard({
  room,
  onOpenRoom,
}: {
  room: EventRoom;
  onOpenRoom: (room: EventRoom) => void;
}) {
  const {t} = useTranslation('rooms');
  const {t: tMyPage} = useTranslation('myPage');
  const {language} = useAppLanguage();
  const intlLocale = getIntlLocale(language);

  return (
    <Card
      accessibilityLabel={tMyPage('openRoomAccessibility', {
        title: room.title,
      })}
      onPress={() => onOpenRoom(room)}
      style={styles.roomCard}>
      <Text style={styles.roomTitle}>{room.title}</Text>
      <Text style={styles.roomMeta}>
        {getEventRoomMetaLabel(room, intlLocale)}
      </Text>
      <View style={styles.roomMetaRow}>
        <Text style={styles.roomMembers}>
          {t('memberCount', {count: room.memberCount})}
        </Text>
        <RoomLanguageChips languageCodes={room.languageCodes} />
      </View>
    </Card>
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
  roomCard: {
    borderRadius: radii.card,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  roomSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  roomTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  roomMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  roomMembers: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  roomMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
