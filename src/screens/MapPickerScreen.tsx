import React, {useEffect, useState} from 'react';
import {StyleSheet} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
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

/**
 * Kakao 지도와 장소 검색으로 위치를 선택한 뒤 호출한 화면으로 선택 장소를 돌려준다.
 */
export function MapPickerScreen({navigation, route}: Props) {
  const isFocused = useIsFocused();
  const [confirming, setConfirming] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const {
    nativeCenter,
    searchCenter,
    mapFocusVersion,
    place,
    handleMapChange,
    handleSelectCenter,
    handleSelectSearchPlace,
  } = useMapCenterSelection();

  useEffect(() => {
    setDisplayName('');
  }, [place?.latitude, place?.longitude, place?.name, place?.source]);

  const handleConfirm = () => {
    if (confirming) {
      return;
    }

    if (!place) {
      showAlert({title: ALERT_MESSAGES.requiredSelection});
      return;
    }

    setConfirming(true);
    const confirmedPlace = {
      ...place,
      name: displayName.trim() || place.name,
    };

    if (route.params.returnTo === 'CafeRoutes') {
      navigation.popTo(
        'CafeRoutes',
        {
          categoryId: route.params.categoryId,
          routeId: route.params.routeId,
          selectedPlace: confirmedPlace,
        },
        {merge: true},
      );
      return;
    }

    navigation.popTo(
      'EventRooms',
      {
        categoryId: route.params.categoryId,
        selectedPlace: confirmedPlace,
      },
      {merge: true},
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      {isFocused ? (
        <KakaoMapCanvas
          focusVersion={mapFocusVersion}
          nativeCenter={nativeCenter}
          place={place}
          onMapChange={handleMapChange}
        />
      ) : null}
      <KakaoPlaceSearchPanel
        center={searchCenter}
        onSelectPlace={handleSelectSearchPlace}
      />
      <MapSelectionPanel
        confirming={confirming}
        displayName={displayName}
        place={place}
        onDisplayNameChange={setDisplayName}
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
