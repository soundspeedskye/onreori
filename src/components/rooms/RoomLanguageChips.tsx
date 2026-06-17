import React from 'react';
import {StyleSheet, View} from 'react-native';

import {SUPPORTED_LANGUAGES} from '../../i18n/languages';
import {spacing} from '../../theme/tokens';
import {normalizeRoomLanguageCodes} from '../../utils/eventRoomLanguages';
import {Chip} from '../ui/Chip';

type RoomLanguageChipsProps = {
  languageCodes: unknown;
};

export function RoomLanguageChips({languageCodes}: RoomLanguageChipsProps) {
  const normalizedLanguageCodes = normalizeRoomLanguageCodes(languageCodes);

  return (
    <View style={styles.container}>
      {normalizedLanguageCodes.map(languageCode => {
        const language = SUPPORTED_LANGUAGES.find(
          supportedLanguage => supportedLanguage.code === languageCode,
        );

        return (
          <Chip key={languageCode} label={language?.chipLabel ?? languageCode} />
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
});
