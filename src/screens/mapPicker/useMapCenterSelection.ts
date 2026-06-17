import {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import type {KakaoPlaceSearchResult} from '../../services/placeSearch';
import type {PlaceSelection} from '../../types';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type KakaoMapChangeEvent = {
  nativeEvent: {
    lat?: number;
    lng?: number;
    message?: string;
    reason?: string;
    status?: 'error';
    zoomLevel?: number;
  };
};

export const SEOUL_COORDINATE = {
  latitude: 37.5665,
  longitude: 126.978,
};

export function useMapCenterSelection() {
  const {t} = useTranslation('map');
  const currentCenterRef = useRef<Coordinate>(SEOUL_COORDINATE);
  const [nativeCenter, setNativeCenter] = useState(SEOUL_COORDINATE);
  const [searchCenter, setSearchCenter] = useState(SEOUL_COORDINATE);
  const [mapFocusVersion, setMapFocusVersion] = useState(0);
  const [place, setPlace] = useState<PlaceSelection | null>(null);

  const handleMapChange = ({nativeEvent}: KakaoMapChangeEvent) => {
    if (
      nativeEvent.status === 'error' ||
      nativeEvent.lat === undefined ||
      nativeEvent.lng === undefined
    ) {
      return;
    }

    const nextCenter = {
      latitude: nativeEvent.lat,
      longitude: nativeEvent.lng,
    };

    currentCenterRef.current = nextCenter;
    setSearchCenter(nextCenter);
  };

  const handleSelectCenter = () => {
    const selectedCenter = currentCenterRef.current;

    setNativeCenter(selectedCenter);
    setMapFocusVersion(version => version + 1);
    setPlace({
      provider: 'kakao',
      name: t('selectedPlaceName'),
      latitude: selectedCenter.latitude,
      longitude: selectedCenter.longitude,
      source: 'center',
    });
  };

  const handleSelectSearchPlace = (searchPlace: KakaoPlaceSearchResult) => {
    const selectedCenter = {
      latitude: searchPlace.latitude,
      longitude: searchPlace.longitude,
    };

    currentCenterRef.current = selectedCenter;
    setSearchCenter(selectedCenter);
    setNativeCenter(selectedCenter);
    setMapFocusVersion(version => version + 1);
    setPlace({
      provider: 'kakao',
      name: searchPlace.name,
      address: searchPlace.address,
      roadAddress: searchPlace.roadAddress,
      latitude: searchPlace.latitude,
      longitude: searchPlace.longitude,
      source: searchPlace.resultType === 'address' ? 'address' : 'search',
    });
  };

  return {
    nativeCenter,
    searchCenter,
    mapFocusVersion,
    place,
    handleMapChange,
    handleSelectCenter,
    handleSelectSearchPlace,
  };
}
