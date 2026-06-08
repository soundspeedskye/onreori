import {useRef, useState} from 'react';

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

  return {
    nativeCenter,
    place,
    handleMapChange,
    handleSelectCenter,
  };
}
