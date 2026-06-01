import React, {useRef, useState} from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {KakaoMapView} from '@jiggag/react-native-kakao-maps';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Button} from '../components/ui/Button';
import {colors, spacing} from '../theme/tokens';
import type {PlaceSelection, RootStackParamList} from '../types';
import {ALERT_MESSAGES, showAlert} from '../utils/appAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPicker'>;

type Coordinate = {
  latitude: number;
  longitude: number;
};

type KakaoMapChangeEvent = {
  nativeEvent: {
    lat: number;
    lng: number;
    zoomLevel: number;
  };
};

type KakaoMapViewWithStyleProps = React.ComponentProps<typeof KakaoMapView> & {
  style?: StyleProp<ViewStyle>;
};

const SEOUL_COORDINATE = {
  latitude: 37.5665,
  longitude: 126.978,
};

const StyledKakaoMapView =
  KakaoMapView as React.ComponentType<KakaoMapViewWithStyleProps>;

export function MapPickerScreen({navigation, route}: Props) {
  const {height, width} = useWindowDimensions();
  const currentCenterRef = useRef<Coordinate>(SEOUL_COORDINATE);
  const [nativeCenter, setNativeCenter] = useState(SEOUL_COORDINATE);
  const [place, setPlace] = useState<PlaceSelection | null>(null);

  const handleMapChange = ({nativeEvent}: KakaoMapChangeEvent) => {
    currentCenterRef.current = {
      latitude: nativeEvent.lat,
      longitude: nativeEvent.lng,
    };
  };

  const handleSelectCenter = () => {
    const selectedCenter = currentCenterRef.current;

    setNativeCenter(selectedCenter);
    setPlace({
      provider: 'kakao',
      name: '선택한 장소',
      latitude: selectedCenter.latitude,
      longitude: selectedCenter.longitude,
      source: 'center',
    });
  };

  const handleConfirm = () => {
    if (!place) {
      showAlert({title: ALERT_MESSAGES.requiredSelection});
      return;
    }

    navigation.navigate(route.params.returnTo, {
      categoryId: route.params.categoryId,
      selectedPlace: place,
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
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
          onChange={handleMapChange}
          style={styles.map}
          width={Math.max(1, width)}
        />
        <View pointerEvents="none" style={styles.centerMarker}>
          <View style={styles.centerMarkerVertical} />
          <View style={styles.centerMarkerHorizontal} />
        </View>
      </View>
      <View style={styles.panel}>
        <Text style={styles.title}>{place?.name ?? '장소를 선택하세요'}</Text>
        <Text style={styles.meta}>
          {place
            ? `${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`
            : '지도 중심 위치를 등록하세요.'}
        </Text>
        <Button
          onPress={handleSelectCenter}
          title="지도 중심 등록"
          variant="secondary"
        />
        <Button onPress={handleConfirm} title="장소 등록" variant="dark" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
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
