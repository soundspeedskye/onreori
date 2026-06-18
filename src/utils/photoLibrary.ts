import { PermissionsAndroid, Platform } from 'react-native';
import {
  iosReadGalleryPermission,
  iosRequestAddOnlyGalleryPermission,
} from '@react-native-camera-roll/camera-roll';

export function normalizeFileUri(uri: string) {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

function isGrantedPhotoPermission(status: string) {
  return status === 'granted' || status === 'limited';
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

export async function requestPhotoSavePermission() {
  if (Platform.OS === 'ios') {
    return requestIosPhotoSavePermission();
  }

  if (Platform.OS === 'android') {
    return requestAndroidPhotoSavePermission();
  }

  return true;
}
