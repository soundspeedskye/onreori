import React, {useMemo} from 'react';
import {
  StyleProp,
  StyleSheet,
  Platform,
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

type KakaoMapViewWithStyleProps = {
  centerPoint: {
    lat: number;
    lng: number;
  };
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
  nativeCenter,
  place,
  onMapChange,
}: KakaoMapCanvasProps) {
  const {height, width} = useWindowDimensions();
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
  const mapProps = {
    centerPoint,
    height: Math.max(1, height),
    markerImageName: MAP_PIN_IMAGE_NAME,
    markerList,
    onChange: onMapChange,
    style: styles.map,
    width: Math.max(1, width),
  };

  return (
    <View style={styles.mapContainer}>
      {Platform.OS === 'android' ? (
        <AndroidKakaoMapView {...mapProps} />
      ) : (
        <LegacyKakaoMapView {...mapProps} />
      )}
      <View pointerEvents="none" style={styles.centerMarker}>
        <View style={styles.centerMarkerVertical} />
        <View style={styles.centerMarkerHorizontal} />
      </View>
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
