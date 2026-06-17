import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {SUPPORTED_LANGUAGES} from '../../i18n/languages';
import {useAppLanguage} from '../../i18n/AppLanguageProvider';
import {colors, radii, spacing} from '../../theme/tokens';

export function AppLanguageSection() {
  const {t} = useTranslation('language');
  const {language, setLanguage} = useAppLanguage();

  return (
    <View
      accessibilityLabel={t('selectorLabel')}
      accessibilityRole="radiogroup"
      style={styles.container}>
      {SUPPORTED_LANGUAGES.map(supportedLanguage => {
        const selected = supportedLanguage.code === language;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{checked: selected}}
            hitSlop={6}
            key={supportedLanguage.code}
            onPress={() => {
              setLanguage(supportedLanguage.code).catch(() => undefined);
            }}
            style={[styles.chip, selected && styles.selectedChip]}>
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {supportedLanguage.chipLabel}
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.chip,
    borderWidth: 1,
    minHeight: 28,
    minWidth: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectedChip: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  label: {
    color: colors.brandMuted,
    fontSize: 11,
    fontWeight: '900',
  },
  selectedLabel: {
    color: colors.textInverse,
  },
});
