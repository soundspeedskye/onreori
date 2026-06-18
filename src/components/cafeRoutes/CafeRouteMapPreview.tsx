import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  InteractionManager,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
  View,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { KakaoMapChangeEvent } from '../../screens/mapPicker/useMapCenterSelection';
import { colors, radii } from '../../theme/tokens';
import type { CafeRouteStop } from '../../types';

const MAP_PIN_IMAGE_NAME = 'onreori_map_pin';
const MAP_LOAD_TIMEOUT_MS = 9000;

type KakaoMapMarker = {
  lat: number;
  lng: number;
  markerName: string;
};

type KakaoMapViewWithStyleProps = {
  centerPoint: {
    lat: number;
    lng: number;
  };
  fitToMarkers?: boolean;
  height: number;
  markerImageName?: string;
  markerList: KakaoMapMarker[];
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

type CafeRouteMapPreviewProps = {
  height: number;
  onRenderSettled?: () => void;
  stops: CafeRouteStop[];
};

function LegacyKakaoMapView(props: KakaoMapViewWithStyleProps) {
  const { KakaoMapView } =
    require('@jiggag/react-native-kakao-maps') as LegacyKakaoMapViewModule;

  return <KakaoMapView {...props} />;
}

function AndroidKakaoMapView(props: KakaoMapViewWithStyleProps) {
  const { OnreoriAndroidKakaoMapView } =
    require('../mapPicker/OnreoriAndroidKakaoMapView') as AndroidKakaoMapViewModule;

  return <OnreoriAndroidKakaoMapView {...props} />;
}

function getRouteMapCenter(stops: CafeRouteStop[]) {
  if (stops.length === 1) {
    return {
      lat: stops[0].latitude,
      lng: stops[0].longitude,
    };
  }

  const latitudes = stops.map(stop => stop.latitude);
  const longitudes = stops.map(stop => stop.longitude);

  return {
    lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
}

function getRouteMapSignature(stops: CafeRouteStop[]) {
  return stops
    .map(
      stop =>
        `${stop.id}:${stop.order}:${stop.latitude.toFixed(
          6,
        )}:${stop.longitude.toFixed(6)}`,
    )
    .join('|');
}

export function CafeRouteMapPreview({
  height,
  onRenderSettled,
  stops,
}: CafeRouteMapPreviewProps) {
  const { t } = useTranslation('map');
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mountNativeMap, setMountNativeMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const previewHeight = Math.max(1, Math.round(height));
  const previewWidth =
    layoutWidth === null ? null : Math.max(1, Math.round(layoutWidth));
  const centerPoint = useMemo(() => getRouteMapCenter(stops), [stops]);
  const markerList = useMemo(
    () =>
      [...stops]
        .sort((a, b) => a.order - b.order)
        .map(stop => ({
          lat: stop.latitude,
          lng: stop.longitude,
          markerName: `${stop.order}. ${stop.name}`,
        })),
    [stops],
  );
  const mapKey = useMemo(() => getRouteMapSignature(stops), [stops]);
  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);
  const handleNativeMapChange = useCallback(
    ({ nativeEvent }: KakaoMapChangeEvent) => {
      if (nativeEvent.status === 'error') {
        clearLoadTimeout();
        setMapError(nativeEvent.reason ?? nativeEvent.message ?? 'unknown');
        return;
      }

      if (nativeEvent.lat === undefined || nativeEvent.lng === undefined) {
        return;
      }

      clearLoadTimeout();
      setMapReady(true);
      setMapError(null);
    },
    [clearLoadTimeout],
  );

  useEffect(() => {
    clearLoadTimeout();
    setMapError(null);
    setMountNativeMap(false);
    setMapReady(false);

    if (previewWidth === null) {
      return clearLoadTimeout;
    }

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      setMountNativeMap(true);
      loadTimeoutRef.current = setTimeout(() => {
        setMapError('Kakao map ready event timed out.');
      }, MAP_LOAD_TIMEOUT_MS);
    });

    return () => {
      interactionHandle.cancel();
      clearLoadTimeout();
    };
  }, [clearLoadTimeout, mapKey, previewHeight, previewWidth]);

  useEffect(() => {
    if (mapReady) {
      clearLoadTimeout();
    }
  }, [clearLoadTimeout, mapReady]);

  useEffect(() => {
    if (mapReady || mapError) {
      onRenderSettled?.();
    }
  }, [mapError, mapReady, onRenderSettled]);

  const mapProps =
    previewWidth === null
      ? null
      : {
          centerPoint,
          fitToMarkers: markerList.length > 1,
          height: previewHeight,
          markerImageName: MAP_PIN_IMAGE_NAME,
          markerList,
          onChange: handleNativeMapChange,
          style: [
            styles.map,
            {
              height: previewHeight,
              width: previewWidth,
            },
          ],
          width: previewWidth,
        };

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    if (!Number.isFinite(nextWidth) || nextWidth <= 0) {
      return;
    }

    setLayoutWidth(currentWidth =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  };

  const nativeMapKey =
    previewWidth === null
      ? mapKey
      : `${mapKey}:${previewWidth}x${previewHeight}`;

  return (
    <View
      style={[styles.container, { height: previewHeight }]}
      onLayout={handleLayout}
    >
      <View style={[styles.mapSurface, { height: previewHeight }]}>
        {mountNativeMap && mapProps ? (
          Platform.OS === 'android' ? (
            <AndroidKakaoMapView key={nativeMapKey} {...mapProps} />
          ) : (
            <LegacyKakaoMapView key={nativeMapKey} {...mapProps} />
          )
        ) : null}
      </View>
      <View pointerEvents="none" style={styles.borderOverlay} />
      {mapError ? (
        <View pointerEvents="none" style={styles.mapUnavailable}>
          <Text style={styles.mapUnavailableTitle}>{t('mapLoadFailed')}</Text>
          <Text style={styles.mapUnavailableText}>{mapError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
  },
  borderOverlay: {
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    inset: 0,
    position: 'absolute',
  },
  map: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  mapSurface: {
    backgroundColor: colors.surfaceMuted,
  },
  mapUnavailable: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    gap: 8,
    inset: 0,
    justifyContent: 'center',
    padding: 20,
    position: 'absolute',
  },
  mapUnavailableText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  mapUnavailableTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
});
