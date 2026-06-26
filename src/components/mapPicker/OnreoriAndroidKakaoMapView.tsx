import {
  requireNativeComponent,
  type HostComponent,
  type ViewProps,
} from 'react-native';

import type {KakaoMapChangeEvent} from '../../screens/mapPicker/useMapCenterSelection';

type KakaoMapPoint = {
  lat: number;
  lng: number;
};

type KakaoMapMarker = KakaoMapPoint & {
  markerName: string;
  markerNumber?: number;
};

export type OnreoriAndroidKakaoMapViewProps = ViewProps & {
  centerPoint: KakaoMapPoint;
  fitToMarkers?: boolean;
  height: number;
  markerImageName?: string;
  markerImageUrl?: string;
  markerList: KakaoMapMarker[];
  onChange: (event: KakaoMapChangeEvent) => void;
  width: number;
};

export const OnreoriAndroidKakaoMapView =
  requireNativeComponent<OnreoriAndroidKakaoMapViewProps>(
    'OnreoriAndroidKakaoMapView',
  ) as HostComponent<OnreoriAndroidKakaoMapViewProps>;
