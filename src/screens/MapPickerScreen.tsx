import React, {useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  NaverMapMarkerOverlay,
  NaverMapView,
} from '@mj-studio/react-native-naver-map';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Button} from '../components/ui/Button';
import {colors} from '../theme/tokens';
import type {PlaceSelection, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPicker'>;

const SEOUL_COORDINATE = {
  latitude: 37.5665,
  longitude: 126.978,
};

export function MapPickerScreen({navigation, route}: Props) {
  const [place, setPlace] = useState<PlaceSelection | null>(null);

  const handleConfirm = () => {
    if (!place) {
      Alert.alert('지도에서 장소를 선택하세요.');
      return;
    }

    navigation.navigate(route.params.returnTo, {
      categoryId: route.params.categoryId,
      selectedPlace: place,
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <NaverMapView
        initialCamera={{
          latitude: SEOUL_COORDINATE.latitude,
          longitude: SEOUL_COORDINATE.longitude,
          zoom: 13,
        }}
        onTapMap={({latitude, longitude}) => {
          setPlace({
            provider: 'naver',
            name: '선택한 장소',
            latitude,
            longitude,
            source: 'pin',
          });
        }}
        style={styles.map}>
        {place ? (
          <NaverMapMarkerOverlay
            latitude={place.latitude}
            longitude={place.longitude}
          />
        ) : null}
      </NaverMapView>
      <View style={styles.panel}>
        <Text style={styles.title}>{place?.name ?? '장소를 선택하세요'}</Text>
        <Text style={styles.meta}>
          {place
            ? `${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`
            : '지도에서 위치를 누르세요.'}
        </Text>
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
  map: {
    flex: 1,
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    padding: 16,
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
