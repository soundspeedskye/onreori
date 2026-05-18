# onreori Setup

## 새로 추가한 파일/폴더

- `data/templates.v1.json`
- `src/types/index.ts`
- `src/data/templates.ts`
- `src/storage/checklists.ts`
- `src/components/TemplateCard.tsx`
- `src/components/ConditionToggle.tsx`
- `src/components/ChecklistItemRow.tsx`
- `src/components/StickerSlot.tsx`
- `src/components/StickerPickerModal.tsx`
- `src/screens/TemplatesScreen.tsx`
- `src/screens/ConditionsScreen.tsx`
- `src/screens/ChecklistScreen.tsx`
- `src/screens/ShareCardScreen.tsx`
- `README_SETUP.md`

## 수정한 기존 파일

- `App.tsx`
- `ios/Podfile`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/onreori/MainActivity.kt`

## 실행 방법

### Metro

```bash
cd /Users/skye-slogup/Documents/New\ project/onreori
npm start
```

### iOS

```bash
cd /Users/skye-slogup/Documents/New\ project/onreori
npm run ios
```

### Android

```bash
cd /Users/skye-slogup/Documents/New\ project/onreori
npm run android
```

## Android 에뮬레이터/기기 미연결 시

`npm run android` 실행 시 보통 아래와 비슷한 메시지가 나옵니다.

```text
error Failed to launch emulator.
error No Android connected device found, and no emulators could be started automatically.
```

또는

```text
adb: no devices/emulators found
```

## 해결 방법

1. Android Studio에서 Device Manager를 열어 에뮬레이터를 하나 실행합니다.
2. 또는 USB 디버깅이 켜진 실제 Android 기기를 연결합니다.
3. 연결 확인:

```bash
adb devices
```

4. 목록에 기기가 보이면 다시 실행:

```bash
cd /Users/skye-slogup/Documents/New\ project/onreori
npm run android
```

## 참고

- 현재 프로젝트 경로에 공백이 있어서 RN 0.84 iOS prebuilt pod 설정이 실패할 수 있습니다.
- 이를 피하려고 `ios/Podfile`에서 RN prebuilt pods를 끄고 source build로 설정했습니다.
