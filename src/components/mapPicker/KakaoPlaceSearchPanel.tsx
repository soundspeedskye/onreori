import React, {useEffect, useRef, useState} from 'react';
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

export function KakaoPlaceSearchPanel({
  center,
  onSelectPlace,
}: KakaoPlaceSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<KakaoPlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const shouldSearchRef = useRef(false);

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
      setIsLoading(true);
      setErrorMessage('');

      searchKakaoPlaces({query: trimmedQuery, center})
        .then(nextPlaces => {
          if (isActive) {
            setPlaces(nextPlaces);
          }
        })
        .catch(error => {
          if (isActive) {
            setPlaces([]);
            setErrorMessage(getPlaceSearchErrorMessage(error));
          }
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [center, query]);

  const handleChangeQuery = (nextQuery: string) => {
    shouldSearchRef.current = true;
    setQuery(nextQuery);
  };

  const handleSelectPlace = (place: KakaoPlaceSearchResult) => {
    shouldSearchRef.current = false;
    setQuery(place.name);
    setPlaces([]);
    setErrorMessage('');
    setIsLoading(false);
    onSelectPlace(place);
    Keyboard.dismiss();
  };

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.container}>
        <TextInput
          autoCorrect={false}
          placeholder="장소 검색"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.input}
          testID="place-search-input"
          value={query}
          onChangeText={handleChangeQuery}
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
                <Text numberOfLines={1} style={styles.resultTitle}>
                  {place.name}
                </Text>
                <Text numberOfLines={1} style={styles.resultAddress}>
                  {place.roadAddress ?? place.address ?? place.categoryName}
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
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  resultAddress: {
    color: colors.muted,
    fontSize: 12,
  },
});
