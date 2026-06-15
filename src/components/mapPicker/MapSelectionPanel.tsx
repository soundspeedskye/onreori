import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../../theme/tokens';
import type {PlaceSelection} from '../../types';
import {Button} from '../ui/Button';
import {TextField} from '../ui/TextField';

type MapSelectionPanelProps = {
  place: PlaceSelection | null;
  confirming?: boolean;
  displayName: string;
  onSelectCenter: () => void;
  onDisplayNameChange: (name: string) => void;
  onConfirm: () => void;
};

export function MapSelectionPanel({
  place,
  confirming = false,
  displayName,
  onSelectCenter,
  onDisplayNameChange,
  onConfirm,
}: MapSelectionPanelProps) {
  const canEditDisplayName =
    place?.source === 'address' || place?.source === 'center';
  const placeMeta = place
    ? place.roadAddress ??
      place.address ??
      `${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`
    : '지도 중심 위치를 등록하세요.';

  return (
    <View style={styles.panel}>
      <Text numberOfLines={2} style={styles.title}>
        {displayName.trim() || place?.name || '장소를 선택하세요'}
      </Text>
      <Text numberOfLines={1} style={styles.meta}>
        {placeMeta}
      </Text>
      {canEditDisplayName ? (
        <TextField
          autoCorrect={false}
          maxLength={40}
          placeholder={
            place.source === 'address'
              ? '카페명을 직접 입력하세요'
              : '장소명을 직접 입력하세요'
          }
          style={styles.nameInput}
          value={displayName}
          onChangeText={onDisplayNameChange}
        />
      ) : null}
      <Button
        onPress={onSelectCenter}
        title="지도 중심 등록"
        variant="secondary"
      />
      <Button
        disabled={!place || confirming}
        loading={confirming}
        onPress={onConfirm}
        title="장소 등록"
        variant="dark"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
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
    fontSize: 13,
  },
  nameInput: {
    fontSize: 15,
  },
});
