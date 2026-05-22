import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/tokens';

import { useAuth } from '../auth/AuthContext';
import { RoomCard } from '../components/rooms/RoomCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TextField } from '../components/ui/TextField';
import { getEventCategoryById } from '../data/eventCategories';
import { fetchEventUrlPreview } from '../services/eventUrlPreview';
import {
  createRoom,
  joinRoomWithCode,
  listRoomsByCategory,
} from '../services/rooms';
import type { EventRoom, PlaceSelection, RootStackParamList } from '../types';
import { formatDateInput, parseDateInput } from '../utils/date';
import {
  buildRoomTitle,
  getRoomCreationConfig,
  validateRoomCreationDraft,
} from '../utils/eventRoomForm';

type Props = NativeStackScreenProps<RootStackParamList, 'EventRooms'>;

export function EventRoomsScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const category = getEventCategoryById(route.params.categoryId);
  const creationConfig = category
    ? getRoomCreationConfig(category.id)
    : getRoomCreationConfig(route.params.categoryId);
  const [rooms, setRooms] = useState<EventRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [entryCode, setEntryCode] = useState('');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventUrl, setEventUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSelection | null>(
    null,
  );

  const loadRooms = useCallback(async () => {
    if (!category) {
      return;
    }

    setLoading(true);
    try {
      setRooms(await listRoomsByCategory(category.id));
    } catch {
      Alert.alert('단톡방을 불러오지 못했습니다.', '잠시 후 다시 시도하세요.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth', {
        redirect: { type: 'eventRooms', categoryId: route.params.categoryId },
      });
      return;
    }

    loadRooms();
  }, [loadRooms, navigation, route.params.categoryId, user]);

  useEffect(() => {
    const place = route.params.selectedPlace;

    if (!creationConfig.requiresPlace) {
      setSelectedPlace(null);
      setLocation('');
      return;
    }

    if (!place) {
      setSelectedPlace(null);
      setLocation('');
      return;
    }

    setSelectedPlace(place);
    setLocation(
      place.name || place.roadAddress || place.address || '선택한 장소',
    );
  }, [creationConfig.requiresPlace, route.params.selectedPlace]);

  const handleCreateRoom = async () => {
    if (!user || !category) {
      return;
    }

    const validationMessage = validateRoomCreationDraft(category.id, {
      title,
      eventDate,
      entryCode: newRoomCode,
      location,
    });

    if (validationMessage) {
      Alert.alert(validationMessage);
      return;
    }

    try {
      setCreating(true);
      const selectedPlaceForRoom = creationConfig.requiresPlace
        ? selectedPlace
        : undefined;
      const room = await createRoom({
        categoryId: category.id,
        title: buildRoomTitle(category.id, title),
        eventDate,
        location: creationConfig.requiresPlace ? location : '',
        eventUrl: creationConfig.allowsEventUrlPreview ? eventUrl : undefined,
        locationName: selectedPlaceForRoom?.name,
        address: selectedPlaceForRoom?.address,
        roadAddress: selectedPlaceForRoom?.roadAddress,
        latitude: selectedPlaceForRoom?.latitude,
        longitude: selectedPlaceForRoom?.longitude,
        subjectName: category.id === 'CAFE_EVENT' ? title.trim() : undefined,
        entryCode: newRoomCode,
        user,
      });
      setRooms(current => [room, ...current]);
      setTitle('');
      setEventDate('');
      setLocation('');
      setNewRoomCode('');
      setEventUrl('');
      setSelectedPlace(null);
    } catch (error) {
      Alert.alert(
        '방을 만들지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleFetchEventUrlPreview = async () => {
    if (!eventUrl.trim()) {
      Alert.alert('링크를 입력하세요.');
      return;
    }

    try {
      setPreviewLoading(true);
      const preview = await fetchEventUrlPreview(eventUrl);
      setTitle(current => current.trim() || preview.title || '');
      setEventDate(
        current => current.trim() || preview.dateCandidates[0] || '',
      );
      setLocation(
        current => current.trim() || preview.locationCandidates[0] || '',
      );
    } catch (error) {
      Alert.alert(
        '링크 정보를 가져오지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleJoinRoom = async (room: EventRoom) => {
    if (!user) {
      return;
    }

    try {
      await joinRoomWithCode(room.id, entryCode, user);
      setEntryCode('');
      setSelectedRoomId(null);
      navigation.navigate('RoomChat', {
        roomId: room.id,
        title: room.title,
        categoryId: room.categoryId,
      });
    } catch (error) {
      Alert.alert(
        '입장하지 못했습니다.',
        error instanceof Error ? error.message : '입장코드를 확인하세요.',
      );
    }
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="카테고리를 찾지 못했습니다."
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ScreenHeader title={`${category.title} 단톡방`} />

          <Card style={styles.createBox}>
            <Text style={styles.sectionTitle}>방 만들기</Text>
            <TextField
              accessibilityLabel={creationConfig.titleLabel}
              onChangeText={setTitle}
              placeholder={creationConfig.titlePlaceholder}
              value={title}
            />
            <Button
              onPress={() => setShowDatePicker(true)}
              title={eventDate || '날짜 선택'}
              variant="secondary"
            />
            {showDatePicker ? (
              <DateTimePicker
                mode="date"
                value={parseDateInput(eventDate) ?? new Date()}
                onChange={(_event, date) => {
                  if (Platform.OS !== 'ios') {
                    setShowDatePicker(false);
                  }

                  if (date) {
                    setEventDate(formatDateInput(date));
                  }
                }}
              />
            ) : null}
            {showDatePicker && Platform.OS === 'ios' ? (
              <Button
                onPress={() => setShowDatePicker(false)}
                title="완료"
                variant="secondary"
              />
            ) : null}
            {creationConfig.requiresPlace ? (
              <Button
                onPress={() =>
                  navigation.navigate('MapPicker', {
                    categoryId: category.id,
                    returnTo: 'EventRooms',
                  })
                }
                title={location || '지도에서 장소 선택'}
                variant="secondary"
              />
            ) : null}
            {creationConfig.allowsEventUrlPreview ? (
              <>
                <TextField
                  onChangeText={setEventUrl}
                  placeholder="공식 공지/예매/안내 링크"
                  value={eventUrl}
                />
                <Button
                  disabled={previewLoading}
                  onPress={handleFetchEventUrlPreview}
                  title={
                    previewLoading ? '가져오는 중...' : '링크에서 정보 가져오기'
                  }
                  variant="secondary"
                />
              </>
            ) : null}
            <TextField
              onChangeText={setNewRoomCode}
              placeholder="입장코드"
              secureTextEntry
              value={newRoomCode}
            />
            <Button
              disabled={creating}
              onPress={handleCreateRoom}
              title={creating ? '만드는 중...' : '단톡방 만들기'}
              variant="dark"
            />
          </Card>

          <Text style={styles.sectionTitle}>오늘의 단톡방</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : rooms.length === 0 ? (
          <EmptyState
            title="아직 만들어진 방이 없습니다."
            description="첫 방을 만들어 현장 정보를 모아보세요."
            style={styles.emptyBox}
          />
        ) : (
          <View style={styles.roomList}>
            {rooms.map(item => (
              <RoomCard
                key={item.id}
                entryCode={entryCode}
                onEntryCodeChange={setEntryCode}
                onJoin={() => {
                  handleJoinRoom(item);
                }}
                onSelect={() => setSelectedRoomId(item.id)}
                room={item}
                selected={selectedRoomId === item.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  createBox: {
    borderRadius: 22,
    gap: 10,
    padding: 16,
  },
  loader: {
    marginTop: 18,
  },
  roomList: {
    gap: 12,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
  },
});
