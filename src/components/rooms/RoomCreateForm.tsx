import React from 'react';
import {Platform, StyleSheet, Text} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTranslation} from 'react-i18next';

import type {SupportedLanguageCode} from '../../i18n/languages';
import {colors, radii, spacing} from '../../theme/tokens';
import {formatDateInput, parseDateInput} from '../../utils/date';
import type {RoomCreationConfig} from '../../utils/eventRoomForm';
import {LanguageChipSelector} from '../language/LanguageChipSelector';
import {Button} from '../ui/Button';
import {Card} from '../ui/Card';
import {TextField} from '../ui/TextField';

type RoomCreateFormProps = {
  creationConfig: RoomCreationConfig;
  title: string;
  eventDate: string;
  location: string;
  newRoomCode: string;
  languageCodes: SupportedLanguageCode[];
  showDatePicker: boolean;
  eventUrl: string;
  previewLoading: boolean;
  creating: boolean;
  onTitleChange: (title: string) => void;
  onEventDateChange: (eventDate: string) => void;
  onLocationChange: (location: string) => void;
  onNewRoomCodeChange: (entryCode: string) => void;
  onToggleLanguageCode: (languageCode: SupportedLanguageCode) => void;
  onShowDatePickerChange: (showDatePicker: boolean) => void;
  onEventUrlChange: (eventUrl: string) => void;
  onFetchEventUrlPreview: () => void;
  onOpenMapPicker: () => void;
  onCreateRoom: () => void;
};

export function RoomCreateForm({
  creationConfig,
  title,
  eventDate,
  location,
  newRoomCode,
  languageCodes,
  showDatePicker,
  eventUrl,
  previewLoading,
  creating,
  onTitleChange,
  onEventDateChange,
  onLocationChange,
  onNewRoomCodeChange,
  onToggleLanguageCode,
  onShowDatePickerChange,
  onEventUrlChange,
  onFetchEventUrlPreview,
  onOpenMapPicker,
  onCreateRoom,
}: RoomCreateFormProps) {
  const {t: tCommon} = useTranslation('common');
  const {t: tLanguage} = useTranslation('language');
  const {t: tRooms} = useTranslation('rooms');

  return (
    <Card style={styles.createBox}>
      <Text style={styles.sectionTitle}>{tRooms('createTitle')}</Text>
      <TextField
        accessibilityLabel={creationConfig.titleLabel}
        onChangeText={onTitleChange}
        placeholder={creationConfig.titlePlaceholder}
        value={title}
      />
      <Button
        onPress={() => onShowDatePickerChange(true)}
        title={eventDate || tRooms('datePlaceholder')}
        variant="secondary"
      />
      {showDatePicker ? (
        <DateTimePicker
          mode="date"
          value={parseDateInput(eventDate) ?? new Date()}
          onChange={(_event, date) => {
            if (Platform.OS !== 'ios') {
              onShowDatePickerChange(false);
            }

            if (date) {
              onEventDateChange(formatDateInput(date));
            }
          }}
        />
      ) : null}
      {showDatePicker && Platform.OS === 'ios' ? (
        <Button
          onPress={() => onShowDatePickerChange(false)}
          title={tCommon('actions.done')}
          variant="secondary"
        />
      ) : null}
      {creationConfig.requiresPlace ? (
        <>
          <TextField
            onChangeText={onLocationChange}
            placeholder={tRooms('placePlaceholder')}
            value={location}
          />
          <Button
            onPress={onOpenMapPicker}
            title={tRooms('choosePlaceOnMap')}
            variant="secondary"
          />
        </>
      ) : null}
      {creationConfig.allowsEventUrlPreview ? (
        <>
          <TextField
            onChangeText={onEventUrlChange}
            placeholder={tRooms('eventUrlPlaceholder')}
            value={eventUrl}
          />
          <Button
            disabled={previewLoading}
            onPress={onFetchEventUrlPreview}
            title={
              previewLoading
                ? tRooms('fetchingEventUrlPreview')
                : tRooms('fetchEventUrlPreview')
            }
            variant="secondary"
          />
        </>
      ) : null}
      <Text style={styles.fieldLabel}>{tLanguage('conversationLanguages')}</Text>
      <LanguageChipSelector
        accessibilityLabel={tLanguage('conversationLanguages')}
        multiSelect
        onToggleLanguage={onToggleLanguageCode}
        selectedLanguages={languageCodes}
      />
      <TextField
        onChangeText={onNewRoomCodeChange}
        placeholder={tRooms('entryCodePlaceholder')}
        secureTextEntry
        value={newRoomCode}
      />
      <Button
        disabled={creating}
        onPress={onCreateRoom}
        title={creating ? tRooms('creatingRoom') : tRooms('createRoom')}
        variant="dark"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  createBox: {
    borderRadius: radii.hero,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
