import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useAuth} from '../auth/AuthContext';
import {CafeRouteMapPreview} from '../components/cafeRoutes/CafeRouteMapPreview';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {Chip} from '../components/ui/Chip';
import {EmptyState} from '../components/ui/EmptyState';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {TextField} from '../components/ui/TextField';
import {isCafeEventCategory} from '../constants/eventCategories';
import {isTutorialRoomId, listLinkableRoomsByCategory} from '../services/rooms';
import {
  getCafeRoutesByCategory,
  saveCafeRoute,
} from '../storage/cafeRoutes';
import {getEventCategoryById} from '../data/eventCategories';
import {colors, layout, radii, spacing} from '../theme/tokens';
import type {
  CafeRoute,
  EventRoom,
  RootStackParamList,
} from '../types';
import {ALERT_MESSAGES, showError} from '../utils/appAlert';
import {
  CAFE_ROUTE_TITLE_MAX_LENGTH,
  addPlaceToCafeRoute,
  createCafeRouteDraft,
  getCafeRouteRoomLinkStatus,
  getCafeRouteDisplayTitle,
  linkCafeRouteToRoom,
  moveCafeRouteStop,
  normalizeCafeRouteTitle,
  removeCafeRouteStop,
  unlinkCafeRouteFromRoom,
  updateCafeRouteTitle,
  updateCafeRouteVisibility,
} from '../utils/cafeRoutes';
import {isEventRoomActiveAt} from '../utils/eventRoomVisibility';

type Props = NativeStackScreenProps<RootStackParamList, 'CafeRoutes'>;

const MAP_PREVIEW_HEIGHT = 220;

function getSelectedPlaceSignature(
  place: RootStackParamList['CafeRoutes']['selectedPlace'],
): string | null {
  if (!place) {
    return null;
  }

  return [
    place.name,
    place.latitude.toFixed(6),
    place.longitude.toFixed(6),
  ].join(':');
}

