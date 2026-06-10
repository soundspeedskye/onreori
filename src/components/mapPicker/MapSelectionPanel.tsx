import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../../theme/tokens';
import type {PlaceSelection} from '../../types';
import {Button} from '../ui/Button';

type MapSelectionPanelProps = {
  place: PlaceSelection | null;
  onSelectCenter: () => void;
  onConfirm: () => void;
};

export function MapSelectionPanel({
  place,
  onSelectCenter,
  onConfirm,
}: MapSelectionPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{place?.name ?? '장소를 선택하세요'}</Text>
      <Text style={styles.meta}>
        {place
          ? `${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`
          : '지도 중심 위치를 등록하세요.'}
      </Text>
      <Button
        onPress={onSelectCenter}
        title="지도 중심 등록"
        variant="secondary"
      />
      <Button onPress={onConfirm} title="장소 등록" variant="dark" />
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
});
