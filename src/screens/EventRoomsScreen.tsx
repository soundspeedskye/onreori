import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {EventRoomList} from '../components/rooms/EventRoomList';
import {RoomCreateForm} from '../components/rooms/RoomCreateForm';
import {RoomLanguageFilterBar} from '../components/rooms/RoomLanguageFilterBar';
import {EmptyState} from '../components/ui/EmptyState';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {EVENT_CATEGORY_IDS} from '../constants/eventCategories';
import {getEventCategoryById} from '../data/eventCategories';
import {useAppLanguage} from '../i18n/AppLanguageProvider';
import {getTutorialRoomCopy} from '../services/rooms';
import {colors, layout, spacing} from '../theme/tokens';
import {useAuth} from '../auth/AuthContext';
import type {EventRoomLanguageFilter, RootStackParamList} from '../types';
import {getRoomCreationConfig} from '../utils/eventRoomForm';
import {filterRoomsByLanguage} from '../utils/eventRoomLanguages';
import {useCreateRoomAction} from './eventRooms/useCreateRoomAction';
import {useEventRooms} from './eventRooms/useEventRooms';
import {useEventUrlPreview} from './eventRooms/useEventUrlPreview';
import {useRoomCreationForm} from './eventRooms/useRoomCreationForm';
import {useRoomJoinAction} from './eventRooms/useRoomJoinAction';

type Props = NativeStackScreenProps<RootStackParamList, 'EventRooms'>;

/**
 * 카테고리별 이벤트 단톡방 목록, 방 생성 폼, 입장 코드 기반 참여 흐름을 조립한다.
 */
export function EventRoomsScreen({navigation, route}: Props) {
  const {t: tRooms} = useTranslation('rooms');
  const {user} = useAuth();
  const {language} = useAppLanguage();
  const [selectedLanguageFilter, setSelectedLanguageFilter] =
    useState<EventRoomLanguageFilter>('all');
  const category = getEventCategoryById(route.params.categoryId);
  const creationConfig = category
    ? getRoomCreationConfig(category.id)
    : getRoomCreationConfig(route.params.categoryId);
  const localizedCreationConfig = useMemo(() => {
    if (category?.id === EVENT_CATEGORY_IDS.CAFE_EVENT) {
      return {
        ...creationConfig,
        titleLabel: tRooms('artistTitleLabel'),
        titlePlaceholder: tRooms('artistTitlePlaceholder'),
      };
    }

    return {
      ...creationConfig,
      titleLabel: tRooms('titleLabel'),
      titlePlaceholder:
        category?.id === EVENT_CATEGORY_IDS.POPUP
          ? tRooms('popupTitlePlaceholder')
          : tRooms('eventDayTitlePlaceholder'),
    };
  }, [category?.id, creationConfig, tRooms]);
  const tutorialCopy = useMemo(() => getTutorialRoomCopy(language), [language]);
  const {rooms, loading, usingTutorialFallback, loadRooms, addRoomToList} =
    useEventRooms(category?.id, tutorialCopy);
  const visibleRooms = useMemo(
    () => filterRoomsByLanguage(rooms, selectedLanguageFilter),
    [rooms, selectedLanguageFilter],
  );
  const form = useRoomCreationForm({
    requiresPlace: localizedCreationConfig.requiresPlace,
    selectedPlace: route.params.selectedPlace,
  });
  const {previewLoading, handleFetchEventUrlPreview} = useEventUrlPreview({
    eventUrl: form.eventUrl,
    appliedPreviewValuesRef: form.appliedPreviewValuesRef,
    setTitle: form.setTitle,
    setEventDate: form.setEventDate,
    setLocation: form.setLocation,
    setSelectedPlaceForRoom: form.setSelectedPlaceForRoom,
  });
  const {creating, handleCreateRoom} = useCreateRoomAction({
    user,
    category,
    creationConfig: localizedCreationConfig,
    form,
    onVisibleRoomCreated: addRoomToList,
  });
  const roomJoin = useRoomJoinAction({user, navigation});

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth', {
        redirect: {type: 'eventRooms', categoryId: route.params.categoryId},
      });
      return;
    }

    loadRooms();
  }, [loadRooms, navigation, route.params.categoryId, user]);

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title={tRooms('categoryNotFound')}
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ScreenHeader
            title={tRooms('categoryRoomTitle', {categoryTitle: category.title})}
          />
          <RoomCreateForm
            creationConfig={localizedCreationConfig}
            title={form.title}
            eventDate={form.eventDate}
            location={form.location}
            newRoomCode={form.newRoomCode}
            languageCodes={form.languageCodes}
            showDatePicker={form.showDatePicker}
            eventUrl={form.eventUrl}
            previewLoading={previewLoading}
            creating={creating}
            onTitleChange={form.handleTitleChange}
            onEventDateChange={form.handleDateChange}
            onLocationChange={form.handleLocationChange}
            onNewRoomCodeChange={form.setNewRoomCode}
            onToggleLanguageCode={form.toggleLanguageCode}
            onShowDatePickerChange={form.setShowDatePicker}
            onEventUrlChange={form.setEventUrl}
            onFetchEventUrlPreview={handleFetchEventUrlPreview}
            onOpenMapPicker={() =>
              navigation.navigate('MapPicker', {
                categoryId: category.id,
                returnTo: 'EventRooms',
              })
            }
            onCreateRoom={handleCreateRoom}
          />

          <Text style={styles.sectionTitle}>{tRooms('todayRooms')}</Text>
          <RoomLanguageFilterBar
            onSelectFilter={setSelectedLanguageFilter}
            selectedFilter={selectedLanguageFilter}
          />
          {usingTutorialFallback ? (
            <Text style={styles.fallbackNotice}>
              {tRooms('tutorialFallbackNotice')}
            </Text>
          ) : null}
        </View>

        <EventRoomList
          rooms={visibleRooms}
          loading={loading}
          selectedRoomId={roomJoin.selectedRoomId}
          entryCode={roomJoin.entryCode}
          onEntryCodeChange={roomJoin.setEntryCode}
          onSelectRoom={roomJoin.setSelectedRoomId}
          onJoinRoom={roomJoin.handleJoinRoom}
        />
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
  fallbackNotice: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyState: {
    flex: 1,
  },
});
