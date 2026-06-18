import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { useAuth } from '../auth/AuthContext';
import { CafeRouteExportCard } from '../components/cafeRoutes/CafeRouteExportCard';
import { CafeRouteMapPreview } from '../components/cafeRoutes/CafeRouteMapPreview';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TextField } from '../components/ui/TextField';
import { isCafeEventCategory } from '../constants/eventCategories';
import {
  deleteCafeRoute,
  getCafeRoutesByCategory,
  saveCafeRoute,
} from '../storage/cafeRoutes';
import { getEventCategoryById } from '../data/eventCategories';
import { colors, layout, radii, spacing } from '../theme/tokens';
import type { CafeRoute, RootStackParamList } from '../types';
import { ALERT_MESSAGES, showAlert, showError } from '../utils/appAlert';
import {
  CAFE_ROUTE_TITLE_MAX_LENGTH,
  addPlaceToCafeRoute,
  createCafeRouteDraft,
  getCafeRouteDisplayTitle,
  getNextRouteIdAfterDelete,
  moveCafeRouteStop,
  normalizeCafeRouteTitle,
  removeCafeRouteStop,
  updateCafeRouteTitle,
} from '../utils/cafeRoutes';
import {
  normalizeFileUri,
  requestPhotoSavePermission,
} from '../utils/photoLibrary';

type Props = NativeStackScreenProps<RootStackParamList, 'CafeRoutes'>;

const MAP_PREVIEW_HEIGHT = 220;
const EXPORT_CARD_MAX_WIDTH = 360;
const EXPORT_CAPTURE_DELAY_MS = 350;

