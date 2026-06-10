import {useRef, useState} from 'react';

import type {KakaoPlaceSearchResult} from '../../services/placeSearch';
import type {PlaceSelection} from '../../types';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type KakaoMapChangeEvent = {
  nativeEvent: {
    lat: number;
    lng: number;
    zoomLevel: number;
  };
};

export const SEOUL_COORDINATE = {
  latitude: 37.5665,
  longitude: 126.978,
};

export function useMapCenterSelection() {
  const currentCenterRef = useRef<Coordinate>(SEOUL_COORDINATE);
  const [nativeCenter, setNativeCenter] = useState(SEOUL_COORDINATE);
  const [searchCenter, setSearchCenter] = useState(SEOUL_COORDINATE);
  const [place, setPlace] = useState<PlaceSelection | null>(null);

  const handleMapChange = ({nativeEvent}: KakaoMapChangeEvent) => {
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
    setPlace({
      provider: 'kakao',
      name: '선택한 장소',
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
    setPlace({
      provider: 'kakao',
      name: searchPlace.name,
      address: searchPlace.address,
      roadAddress: searchPlace.roadAddress,
      latitude: searchPlace.latitude,
      longitude: searchPlace.longitude,
      source: 'search',
    });
  };

  return {
    nativeCenter,
    searchCenter,
    place,
    handleMapChange,
    handleSelectCenter,
    handleSelectSearchPlace,
  };
}
