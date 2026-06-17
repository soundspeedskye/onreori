import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
} from '../../i18n/languages';
import {colors, radii, spacing} from '../../theme/tokens';

type LanguageChipSelectorProps = {
  value?: SupportedLanguageCode;
  selectedLanguages?: SupportedLanguageCode[];
  onChange?: (languageCode: SupportedLanguageCode) => void;
  onToggleLanguage?: (languageCode: SupportedLanguageCode) => void;
  multiSelect?: boolean;
  accessibilityLabel?: string;
};

export function LanguageChipSelector({
  value,
  selectedLanguages,
  onChange,
  onToggleLanguage,
  multiSelect = false,
  accessibilityLabel,
}: LanguageChipSelectorProps) {
  const {t} = useTranslation('language');
  const selectedLanguageSet = useMemo(
    () => new Set(selectedLanguages ?? (value ? [value] : [])),
    [selectedLanguages, value],
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? t('selectorLabel')}
      accessibilityRole={multiSelect ? undefined : 'radiogroup'}
      style={styles.container}>
      {SUPPORTED_LANGUAGES.map(language => {
        const selected = multiSelect
          ? selectedLanguageSet.has(language.code)
          : language.code === value;

        return (
          <Pressable
            accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
            accessibilityState={{checked: selected}}
            key={language.code}
            onPress={() => {
              if (multiSelect) {
                (onToggleLanguage ?? onChange)?.(language.code);
                return;
              }

              (onChange ?? onToggleLanguage)?.(language.code);
            }}
            style={[styles.chip, selected && styles.selectedChip]}>
            <Text style={[styles.chipLabel, selected && styles.selectedLabel]}>
              {language.chipLabel}
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
    gap: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.chip,
    borderWidth: 1,
    minHeight: 38,
    minWidth: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedChip: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  chipLabel: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  selectedLabel: {
    color: colors.textInverse,
  },
});
