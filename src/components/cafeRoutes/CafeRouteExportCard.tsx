import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../theme/tokens';
import type { CafeRoute, CafeRouteStop } from '../../types';
import { getCafeRouteDisplayTitle } from '../../utils/cafeRoutes';
import { CafeRouteMapPreview } from './CafeRouteMapPreview';

const DEFAULT_MAP_HEIGHT = 190;

type CafeRouteExportCardProps = {
  mapHeight?: number;
  onMapRenderSettled?: () => void;
  route: CafeRoute;
};

function getStopAddress(stop: CafeRouteStop) {
  return (
    stop.roadAddress ??
    stop.address ??
    `${stop.latitude.toFixed(5)}, ${stop.longitude.toFixed(5)}`
  );
}

export function CafeRouteExportCard({
  mapHeight = DEFAULT_MAP_HEIGHT,
  onMapRenderSettled,
  route,
}: CafeRouteExportCardProps) {
  const sortedStops = [...route.stops].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text numberOfLines={2} style={styles.title}>
          {getCafeRouteDisplayTitle(route)}
        </Text>
      </View>

      <CafeRouteMapPreview
        height={mapHeight}
        onRenderSettled={onMapRenderSettled}
        stops={sortedStops}
      />

      <View style={styles.list}>
        {sortedStops.map((stop, index) => (
          <View key={stop.id} style={styles.stopBox}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopCopy}>
              <Text numberOfLines={2} style={styles.stopName}>
                {stop.name}
              </Text>
              <Text numberOfLines={2} style={styles.stopAddress}>
                {getStopAddress(stop)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.hero,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    width: '100%',
  },
  header: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  stopAddress: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  stopBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  stopCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  stopName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  stopNumber: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.chip,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  stopNumberText: {
    color: colors.brandMuted,
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
});
