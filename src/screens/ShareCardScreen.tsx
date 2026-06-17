import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  CameraRoll,
  iosReadGalleryPermission,
  iosRequestAddOnlyGalleryPermission,
} from '@react-native-camera-roll/camera-roll';
import Share from 'react-native-share';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { colors, layout, spacing } from '../theme/tokens';

import { ShareChecklistPreview } from '../components/checklist/ShareChecklistPreview';
import { BottomActionBar } from '../components/ui/BottomActionBar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { getChecklistById } from '../storage/checklists';
import type { Checklist, RootStackParamList } from '../types';
import { ALERT_MESSAGES, showAlert } from '../utils/appAlert';
import {
  getLocalizedChecklist,
  getSelectedConditionLabels,
} from '../utils/checklistTemplateTranslations';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareCard'>;
type ExportAction = 'save' | 'share';

const IMAGE_MIME_TYPE = 'image/png';

function normalizeFileUri(uri: string) {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

function isGrantedPhotoPermission(status: string) {
  return status === 'granted' || status === 'limited';
}

function isShareCancelError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('cancel') || message.includes('dismiss');
}

async function requestIosPhotoSavePermission() {
  const currentStatus = await iosReadGalleryPermission('addOnly');

  if (isGrantedPhotoPermission(currentStatus)) {
    return true;
  }

  if (currentStatus !== 'not-determined') {
    return false;
  }

  const requestedStatus = await iosRequestAddOnlyGalleryPermission();
  return isGrantedPhotoPermission(requestedStatus);
}

async function requestAndroidPhotoSavePermission() {
  const androidVersion = Number(Platform.Version);
  const permission =
    androidVersion >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : androidVersion >= 29
      ? PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

  const hasPermission = await PermissionsAndroid.check(permission);

  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission);
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestPhotoSavePermission() {
  if (Platform.OS === 'ios') {
    return requestIosPhotoSavePermission();
  }

  if (Platform.OS === 'android') {
    return requestAndroidPhotoSavePermission();
  }

  return true;
}

/**
 * 체크리스트 공유 카드를 캡처해 사진첩 저장 또는 시스템 공유 시트로 내보낸다.
 */
export function ShareCardScreen({ route }: Props) {
  const {t} = useTranslation('shareCard');
  const {t: tTemplates} = useTranslation('checklistTemplates');
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [exportAction, setExportAction] = useState<ExportAction | null>(null);
  const shareCardRef = useRef<ViewShotRef>(null);

  useEffect(() => {
    const loadChecklist = async () => {
      const storedChecklist = await getChecklistById(route.params.checklistId);
      setChecklist(storedChecklist ?? null);
    };

    loadChecklist();
  }, [route.params.checklistId]);

  const selectedConditionLabels = useMemo(
    () =>
      checklist
        ? getSelectedConditionLabels(checklist.selectedConditions, tTemplates)
        : [],
    [checklist, tTemplates],
  );
  const localizedChecklist = useMemo(
    () => (checklist ? getLocalizedChecklist(checklist, tTemplates) : null),
    [checklist, tTemplates],
  );

  const checkedCount =
    checklist?.items.filter(item => item.checked).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;

  const closeExportMenu = () => {
    if (!exportAction) {
      setExportMenuVisible(false);
    }
  };

  const captureShareCard = async () => {
    if (!shareCardRef.current) {
      throw new Error(t('prepareFailed'));
    }

    const imageUri = await shareCardRef.current.capture();
    return normalizeFileUri(imageUri);
  };

  const getShareMessage = () => {
    if (!checklist) {
      return '';
    }

    return [
      `${checklist.icon} ${localizedChecklist?.title ?? checklist.title}`,
      t('messageProgress', {checkedCount, totalCount}),
      selectedConditionLabels.length > 0
        ? t('messageConditions', {
            conditions: selectedConditionLabels.join(', '),
          })
        : t('messageDefaultConditions'),
    ].join('\n');
  };

  const handleSaveImage = async () => {
    if (!checklist) {
      showAlert({ title: ALERT_MESSAGES.notFound });
      return;
    }

    try {
      setExportAction('save');

      const hasPermission = await requestPhotoSavePermission();

      if (!hasPermission) {
        showAlert({
          title: t('photoPermissionTitle'),
          message: t('photoPermissionMessage'),
        });
        return;
      }

      const imageUri = await captureShareCard();
      await CameraRoll.saveAsset(imageUri, { type: 'photo' });
      setExportMenuVisible(false);
      showAlert({ title: t('savedToLibrary') });
    } catch {
      showAlert({ title: ALERT_MESSAGES.saveFailed });
    } finally {
      setExportAction(null);
    }
  };

  const handleShareImage = async () => {
    if (!checklist) {
      showAlert({ title: ALERT_MESSAGES.notFound });
      return;
    }

    try {
      setExportAction('share');

      const imageUri = await captureShareCard();
      setExportMenuVisible(false);

      await Share.open({
        failOnCancel: false,
        message: getShareMessage(),
        title: localizedChecklist?.title ?? checklist.title,
        type: IMAGE_MIME_TYPE,
        url: imageUri,
      });
    } catch (error) {
      if (!isShareCancelError(error)) {
        showAlert({ title: ALERT_MESSAGES.openFailed });
      }
    } finally {
      setExportAction(null);
    }
  };

  if (!checklist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title={t('loadFailed')}
          style={styles.emptyState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ViewShot
          ref={shareCardRef}
          options={{
            fileName: 'onreori-share-card',
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          }}
          style={styles.captureTarget}
        >
          <ShareChecklistPreview
            checklist={localizedChecklist ?? checklist}
            checkedCount={checkedCount}
            selectedConditionLabels={selectedConditionLabels}
            totalCount={totalCount}
          />
        </ViewShot>
      </ScrollView>

      <BottomActionBar>
        <Button
          onPress={() => setExportMenuVisible(true)}
          title={t('export')}
          variant="dark"
        />
      </BottomActionBar>

      <Modal
        animationType="fade"
        onRequestClose={closeExportMenu}
        transparent
        visible={exportMenuVisible}
      >
        <Pressable style={styles.exportOverlay} onPress={closeExportMenu}>
          <Pressable
            onPress={event => event.stopPropagation()}
            style={styles.exportSheet}
          >
            <View style={styles.exportActions}>
              <Button
                disabled={Boolean(exportAction)}
                loading={exportAction === 'save'}
                onPress={handleSaveImage}
                title={t('saveToLibrary')}
                variant="secondary"
              />
              <Button
                disabled={Boolean(exportAction)}
                loading={exportAction === 'share'}
                onPress={handleShareImage}
                title={t('share')}
                variant="dark"
              />
            </View>
          </Pressable>
        </Pressable>
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
    gap: spacing.screen,
    padding: layout.screenPadding,
    paddingBottom: layout.bottomActionScrollPadding,
  },
  captureTarget: {
    backgroundColor: colors.background,
    width: '100%',
  },
  emptyState: {
    flex: 1,
  },
  exportOverlay: {
    backgroundColor: 'rgba(37, 27, 45, 0.38)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.screen,
  },
  exportSheet: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  exportTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  exportActions: {
    gap: spacing.sm,
  },
});
