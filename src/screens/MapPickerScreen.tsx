import React from 'react';
import {StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';

import {KakaoMapCanvas} from '../components/mapPicker/KakaoMapCanvas';
import {KakaoPlaceSearchPanel} from '../components/mapPicker/KakaoPlaceSearchPanel';
import {MapSelectionPanel} from '../components/mapPicker/MapSelectionPanel';
import {colors} from '../theme/tokens';
import type {RootStackParamList} from '../types';
import {ALERT_MESSAGES, showAlert} from '../utils/appAlert';
import {useMapCenterSelection} from './mapPicker/useMapCenterSelection';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPicker'>;

export function MapPickerScreen({navigation, route}: Props) {
  const {
    nativeCenter,
    searchCenter,
    place,
    handleMapChange,
    handleSelectCenter,
    handleSelectSearchPlace,
  } = useMapCenterSelection();

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
      <KakaoMapCanvas
        nativeCenter={nativeCenter}
        place={place}
        onMapChange={handleMapChange}
      />
      <KakaoPlaceSearchPanel
        center={searchCenter}
        onSelectPlace={handleSelectSearchPlace}
      />
      <MapSelectionPanel
        place={place}
        onSelectCenter={handleSelectCenter}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
