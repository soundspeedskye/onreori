import React from 'react';
import {Platform, Pressable, StyleSheet, Text} from 'react-native';
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
  titleLabel: string;
  titlePlaceholder: string;
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
  titleLabel,
  titlePlaceholder,
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
  const { t: tCommon } = useTranslation('common');
  const { t: tLanguage } = useTranslation('language');
  const { t: tRooms } = useTranslation('rooms');

  return (
    <Card style={styles.createBox}>
      <Text style={styles.sectionTitle}>{tRooms('createTitle')}</Text>
      <TextField
        accessibilityLabel={titleLabel}
        onChangeText={onTitleChange}
        placeholder={titlePlaceholder}
        value={title}
      />
      <Pressable
        accessibilityLabel={eventDate || tRooms('datePlaceholder')}
        accessibilityRole="button"
        onPress={() => onShowDatePickerChange(true)}
        style={styles.dateField}>
        <Text
          style={[
            styles.dateText,
            eventDate ? styles.dateTextSelected : styles.dateTextPlaceholder,
          ]}>
          {eventDate || tRooms('datePlaceholder')}
        </Text>
      </Pressable>
      {showDatePicker ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
      <Text style={styles.fieldLabel}>
        {tLanguage('conversationLanguages')}
      </Text>
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
        variant="brand"
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
  dateField: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 15,
  },
  dateTextPlaceholder: {
    color: colors.text,
    fontWeight: '800',
  },
  dateTextSelected: {
    color: colors.text,
    fontWeight: '900',
  },
  createBox: {
    borderRadius: radii.hero,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
