import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { colors, radii, spacing } from '../../theme/tokens';
import type { EventRoomLanguageFilter } from '../../types';

type RoomLanguageFilterBarProps = {
  selectedFilter: EventRoomLanguageFilter;
  onSelectFilter: (filter: EventRoomLanguageFilter) => void;
};

export function RoomLanguageFilterBar({
  selectedFilter,
  onSelectFilter,
}: RoomLanguageFilterBarProps) {
  const { t } = useTranslation('language');
  const filters: { code: EventRoomLanguageFilter; label: string }[] = [
    { code: 'all', label: t('allLanguages') },
    ...SUPPORTED_LANGUAGES.map(language => ({
      code: language.code,
      label: language.chipLabel,
    })),
  ];

  return (
    <View accessibilityRole="radiogroup" style={styles.container}>
      {filters.map(filter => {
        const selected = selectedFilter === filter.code;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={filter.code}
            onPress={() => onSelectFilter(filter.code)}
            style={[styles.chip, selected && styles.selectedChip]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.chip,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  selectedChip: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  label: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  selectedLabel: {
    color: colors.textInverse,
  },
});
