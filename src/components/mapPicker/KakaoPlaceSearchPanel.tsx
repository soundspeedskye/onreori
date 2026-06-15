import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getPlaceSearchErrorMessage,
  searchKakaoPlaces,
  type KakaoPlaceSearchResult,
} from '../../services/placeSearch';
import {colors, radii, spacing} from '../../theme/tokens';
import type {Coordinate} from '../../screens/mapPicker/useMapCenterSelection';

type KakaoPlaceSearchPanelProps = {
  center: Coordinate;
  onSelectPlace: (place: KakaoPlaceSearchResult) => void;
};

const SEARCH_DEBOUNCE_MS = 350;

function getResultDetail(place: KakaoPlaceSearchResult) {
  if (place.resultType === 'address') {
    const detail = place.roadAddress ?? place.address;

    return detail && detail !== place.name ? detail : '주소 위치';
  }

  return place.roadAddress ?? place.address ?? place.categoryName;
}

export function KakaoPlaceSearchPanel({
  center,
  onSelectPlace,
}: KakaoPlaceSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<KakaoPlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const shouldSearchRef = useRef(false);
  const searchRequestIdRef = useRef(0);

  const handleSelectPlace = useCallback(
    (place: KakaoPlaceSearchResult) => {
      shouldSearchRef.current = false;
      setQuery(place.name);
      setPlaces([]);
      setErrorMessage('');
      setIsLoading(false);
      onSelectPlace(place);
      Keyboard.dismiss();
    },
    [onSelectPlace],
  );

  const executeSearch = useCallback(
    async (
      trimmedQuery: string,
      options: {selectAddressResult?: boolean} = {},
    ) => {
      if (trimmedQuery.length < 2) {
        return;
      }

      const requestId = searchRequestIdRef.current + 1;
      searchRequestIdRef.current = requestId;
      setIsLoading(true);
      setErrorMessage('');

      try {
        const nextPlaces = await searchKakaoPlaces({
          query: trimmedQuery,
          center,
          preferAddress: options.selectAddressResult === true,
        });

        if (searchRequestIdRef.current !== requestId) {
          return;
        }

        if (options.selectAddressResult) {
          const addressResult = nextPlaces.find(
            place => place.resultType === 'address',
          );

          if (addressResult) {
            handleSelectPlace(addressResult);
            return;
          }
        }

        setPlaces(nextPlaces);
      } catch (error) {
        if (searchRequestIdRef.current === requestId) {
          setPlaces([]);
          setErrorMessage(getPlaceSearchErrorMessage(error));
        }
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [center, handleSelectPlace],
  );

  useEffect(() => {
    const trimmedQuery = query.trim();

    setPlaces(currentPlaces =>
      currentPlaces.length > 0 ? [] : currentPlaces,
    );
    setErrorMessage(currentError => (currentError ? '' : currentError));
    setIsLoading(false);

    if (trimmedQuery.length < 2 || !shouldSearchRef.current) {
      return;
    }

    let isActive = true;
    const timeoutId = setTimeout(() => {
      if (!isActive || !shouldSearchRef.current) {
        return;
      }

      executeSearch(trimmedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      isActive = false;
      searchRequestIdRef.current += 1;
      clearTimeout(timeoutId);
    };
  }, [executeSearch, query]);

  const handleChangeQuery = (nextQuery: string) => {
    shouldSearchRef.current = true;
    setQuery(nextQuery);
  };

  const handleSubmitQuery = () => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    shouldSearchRef.current = false;
    executeSearch(trimmedQuery, {selectAddressResult: true});
  };

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.container}>
        <TextInput
          autoCorrect={false}
          placeholder="장소 또는 주소 검색"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.input}
          testID="place-search-input"
          value={query}
          onChangeText={handleChangeQuery}
          onSubmitEditing={handleSubmitQuery}
        />
        {isLoading ? <Text style={styles.status}>검색 중</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {places.length > 0 ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.results}>
            {places.map(place => (
              <Pressable
                key={place.id}
                style={styles.resultRow}
                testID={`place-search-result-${place.id}`}
                onPress={() => handleSelectPlace(place)}>
                <View style={styles.resultTitleRow}>
                  <Text numberOfLines={1} style={styles.resultTitle}>
                    {place.name}
                  </Text>
                  {place.resultType === 'address' ? (
                    <Text style={styles.resultBadge}>주소</Text>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={styles.resultAddress}>
                  {getResultDetail(place)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 10,
  },
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  input: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  status: {
    color: colors.muted,
    fontSize: 13,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  error: {
    color: '#b42318',
    fontSize: 13,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  results: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    maxHeight: 280,
  },
  resultRow: {
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  resultBadge: {
    backgroundColor: colors.actionSoft,
    borderRadius: radii.chip,
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resultAddress: {
    color: colors.muted,
    fontSize: 12,
  },
});
