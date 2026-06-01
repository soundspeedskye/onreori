import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, layout, radii, spacing } from '../theme/tokens';

import { useAuth } from '../auth/AuthContext';
import {isCafeEventCategory} from '../constants/eventCategories';
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
  getTutorialRoomForCategory,
  isTutorialRoomId,
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
import { shouldShowRoomInTodayList } from '../utils/eventRoomVisibility';
import {ALERT_MESSAGES, showAlert, showError} from '../utils/appAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'EventRooms'>;

type AppliedPreviewValues = {
  eventDate?: string;
  location?: string;
  title?: string;
};

function shouldApplyPreviewValue(
  currentValue: string,
  nextValue: string | undefined,
  previousPreviewValue: string | undefined,
) {
  return Boolean(
    nextValue &&
      (!currentValue.trim() || currentValue === previousPreviewValue),
  );
}

export function EventRoomsScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const category = getEventCategoryById(route.params.categoryId);
  const creationConfig = category
    ? getRoomCreationConfig(category.id)
    : getRoomCreationConfig(route.params.categoryId);
  const [rooms, setRooms] = useState<EventRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingTutorialFallback, setUsingTutorialFallback] = useState(false);
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
  const appliedPreviewValuesRef = useRef<AppliedPreviewValues>({});

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    delete appliedPreviewValuesRef.current.title;
  };

  const handleLocationChange = (nextLocation: string) => {
    setLocation(nextLocation);
    setSelectedPlace(null);
    delete appliedPreviewValuesRef.current.location;
  };

  const loadRooms = useCallback(async () => {
    if (!category) {
      return;
    }

    setLoading(true);
    try {
      setRooms(await listRoomsByCategory(category.id));
      setUsingTutorialFallback(false);
    } catch {
      setRooms([getTutorialRoomForCategory(category.id)]);
      setUsingTutorialFallback(true);
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
      delete appliedPreviewValuesRef.current.location;
      return;
    }

    if (!place) {
      setSelectedPlace(null);
      setLocation('');
      delete appliedPreviewValuesRef.current.location;
      return;
    }

    setSelectedPlace(place);
    setLocation(
      place.name.trim() ||
        place.roadAddress?.trim() ||
        place.address?.trim() ||
        (place.source === 'center' ? '선택한 장소' : ''),
    );
    delete appliedPreviewValuesRef.current.location;
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
      showAlert({title: validationMessage});
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
        subjectName: isCafeEventCategory(category.id) ? title.trim() : undefined,
        entryCode: newRoomCode,
        user,
      });
      if (shouldShowRoomInTodayList(room)) {
        setRooms(current => [room, ...current]);
      } else {
        showAlert({
          title: '생성했습니다.',
          message: '이 단톡방은 이벤트 5일 전부터 오늘의 단톡방에 표시됩니다.',
        });
      }
      setTitle('');
      setEventDate('');
      setLocation('');
      setNewRoomCode('');
      setEventUrl('');
      setSelectedPlace(null);
      appliedPreviewValuesRef.current = {};
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.createFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleFetchEventUrlPreview = async () => {
    if (!eventUrl.trim()) {
      showAlert({title: ALERT_MESSAGES.requiredInput});
      return;
    }

    try {
      setPreviewLoading(true);
      const preview = await fetchEventUrlPreview(eventUrl);
      const previewTitle = preview.title;
      const previewDate = preview.dateCandidates[0];
      const previewLocation = preview.locationCandidates[0];

      setTitle(current => {
        if (
          !shouldApplyPreviewValue(
            current,
            previewTitle,
            appliedPreviewValuesRef.current.title,
          )
        ) {
          return current;
        }

        appliedPreviewValuesRef.current.title = previewTitle;
        return previewTitle ?? current;
      });
      setEventDate(current => {
        if (
          !shouldApplyPreviewValue(
            current,
            previewDate,
            appliedPreviewValuesRef.current.eventDate,
          )
        ) {
          return current;
        }

        appliedPreviewValuesRef.current.eventDate = previewDate;
        return previewDate ?? current;
      });
      setLocation(current => {
        if (
          !shouldApplyPreviewValue(
            current,
            previewLocation,
            appliedPreviewValuesRef.current.location,
          )
        ) {
          return current;
        }

        setSelectedPlace(null);
        appliedPreviewValuesRef.current.location = previewLocation;
        return previewLocation ?? current;
      });
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.loadFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleJoinRoom = async (room: EventRoom) => {
    if (!user) {
      return;
    }

    try {
      await joinRoomWithCode(
        room.id,
        isTutorialRoomId(room.id) ? '' : entryCode,
        user,
      );
      setEntryCode('');
      setSelectedRoomId(null);
      navigation.navigate('RoomChat', {
        roomId: room.id,
        title: room.title,
        categoryId: room.categoryId,
      });
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.failed,
        fallbackMessage: ALERT_MESSAGES.checkInput,
      });
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
              onChangeText={handleTitleChange}
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
                    delete appliedPreviewValuesRef.current.eventDate;
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
              <>
                <TextField
                  onChangeText={handleLocationChange}
                  placeholder="장소"
                  value={location}
                />
                <Button
                  onPress={() =>
                    navigation.navigate('MapPicker', {
                      categoryId: category.id,
                      returnTo: 'EventRooms',
                    })
                  }
                  title="지도에서 장소 선택"
                  variant="secondary"
                />
              </>
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
          {usingTutorialFallback ? (
            <Text style={styles.fallbackNotice}>
              단톡방 목록을 잠시 불러오지 못해 튜토리얼 방을 보여드려요.
            </Text>
          ) : null}
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
                isTutorial={isTutorialRoomId(item.id)}
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
    padding: layout.screenPadding,
    paddingBottom: layout.screenBottomPadding,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
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
  loader: {
    marginTop: spacing.lg,
  },
  fallbackNotice: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  roomList: {
    gap: spacing.md,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: layout.screenPadding,
  },
  emptyState: {
    flex: 1,
  },
});
