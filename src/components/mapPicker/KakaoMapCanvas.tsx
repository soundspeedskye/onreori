import React from 'react';
import {
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {KakaoMapView} from '@jiggag/react-native-kakao-maps';

import {colors} from '../../theme/tokens';
import type {PlaceSelection} from '../../types';
import type {
  Coordinate,
  KakaoMapChangeEvent,
} from '../../screens/mapPicker/useMapCenterSelection';

type KakaoMapViewWithStyleProps = React.ComponentProps<typeof KakaoMapView> & {
  style?: StyleProp<ViewStyle>;
};

type KakaoMapCanvasProps = {
  nativeCenter: Coordinate;
  place: PlaceSelection | null;
  onMapChange: (event: KakaoMapChangeEvent) => void;
};

const StyledKakaoMapView =
  KakaoMapView as React.ComponentType<KakaoMapViewWithStyleProps>;

export function KakaoMapCanvas({
  nativeCenter,
  place,
  onMapChange,
}: KakaoMapCanvasProps) {
  const {height, width} = useWindowDimensions();

  return (
    <View style={styles.mapContainer}>
      <StyledKakaoMapView
        centerPoint={{
          lat: nativeCenter.latitude,
          lng: nativeCenter.longitude,
        }}
        height={Math.max(1, height)}
        markerList={
          place
            ? [
                {
                  lat: place.latitude,
                  lng: place.longitude,
                  markerName: place.name,
                },
              ]
            : []
        }
        onChange={onMapChange}
        style={styles.map}
        width={Math.max(1, width)}
      />
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
