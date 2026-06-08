import React from 'react';
import {Platform, StyleSheet, Text} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import {colors, radii, spacing} from '../../theme/tokens';
import {formatDateInput, parseDateInput} from '../../utils/date';
import type {RoomCreationConfig} from '../../utils/eventRoomForm';
import {Button} from '../ui/Button';
import {Card} from '../ui/Card';
import {TextField} from '../ui/TextField';

type RoomCreateFormProps = {
  creationConfig: RoomCreationConfig;
  title: string;
  eventDate: string;
  location: string;
  newRoomCode: string;
  showDatePicker: boolean;
  eventUrl: string;
  previewLoading: boolean;
  creating: boolean;
  onTitleChange: (title: string) => void;
  onEventDateChange: (eventDate: string) => void;
  onLocationChange: (location: string) => void;
  onNewRoomCodeChange: (entryCode: string) => void;
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
  showDatePicker,
  eventUrl,
  previewLoading,
  creating,
  onTitleChange,
  onEventDateChange,
  onLocationChange,
  onNewRoomCodeChange,
  onShowDatePickerChange,
  onEventUrlChange,
  onFetchEventUrlPreview,
  onOpenMapPicker,
  onCreateRoom,
}: RoomCreateFormProps) {
  return (
    <Card style={styles.createBox}>
      <Text style={styles.sectionTitle}>방 만들기</Text>
      <TextField
        accessibilityLabel={creationConfig.titleLabel}
        onChangeText={onTitleChange}
        placeholder={creationConfig.titlePlaceholder}
        value={title}
      />
      <Button
        onPress={() => onShowDatePickerChange(true)}
        title={eventDate || '날짜 선택'}
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
          title="완료"
          variant="secondary"
        />
      ) : null}
      {creationConfig.requiresPlace ? (
        <>
          <TextField
            onChangeText={onLocationChange}
            placeholder="장소"
            value={location}
          />
          <Button
            onPress={onOpenMapPicker}
            title="지도에서 장소 선택"
            variant="secondary"
          />
        </>
      ) : null}
      {creationConfig.allowsEventUrlPreview ? (
        <>
          <TextField
            onChangeText={onEventUrlChange}
            placeholder="공식 공지/예매/안내 링크"
            value={eventUrl}
          />
          <Button
            disabled={previewLoading}
            onPress={onFetchEventUrlPreview}
            title={previewLoading ? '가져오는 중...' : '링크에서 정보 가져오기'}
            variant="secondary"
          />
        </>
      ) : null}
      <TextField
        onChangeText={onNewRoomCodeChange}
        placeholder="입장코드"
        secureTextEntry
        value={newRoomCode}
      />
      <Button
        disabled={creating}
        onPress={onCreateRoom}
        title={creating ? '만드는 중...' : '단톡방 만들기'}
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
  createBox: {
    borderRadius: radii.hero,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