function upsertRoute(routes: CafeRoute[], route: CafeRoute): CafeRoute[] {
  return [
    route,
    ...routes.filter(item => item.id !== route.id),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function restoreRouteAfterFailedPersist(
  routes: CafeRoute[],
  failedRoute: CafeRoute,
  previousRoute: CafeRoute,
): CafeRoute[] {
  if (!routes.some(item => item === failedRoute)) {
    return routes;
  }

  return upsertRoute(
    routes.filter(item => item.id !== failedRoute.id),
    previousRoute,
  );
}

/**
 * 생일카페 루트를 만들고 장소 순서 편집, 공개 여부, 활성 단톡방 연동 상태를 관리한다.
 */
export function CafeRoutesScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const isFocused = useIsFocused();
  const category = getEventCategoryById(route.params.categoryId);
  const isCafeCategory = isCafeEventCategory(route.params.categoryId);
  const [routes, setRoutes] = useState<CafeRoute[]>([]);
  const [rooms, setRooms] = useState<EventRoom[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsLoadFailed, setRoomsLoadFailed] = useState(false);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);
  const consumedPlaceSignatureRef = useRef<string | null>(null);
  const pendingSaveCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const loadRoutes = async () => {
      if (!isCafeCategory) {
        setRoutes([]);
        setLoadingRoutes(false);
        return;
      }

      try {
        setLoadingRoutes(true);
        const storedRoutes = await getCafeRoutesByCategory(
          route.params.categoryId,
        );

        if (mounted) {
          setRoutes(storedRoutes);
        }
      } catch (error) {
        showError(error, {
          title: ALERT_MESSAGES.loadFailed,
          fallbackMessage: ALERT_MESSAGES.retry,
        });
      } finally {
        if (mounted) {
          setLoadingRoutes(false);
        }
      }
    };

    loadRoutes();

    return () => {
      mounted = false;
    };
  }, [isCafeCategory, route.params.categoryId]);

  useEffect(() => {
    let mounted = true;

    const loadRooms = async () => {
      if (!isCafeCategory) {
        setRooms([]);
        setLoadingRooms(false);
        return;
      }

      try {
        setLoadingRooms(true);
        setRoomsLoadFailed(false);
        const categoryRooms = await listLinkableRoomsByCategory(
          route.params.categoryId,
        );

        if (mounted) {
          setRooms(
            categoryRooms.filter(
              room =>
                room.categoryId === route.params.categoryId &&
                !isTutorialRoomId(room.id) &&
                isEventRoomActiveAt(room),
            ),
          );
        }
      } catch {
        if (mounted) {
          setRooms([]);
          setRoomsLoadFailed(true);
        }
      } finally {
        if (mounted) {
          setLoadingRooms(false);
        }
      }
    };

    loadRooms();

    return () => {
      mounted = false;
    };
  }, [isCafeCategory, route.params.categoryId]);

  const selectedRoute = useMemo(() => {
    if (route.params.routeId) {
      return (
        routes.find(item => item.id === route.params.routeId) ??
        routes[0] ??
        null
      );
    }

    return routes[0] ?? null;
  }, [route.params.routeId, routes]);

  useEffect(() => {
    if (loadingRoutes || !route.params.routeId) {
      return;
    }

    const hasSelectedRoute = routes.some(item => item.id === route.params.routeId);

    if (hasSelectedRoute) {
      return;
    }

    navigation.setParams({routeId: routes[0]?.id});
  }, [loadingRoutes, navigation, route.params.routeId, routes]);

  const sharedRouteCount = useMemo(
    () => routes.filter(item => item.visibility === 'shared').length,
    [routes],
  );

  const linkStatus = selectedRoute
    ? getCafeRouteRoomLinkStatus(selectedRoute)
    : {state: 'notLinked' as const, label: '미연동'};
  const linkedRoomListed =
    selectedRoute?.linkedRoom &&
    rooms.some(room => room.id === selectedRoute.linkedRoom?.roomId);
  const linkedRoomUnavailable =
    Boolean(selectedRoute?.linkedRoom) &&
    !loadingRooms &&
    !roomsLoadFailed &&
    !linkedRoomListed;
  const linkedRoomStatusUnknown =
    Boolean(selectedRoute?.linkedRoom) &&
    !loadingRooms &&
    roomsLoadFailed;
  const linkedRoomDisabled =
    linkStatus.state === 'expired' || linkedRoomUnavailable;
  const linkedRoomStatusLabel = linkedRoomStatusUnknown
    ? '단톡방 상태 확인 실패'
    : linkedRoomUnavailable
    ? '단톡방 종료'
    : linkStatus.label;
  const isAnyRouteSaving = savingRouteId !== null;
  const isSelectedRouteSaving = selectedRoute
    ? savingRouteId === selectedRoute.id
    : false;

  const persistRoute = useCallback(async (nextRoute: CafeRoute) => {
    pendingSaveCountRef.current += 1;
    setSavingRouteId(nextRoute.id);
    setRoutes(currentRoutes => upsertRoute(currentRoutes, nextRoute));

    try {
      await saveCafeRoute(nextRoute);
      return true;
    } catch (error) {
      showError(error, {
        title: ALERT_MESSAGES.saveFailed,
        fallbackMessage: ALERT_MESSAGES.retry,
      });
      return false;
    } finally {
      pendingSaveCountRef.current = Math.max(
        0,
        pendingSaveCountRef.current - 1,
      );

      if (pendingSaveCountRef.current === 0) {
        setSavingRouteId(null);
      }
    }
  }, []);

  const createRoute = useCallback(async () => {
    if (!isCafeCategory) {
      return null;
    }

    const nextRoute = createCafeRouteDraft({
      categoryId: route.params.categoryId,
      ownerId: user?.id,
      title: category ? `${category.title} 루트` : '새 생일카페 루트',
    });

    const persisted = await persistRoute(nextRoute);

    if (!persisted) {
      setRoutes(currentRoutes =>
        currentRoutes.filter(item => item.id !== nextRoute.id),
      );
      return null;
    }

    navigation.setParams({routeId: nextRoute.id, selectedPlace: undefined});
    return nextRoute;
  }, [
    category,
    isCafeCategory,
    navigation,
    persistRoute,
    route.params.categoryId,
    user?.id,
  ]);

  useEffect(() => {
    if (loadingRoutes) {
      return;
    }

    const selectedPlace = route.params.selectedPlace;
    const signature = getSelectedPlaceSignature(selectedPlace);

    if (!selectedPlace || !signature) {
      consumedPlaceSignatureRef.current = null;
      return;
    }

    if (consumedPlaceSignatureRef.current === signature) {
      return;
    }

    consumedPlaceSignatureRef.current = signature;

    const addSelectedPlace = async () => {
      const targetRoute = selectedRoute ?? (await createRoute());

      if (!targetRoute) {
        navigation.setParams({selectedPlace: undefined});
        return;
      }

      const nextRoute = addPlaceToCafeRoute(targetRoute, selectedPlace);
      const persisted = await persistRoute(nextRoute);

      if (persisted) {
        navigation.setParams({
          routeId: nextRoute.id,
          selectedPlace: undefined,
        });
        return;
      }

      setRoutes(currentRoutes => upsertRoute(currentRoutes, targetRoute));
      navigation.setParams({
        routeId: targetRoute.id,
        selectedPlace: undefined,
      });
    };

    addSelectedPlace();
  }, [
    createRoute,
    loadingRoutes,
    navigation,
    persistRoute,
    route.params.selectedPlace,
    selectedRoute,
  ]);

  const handleSelectRoute = (routeId: string) => {
    navigation.setParams({routeId, selectedPlace: undefined});
  };

  const handleCreateRoute = async () => {
    await createRoute();
  };

  const handleOpenMapPicker = async () => {
    const targetRoute = selectedRoute ?? (await createRoute());

    if (!targetRoute) {
      return;
    }

    navigation.navigate('MapPicker', {
      categoryId: route.params.categoryId,
      returnTo: 'CafeRoutes',
      routeId: targetRoute.id,
    });
  };

  const handlePersistSelectedRoute = async (nextRoute: CafeRoute) => {
    const previousRoute = selectedRoute;
    const persisted = await persistRoute(nextRoute);

    if (persisted) {
      navigation.setParams({routeId: nextRoute.id, selectedPlace: undefined});
      return;
    }

    if (previousRoute) {
      setRoutes(currentRoutes =>
        restoreRouteAfterFailedPersist(
          currentRoutes,
          nextRoute,
          previousRoute,
        ),
      );
      navigation.setParams({
        routeId: previousRoute.id,
        selectedPlace: undefined,
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

  if (!isCafeCategory) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="생일카페 카테고리에서만 사용할 수 있습니다."
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="생일카페 루트"
          description="특전 취향에 맞춰 카페를 고르고 내 동선을 저장해요."
          trailing={
            <Button
              disabled={isAnyRouteSaving}
              onPress={handleCreateRoute}
              style={styles.createButton}
              textStyle={styles.createButtonText}
              title="+"
              variant="dark"
            />
          }
          style={styles.header}
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text numberOfLines={1} style={styles.summaryNumber}>
              {routes.length}
            </Text>
            <Text style={styles.summaryLabel}>내 루트</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text numberOfLines={1} style={styles.summaryNumber}>
              {sharedRouteCount}
            </Text>
            <Text style={styles.summaryLabel}>공유 가능</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text numberOfLines={2} style={styles.summaryNumber}>
              {linkedRoomStatusLabel}
            </Text>
            <Text style={styles.summaryLabel}>단톡방 연동</Text>
          </View>
        </View>

        {loadingRoutes ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandMuted} />
            <Text style={styles.loadingText}>루트를 불러오는 중입니다.</Text>
          </View>
        ) : routes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 만든 루트가 없어요.</Text>
            <Text style={styles.emptyDescription}>
              생일카페별 특전 취향에 맞춰 첫 방문 루트를 만들어 보세요.
            </Text>
            <Button
              disabled={isAnyRouteSaving}
              loading={isAnyRouteSaving}
              title="첫 루트 만들기"
              onPress={handleCreateRoute}
            />
          </Card>
        ) : (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>내 루트</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.routeTabs}>
                {routes.map(item => {
                  const isSelected = item.id === selectedRoute?.id;
                  const itemStatus = getCafeRouteRoomLinkStatus(item);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectRoute(item.id)}
                      style={[
                        styles.routeTab,
                        isSelected && styles.routeTabSelected,
                      ]}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.routeTabTitle,
                          isSelected && styles.routeTabTitleSelected,
                        ]}>
                        {getCafeRouteDisplayTitle(item)}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.routeTabMeta,
                          isSelected && styles.routeTabMetaSelected,
                        ]}>
                        카페 {item.stops.length}곳 · {itemStatus.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {selectedRoute ? (
              <>
                <Card style={styles.builderCard}>
                  <View style={styles.sectionHeading}>
                    <View style={styles.sectionTitleWrap}>
                      <Text style={styles.eyebrow}>선택한 루트</Text>
                      <TextField
                        value={selectedRoute.title}
                        onChangeText={title =>
                          handlePersistSelectedRoute(
                            updateCafeRouteTitle(selectedRoute, title),
                          )
                        }
                        onEndEditing={({nativeEvent}) =>
                          handlePersistSelectedRoute(
                            updateCafeRouteTitle(
                              selectedRoute,
                              normalizeCafeRouteTitle(nativeEvent.text),
                            ),
                          )
                        }
                        maxLength={CAFE_ROUTE_TITLE_MAX_LENGTH}
                        placeholder="루트 이름"
                        style={styles.titleInput}
                      />
                    </View>
                    <Chip
                      numberOfLines={1}
                      style={styles.headingChip}
                      tone={
                        selectedRoute.visibility === 'shared'
                          ? 'action'
                          : 'brand'
                      }>
                      {selectedRoute.visibility === 'shared'
                        ? '공유 가능'
                        : '나만보기'}
                    </Chip>
                  </View>

                  <View style={styles.visibilityRow}>
                    <Button
                      disabled={isSelectedRouteSaving}
                      title="나만보기"
                      variant={
                        selectedRoute.visibility === 'private'
                          ? 'dark'
                          : 'secondary'
                      }
                      style={styles.visibilityButton}
                      onPress={() =>
                        handlePersistSelectedRoute(
                          updateCafeRouteVisibility(selectedRoute, 'private'),
                        )
                      }
                    />
                    <Button
                      disabled={isSelectedRouteSaving}
                      title="공유 가능"
                      variant={
                        selectedRoute.visibility === 'shared'
                          ? 'dark'
                          : 'secondary'
                      }
                      style={styles.visibilityButton}
                      onPress={() =>
                        handlePersistSelectedRoute(
                          updateCafeRouteVisibility(selectedRoute, 'shared'),
                        )
                      }
                    />
                  </View>

                  {selectedRoute.stops.length === 0 ? (
                    <View style={styles.mapEmpty}>
                      <Text style={styles.mapEmptyTitle}>카페를 추가하세요</Text>
                      <Text style={styles.mapEmptyText}>
                        선택한 장소가 실제 지도 위 마커로 표시됩니다.
                      </Text>
                    </View>
                  ) : isFocused ? (
                    <CafeRouteMapPreview
                      height={MAP_PREVIEW_HEIGHT}
                      stops={selectedRoute.stops}
                    />
                  ) : null}

                  <View style={styles.stopList}>
                    {selectedRoute.stops.length === 0 ? (
                      <Text style={styles.stopEmptyText}>
                        아직 추가한 카페가 없습니다.
                      </Text>
                    ) : (
                      selectedRoute.stops.map(stop => {
                        const isMoveUpDisabled =
                          isSelectedRouteSaving || stop.order === 1;
                        const isMoveDownDisabled =
                          isSelectedRouteSaving ||
                          stop.order === selectedRoute.stops.length;

                        return (
                          <View key={stop.id} style={styles.stopRow}>
                            <View style={styles.stopOrder}>
                              <Text style={styles.stopOrderText}>
                                {stop.order}
                              </Text>
                            </View>
                            <View style={styles.stopCopy}>
                              <Text style={styles.stopName} numberOfLines={2}>
                                {stop.name}
                              </Text>
                              <Text style={styles.stopMeta} numberOfLines={2}>
                                {stop.roadAddress ??
                                  stop.address ??
                                  `${stop.latitude.toFixed(5)}, ${stop.longitude.toFixed(5)}`}
                              </Text>
                            </View>
                            <View style={styles.stopActions}>
                              <Pressable
                                disabled={isMoveUpDisabled}
                                onPress={() =>
                                  handlePersistSelectedRoute(
                                    moveCafeRouteStop(
                                      selectedRoute,
                                      stop.id,
                                      'up',
                                    ),
                                  )
                                }
                                style={[
                                  styles.stopAction,
                                  isMoveUpDisabled &&
                                    styles.stopActionDisabled,
                                ]}>
                                <Text style={styles.stopActionText}>위</Text>
                              </Pressable>
                              <Pressable
                                disabled={isMoveDownDisabled}
                                onPress={() =>
                                  handlePersistSelectedRoute(
                                    moveCafeRouteStop(
                                      selectedRoute,
                                      stop.id,
                                      'down',
                                    ),
                                  )
                                }
                                style={[
                                  styles.stopAction,
                                  isMoveDownDisabled &&
                                    styles.stopActionDisabled,
                                ]}>
                                <Text style={styles.stopActionText}>아래</Text>
                              </Pressable>
                              <Pressable
                                disabled={isSelectedRouteSaving}
                                onPress={() =>
                                  handlePersistSelectedRoute(
                                    removeCafeRouteStop(selectedRoute, stop.id),
                                  )
                                }
                                style={[
                                  styles.stopAction,
                                  isSelectedRouteSaving &&
                                    styles.stopActionDisabled,
                                ]}>
                                <Text style={styles.stopActionText}>삭제</Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>

                  <View style={styles.actionRow}>
                    <Button
                      disabled={isSelectedRouteSaving}
                      title="카페 추가"
                      variant="secondary"
                      style={styles.actionButton}
                      onPress={handleOpenMapPicker}
                    />
                    <Button
                      loading={isSelectedRouteSaving}
                      title={
                        isSelectedRouteSaving ? '저장 중' : '저장됨'
                      }
                      disabled
                      style={styles.actionButton}
                    />
                  </View>
                </Card>

                {selectedRoute.visibility === 'shared' ? (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeading}>
                      <View style={styles.sectionTitleWrap}>
                        <Text style={styles.eyebrow}>선택 사항</Text>
                        <Text style={styles.sectionTitle}>단톡방 연동</Text>
                        <Text style={styles.sectionDescription}>
                          공유 가능한 루트만 생일카페 단톡방에 연결해 조회할 수
                          있습니다.
                        </Text>
                      </View>
                      <Chip
                        numberOfLines={1}
                        style={styles.headingChip}
                        tone="action">
                        {linkedRoomStatusLabel}
                      </Chip>
                    </View>

                    {selectedRoute.linkedRoom ? (
                      <View
                        style={[
                          styles.linkedRoomCard,
                          linkedRoomDisabled && styles.linkedRoomCardDisabled,
                        ]}>
                        <View style={styles.linkedRoomCopy}>
                          <Text style={styles.linkedRoomTitle} numberOfLines={2}>
                            {selectedRoute.linkedRoom.title}
                          </Text>
                          <Text style={styles.linkedRoomMeta}>
                            이 방에서 {linkedRoomStatusLabel}
                          </Text>
                        </View>
                        {linkedRoomDisabled ? null : (
                          <Button
                            disabled={isSelectedRouteSaving}
                            loading={isSelectedRouteSaving}
                            title="해제"
                            variant="secondary"
                            style={styles.unlinkButton}
                            onPress={() =>
                              handlePersistSelectedRoute(
                                unlinkCafeRouteFromRoom(selectedRoute),
                              )
                            }
                          />
                        )}
                      </View>
                    ) : loadingRooms ? (
                      <Text style={styles.sectionDescription}>
                        연동 가능한 단톡방을 불러오는 중입니다.
                      </Text>
                    ) : rooms.length === 0 ? (
                      <Text style={styles.sectionDescription}>
                        현재 연동 가능한 생일카페 단톡방이 없습니다.
                      </Text>
                    ) : (
                      <View style={styles.roomList}>
                        {rooms.map(room => {
                          const isLinked =
                            selectedRoute.linkedRoom?.roomId === room.id;
                          const isRoomOptionDisabled =
                            isSelectedRouteSaving || isLinked;

                          return (
                            <Pressable
                              disabled={isRoomOptionDisabled}
                              key={room.id}
                              onPress={() =>
                                handlePersistSelectedRoute(
                                  linkCafeRouteToRoom(selectedRoute, room),
                                )
                              }
                              style={[
                                styles.roomOption,
                                isLinked && styles.roomOptionSelected,
                                isRoomOptionDisabled &&
                                  styles.roomOptionDisabled,
                              ]}>
                              <View style={styles.roomOptionCopy}>
                                <Text
                                  style={styles.roomOptionTitle}
                                  numberOfLines={2}>
                                  {room.title}
                                </Text>
                                <Text
                                  style={styles.roomOptionMeta}
                                  numberOfLines={1}>
                                  {room.memberCount}명 · {room.eventDate}
                                </Text>
                              </View>
                              <Chip numberOfLines={1} style={styles.roomChip}>
                                {isLinked ? '연동됨' : '연동'}
                              </Chip>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ) : null}

                <Card style={styles.policyCard}>
                  <Text style={styles.policyTitle}>정책 기준</Text>
                  <Text style={styles.policyText}>
                    루트는 개인 카테고리에서 만들고, 공유 가능한 루트만
                    단톡방에 연결합니다. 단톡방이 종료되면 방 안 공유 기록은
                    조회되지 않고, 저장한 루트 사본은 내 계정 루트로 남습니다.
                  </Text>
                </Card>
              </>
            ) : null}
          </>
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
    gap: spacing.lg,
    padding: layout.screenPadding,
    paddingBottom: layout.screenBottomPadding,
  },
  header: {
    marginBottom: spacing.xs,
  },
  createButton: {
    borderRadius: radii.md,
    height: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 44,
  },
  createButtonText: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  summaryRow: {
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderRadius: radii.hero,
    flexDirection: 'row',
    paddingVertical: spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  summaryNumber: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  summaryLabel: {
    color: colors.surfaceMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryDivider: {
    backgroundColor: '#5d4a67',
    height: 34,
    width: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: radii.hero,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  emptyDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  sectionHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  sectionTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  headingChip: {
    maxWidth: 118,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  eyebrow: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  routeTabs: {
    gap: spacing.sm,
    paddingRight: spacing.screen,
  },
  routeTab: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    width: 176,
  },
  routeTabSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  routeTabTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  routeTabTitleSelected: {
    color: colors.textInverse,
  },
  routeTabMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  routeTabMetaSelected: {
    color: colors.surfaceMuted,
  },
  builderCard: {
    borderRadius: radii.hero,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '900',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  visibilityButton: {
    flex: 1,
  },
  mapEmpty: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    height: MAP_PREVIEW_HEIGHT,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mapEmptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  mapEmptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  stopList: {
    gap: spacing.md,
  },
  stopEmptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  stopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  stopOrder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.chip,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  stopOrderText: {
    color: colors.brandText,
    fontSize: 13,
    fontWeight: '900',
  },
  stopCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  stopName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  stopMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  stopActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    maxWidth: 94,
  },
  stopAction: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  stopActionDisabled: {
    opacity: 0.35,
  },
  stopActionText: {
    color: colors.brandText,
    fontSize: 11,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  linkedRoomCard: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: '#bcebd7',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  linkedRoomCardDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    opacity: 0.72,
  },
  linkedRoomCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  linkedRoomTitle: {
    color: colors.successText,
    fontSize: 15,
    fontWeight: '900',
  },
  linkedRoomMeta: {
    color: colors.successText,
    fontSize: 13,
  },
  unlinkButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  roomList: {
    gap: spacing.sm,
  },
  roomOption: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  roomOptionSelected: {
    borderColor: colors.brandMuted,
  },
  roomOptionDisabled: {
    opacity: 0.72,
  },
  roomOptionCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  roomChip: {
    maxWidth: 64,
    textAlign: 'center',
  },
  roomOptionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  roomOptionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  policyCard: {
    backgroundColor: colors.successSoft,
    borderColor: '#bcebd7',
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  policyTitle: {
    color: colors.successText,
    fontSize: 16,
    fontWeight: '900',
  },
  policyText: {
    color: colors.successText,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
  },
});
