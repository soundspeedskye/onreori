import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  StyleProp,
  StyleSheet,
  Platform,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import {colors} from '../../theme/tokens';
import type {PlaceSelection} from '../../types';
import type {
  Coordinate,
  KakaoMapChangeEvent,
} from '../../screens/mapPicker/useMapCenterSelection';

const MAP_PIN_IMAGE_NAME = 'onreori_map_pin';
const MAP_LOAD_TIMEOUT_MS = 9000;

type KakaoMapViewWithStyleProps = {
  centerPoint: {
    lat: number;
    lng: number;
  };
  fitToMarkers?: boolean;
  height: number;
  markerList: Array<{
    lat: number;
    lng: number;
    markerName: string;
  }>;
  markerImageName?: string;
  onChange: (event: KakaoMapChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
  width: number;
};

type LegacyKakaoMapViewModule = {
  KakaoMapView: React.ComponentType<KakaoMapViewWithStyleProps>;
};

type AndroidKakaoMapViewModule = {
  OnreoriAndroidKakaoMapView: React.ComponentType<KakaoMapViewWithStyleProps>;
};

type KakaoMapCanvasProps = {
  focusVersion: number;
  nativeCenter: Coordinate;
  place: PlaceSelection | null;
  onMapChange: (event: KakaoMapChangeEvent) => void;
};

function LegacyKakaoMapView(props: KakaoMapViewWithStyleProps) {
  const {KakaoMapView} = require('@jiggag/react-native-kakao-maps') as LegacyKakaoMapViewModule;

  return <KakaoMapView {...props} />;
}

function AndroidKakaoMapView(props: KakaoMapViewWithStyleProps) {
  const {OnreoriAndroidKakaoMapView} = require('./OnreoriAndroidKakaoMapView') as AndroidKakaoMapViewModule;

  return <OnreoriAndroidKakaoMapView {...props} />;
}

export function KakaoMapCanvas({
  focusVersion,
  nativeCenter,
  place,
  onMapChange,
}: KakaoMapCanvasProps) {
  const {height, width} = useWindowDimensions();
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const centerPoint = useMemo(
    () => ({
      lat: nativeCenter.latitude,
      lng: nativeCenter.longitude,
    }),
    [nativeCenter.latitude, nativeCenter.longitude],
  );
  const markerList = useMemo(
    () =>
      place
        ? [
            {
              lat: place.latitude,
              lng: place.longitude,
              markerName: place.source === 'center' ? '' : place.name,
            },
          ]
        : [],
    [place],
  );
  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);
  const handleNativeMapChange = useCallback(
    (event: KakaoMapChangeEvent) => {
      const {nativeEvent} = event;

      if (nativeEvent.status === 'error') {
        clearLoadTimeout();
        setMapError(nativeEvent.reason ?? nativeEvent.message ?? 'unknown');
        return;
      }

      if (nativeEvent.lat === undefined || nativeEvent.lng === undefined) {
        return;
      }

      clearLoadTimeout();
      setMapReady(true);
      setMapError(null);
      onMapChange(event);
    },
    [clearLoadTimeout, onMapChange],
  );

  useEffect(() => {
    clearLoadTimeout();
    setMapError(null);
    setMapReady(false);

    loadTimeoutRef.current = setTimeout(() => {
      setMapError('Kakao map ready event timed out.');
    }, MAP_LOAD_TIMEOUT_MS);

    return clearLoadTimeout;
  }, [
    clearLoadTimeout,
    focusVersion,
    nativeCenter.latitude,
    nativeCenter.longitude,
  ]);

  useEffect(() => {
    if (mapReady) {
      clearLoadTimeout();
    }
  }, [clearLoadTimeout, mapReady]);

  const mapProps = {
    centerPoint,
    height: Math.max(1, height),
    markerImageName: MAP_PIN_IMAGE_NAME,
    markerList,
    onChange: handleNativeMapChange,
    style: styles.map,
    width: Math.max(1, width),
  };

  return (
    <View style={styles.mapContainer}>
      {Platform.OS === 'android' ? (
        <AndroidKakaoMapView key={focusVersion} {...mapProps} />
      ) : (
        <LegacyKakaoMapView key={focusVersion} {...mapProps} />
      )}
      <View pointerEvents="none" style={styles.centerMarker}>
        <View style={styles.centerMarkerVertical} />
        <View style={styles.centerMarkerHorizontal} />
      </View>
      {mapError ? (
        <View pointerEvents="none" style={styles.mapUnavailable}>
          <Text style={styles.mapUnavailableTitle}>
            Kakao 지도를 불러오지 못했습니다
          </Text>
          <Text style={styles.mapUnavailableText}>{mapError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapUnavailable: {
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 8,
    inset: 0,
    justifyContent: 'center',
    padding: 24,
    position: 'absolute',
  },
  mapUnavailableText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  mapUnavailableTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  centerMarker: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -14,
    marginTop: -14,
    position: 'absolute',
    top: '50%',
    width: 28,
  },
  centerMarkerHorizontal: {
    backgroundColor: colors.dark,
    height: 2,
    position: 'absolute',
    width: 28,
  },
  centerMarkerVertical: {
    backgroundColor: colors.dark,
    height: 28,
    position: 'absolute',
    width: 2,
  },
});