function wait(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

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
  return [route, ...routes.filter(item => item.id !== route.id)].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
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
 * 생일카페 루트를 만들고 장소 순서 편집과 이미지 내보내기를 관리한다.
 */
export function CafeRoutesScreen({ navigation, route }: Props) {
  const { t } = useTranslation('cafeRoutes');
  const { t: tRooms } = useTranslation('rooms');
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const category = getEventCategoryById(route.params.categoryId);
  const isCafeCategory = isCafeEventCategory(route.params.categoryId);
  const [routes, setRoutes] = useState<CafeRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [exportRoute, setExportRoute] = useState<CafeRoute | null>(null);
  const [exportReady, setExportReady] = useState(false);
  const [savingExportImage, setSavingExportImage] = useState(false);
  const exportCardRef = useRef<ViewShotRef>(null);
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

    const hasSelectedRoute = routes.some(
      item => item.id === route.params.routeId,
    );

    if (hasSelectedRoute) {
      return;
    }

    navigation.setParams({ routeId: routes[0]?.id });
  }, [loadingRoutes, navigation, route.params.routeId, routes]);

  const isAnyRouteBusy =
    savingRouteId !== null || deletingRouteId !== null || savingExportImage;
  const isAnyRouteSaving = savingRouteId !== null;
  const isSelectedRouteSaving = selectedRoute
    ? savingRouteId === selectedRoute.id
    : false;
  const isSelectedRouteDeleting = selectedRoute
    ? deletingRouteId === selectedRoute.id
    : false;
  const isSelectedRouteBusy =
    isSelectedRouteSaving || isSelectedRouteDeleting || savingExportImage;

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
      title: category
        ? t('categoryRouteTitle', { categoryTitle: category.title })
        : t('defaultTitle'),
    });

    const persisted = await persistRoute(nextRoute);

    if (!persisted) {
      setRoutes(currentRoutes =>
        currentRoutes.filter(item => item.id !== nextRoute.id),
      );
      return null;
    }

    navigation.setParams({ routeId: nextRoute.id, selectedPlace: undefined });
    return nextRoute;
  }, [
    category,
    isCafeCategory,
    navigation,
    persistRoute,
    route.params.categoryId,
    t,
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
        navigation.setParams({ selectedPlace: undefined });
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
    navigation.setParams({ routeId, selectedPlace: undefined });
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
      navigation.setParams({ routeId: nextRoute.id, selectedPlace: undefined });
      return;
    }

    if (previousRoute) {
      setRoutes(currentRoutes =>
        restoreRouteAfterFailedPersist(currentRoutes, nextRoute, previousRoute),
      );
      navigation.setParams({
        routeId: previousRoute.id,
        selectedPlace: undefined,
      });
    }
  };

  const deleteRouteAndSelectNext = useCallback(
    async (routeToDelete: CafeRoute) => {
      const nextRouteId = getNextRouteIdAfterDelete(routes, routeToDelete.id);

      try {
        setDeletingRouteId(routeToDelete.id);
        await deleteCafeRoute(routeToDelete.id);
        setRoutes(currentRoutes =>
          currentRoutes.filter(item => item.id !== routeToDelete.id),
        );
        navigation.setParams({
          routeId: nextRouteId,
          selectedPlace: undefined,
        });
      } catch (error) {
        showError(error, {
          title: ALERT_MESSAGES.failed,
          fallbackMessage: ALERT_MESSAGES.retry,
        });
      } finally {
        setDeletingRouteId(null);
      }
    },
    [navigation, routes],
  );

  const handleDeleteSelectedRoute = () => {
    if (!selectedRoute || isSelectedRouteBusy) {
      return;
    }

    showAlert({
      title: t('deleteRouteTitle'),
      message: t('deleteRouteMessage', {
        routeTitle: getCafeRouteDisplayTitle(selectedRoute),
      }),
      actions: [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('deleteRouteConfirm'),
          style: 'destructive',
          onPress: () => deleteRouteAndSelectNext(selectedRoute),
        },
      ],
    });
  };

  const handleOpenExportPreview = async () => {
    if (!selectedRoute || selectedRoute.stops.length === 0) {
      return;
    }

    setExportReady(false);
    setExportRoute(selectedRoute);
  };

  const handleCloseExportPreview = () => {
    if (savingExportImage) {
      return;
    }

    setExportRoute(null);
    setExportReady(false);
  };

  const handleExportMapRenderSettled = useCallback(() => {
    setExportReady(true);
  }, []);

  const handleSaveExportPreview = async () => {
    if (!exportRoute || !exportReady || savingExportImage) {
      return;
    }

    try {
      setSavingExportImage(true);

      const hasPermission = await requestPhotoSavePermission();

      if (!hasPermission) {
        showAlert({
          title: t('photoPermissionTitle'),
          message: t('photoPermissionMessage'),
        });
        return;
      }

      await wait(EXPORT_CAPTURE_DELAY_MS);
      const imageUri = await exportCardRef.current?.capture?.();

      if (!imageUri) {
        throw new Error(t('exportFailed'));
      }

      await CameraRoll.saveAsset(normalizeFileUri(imageUri), {
        type: 'photo',
      });
      setExportRoute(null);
      setExportReady(false);
      showAlert({ title: t('exportSaved') });
    } catch {
      showAlert({ title: ALERT_MESSAGES.saveFailed });
    } finally {
      setSavingExportImage(false);
    }
  };

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

  if (!isCafeCategory) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title={t('unavailableCategory')}
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title={t('title')}
          description={t('description')}
          trailing={
            <Button
              disabled={isAnyRouteBusy}
              onPress={handleCreateRoute}
              style={styles.createButton}
              textStyle={styles.createButtonText}
              title="+"
              variant="dark"
            />
          }
          style={styles.header}
        />

        {loadingRoutes ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandMuted} />
            <Text style={styles.loadingText}>{t('loadingRoutes')}</Text>
          </View>
        ) : routes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('emptyTitle')}</Text>
            <Text style={styles.emptyDescription}>{t('emptyDescription')}</Text>
            <Button
              disabled={isAnyRouteBusy}
              loading={isAnyRouteSaving}
              title={t('createFirstRoute')}
              onPress={handleCreateRoute}
            />
          </Card>
        ) : (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{t('myRoutes')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.routeTabs}
              >
                {routes.map(item => {
                  const isSelected = item.id === selectedRoute?.id;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectRoute(item.id)}
                      style={[
                        styles.routeTab,
                        isSelected && styles.routeTabSelected,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.routeTabTitle,
                          isSelected && styles.routeTabTitleSelected,
                        ]}
                      >
                        {getCafeRouteDisplayTitle(item)}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.routeTabMeta,
                          isSelected && styles.routeTabMetaSelected,
                        ]}
                      >
                        {t('cafeCount', { count: item.stops.length })}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {selectedRoute ? (
              <Card style={styles.builderCard}>
                <View style={styles.sectionHeading}>
                  <View style={styles.sectionTitleWrap}>
                    <Text style={styles.eyebrow}>{t('selectedRoute')}</Text>
                    <TextField
                      value={selectedRoute.title}
                      onChangeText={title =>
                        handlePersistSelectedRoute(
                          updateCafeRouteTitle(selectedRoute, title),
                        )
                      }
                      onEndEditing={({ nativeEvent }) =>
                        handlePersistSelectedRoute(
                          updateCafeRouteTitle(
                            selectedRoute,
                            normalizeCafeRouteTitle(nativeEvent.text),
                          ),
                        )
                      }
                      maxLength={CAFE_ROUTE_TITLE_MAX_LENGTH}
                      placeholder={t('routeNamePlaceholder')}
                      style={styles.titleInput}
                    />
                  </View>
                  <Pressable
                    disabled={isSelectedRouteBusy}
                    onPress={handleDeleteSelectedRoute}
                    style={styles.deleteRouteButton}
                  >
                    <Text
                      style={[
                        styles.deleteRouteText,
                        isSelectedRouteBusy && styles.deleteRouteTextDisabled,
                      ]}
                    >
                      {isSelectedRouteDeleting
                        ? t('deletingRoute')
                        : t('deleteRoute')}
                    </Text>
                  </Pressable>
                </View>

                {selectedRoute.stops.length === 0 ? (
                  <View style={styles.mapEmpty}>
                    <Text style={styles.mapEmptyTitle}>
                      {t('addCafeTitle')}
                    </Text>
                    <Text style={styles.mapEmptyText}>
                      {t('addCafeDescription')}
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
                    <Text style={styles.stopEmptyText}>{t('noCafes')}</Text>
                  ) : (
                    selectedRoute.stops.map(stop => {
                      const isMoveUpDisabled =
                        isSelectedRouteBusy || stop.order === 1;
                      const isMoveDownDisabled =
                        isSelectedRouteBusy ||
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
                                `${stop.latitude.toFixed(
                                  5,
                                )}, ${stop.longitude.toFixed(5)}`}
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
                                isMoveUpDisabled && styles.stopActionDisabled,
                              ]}
                            >
                              <Text style={styles.stopActionText}>
                                {t('moveUp')}
                              </Text>
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
                                isMoveDownDisabled && styles.stopActionDisabled,
                              ]}
                            >
                              <Text style={styles.stopActionText}>
                                {t('moveDown')}
                              </Text>
                            </Pressable>
                            <Pressable
                              disabled={isSelectedRouteBusy}
                              onPress={() =>
                                handlePersistSelectedRoute(
                                  removeCafeRouteStop(selectedRoute, stop.id),
                                )
                              }
                              style={[
                                styles.stopAction,
                                isSelectedRouteBusy &&
                                  styles.stopActionDisabled,
                              ]}
                            >
                              <Text style={styles.stopActionText}>
                                {t('delete')}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>

                <View style={styles.actionRow}>
                  <Button
                    disabled={isSelectedRouteBusy}
                    title={t('addCafe')}
                    variant="secondary"
                    style={styles.actionButton}
                    onPress={handleOpenMapPicker}
                  />
                  <Button
                    disabled={
                      isSelectedRouteBusy || selectedRoute.stops.length === 0
                    }
                    onPress={handleOpenExportPreview}
                    title={t('export')}
                    variant="primary"
                    style={styles.actionButton}
                  />
                </View>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
      <Modal
        animationType="fade"
        onRequestClose={handleCloseExportPreview}
        transparent
        visible={Boolean(exportRoute)}
      >
        <View style={styles.exportOverlay}>
          <View style={styles.exportPreviewCard}>
            <View style={styles.exportPreviewHeader}>
              <Text style={styles.exportPreviewTitle}>
                {t('exportPreviewTitle')}
              </Text>
              <Pressable
                disabled={savingExportImage}
                onPress={handleCloseExportPreview}
                style={styles.exportPreviewCloseButton}
              >
                <Text
                  style={[
                    styles.exportPreviewCloseText,
                    savingExportImage && styles.deleteRouteTextDisabled,
                  ]}
                >
                  {t('close')}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.exportPreviewScrollContent}
              style={styles.exportPreviewScroll}
            >
              <ViewShot
                ref={exportCardRef}
                options={{
                  fileName: 'onreori-cafe-route',
                  format: 'png',
                  handleGLSurfaceViewOnAndroid: true,
                  quality: 1,
                  result: 'tmpfile',
                }}
                style={styles.exportCaptureTarget}
              >
                {exportRoute ? (
                  <CafeRouteExportCard
                    onMapRenderSettled={handleExportMapRenderSettled}
                    route={exportRoute}
                  />
                ) : null}
              </ViewShot>
            </ScrollView>

            {!exportReady ? (
              <Text style={styles.exportPreviewStatus}>
                {t('exportPreviewPreparing')}
              </Text>
            ) : null}
            <Button
              disabled={!exportReady || savingExportImage}
              loading={savingExportImage}
              onPress={handleSaveExportPreview}
              title={t('saveToLibrary')}
              variant="primary"
            />
          </View>
        </View>
      </Modal>
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
    gap: spacing.md,
  },
  deleteRouteButton: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deleteRouteText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  deleteRouteTextDisabled: {
    opacity: 0.45,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  eyebrow: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '900',
    paddingLeft: 2,
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
  exportCaptureTarget: {
    maxWidth: EXPORT_CARD_MAX_WIDTH,
    width: '100%',
  },
  exportPreviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: '88%',
    maxWidth: EXPORT_CARD_MAX_WIDTH + spacing.lg * 2,
    padding: spacing.lg,
    width: '100%',
  },
  exportPreviewCloseButton: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  exportPreviewCloseText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  exportPreviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  exportPreviewScroll: {
    flexShrink: 1,
    flexGrow: 0,
  },
  exportPreviewScrollContent: {
    alignItems: 'center',
  },
  exportPreviewStatus: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  exportPreviewTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  exportOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(37, 27, 45, 0.56)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.screen,
  },
  emptyState: {
    flex: 1,
  },
});
