import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {colors} from './src/theme/tokens';
import './src/i18n';

import { AuthProvider } from './src/auth/AuthContext';
import {AppLanguageProvider} from './src/i18n/AppLanguageProvider';
import { AuthScreen } from './src/screens/AuthScreen';
import { CafeRoutesScreen } from './src/screens/CafeRoutesScreen';
import { CategoryDetailScreen } from './src/screens/CategoryDetailScreen';
import { CategoryHomeScreen } from './src/screens/CategoryHomeScreen';
import { ChecklistScreen } from './src/screens/ChecklistScreen';
import { ConditionsScreen } from './src/screens/ConditionsScreen';
import { EventRoomsScreen } from './src/screens/EventRoomsScreen';
import { LandingScreen } from './src/screens/LandingScreen';
import { MapPickerScreen } from './src/screens/MapPickerScreen';
import { MyPageScreen } from './src/screens/MyPageScreen';
import { RoomChatScreen } from './src/screens/RoomChatScreen';
import { ShareCardScreen } from './src/screens/ShareCardScreen';
import type { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    primary: colors.brand,
    border: colors.border,
  },
};

function AppNavigator() {
  const {t} = useTranslation('navigation');

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CategoryHome"
          component={CategoryHomeScreen}
          options={{ title: t('appName') }}
        />
        <Stack.Screen
          name="CategoryDetail"
          component={CategoryDetailScreen}
          options={{ title: t('category') }}
        />
        <Stack.Screen
          name="Conditions"
          component={ConditionsScreen}
          options={{ title: t('conditions') }}
        />
        <Stack.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{ title: t('checklist') }}
        />
        <Stack.Screen
          name="CafeRoutes"
          component={CafeRoutesScreen}
          options={{ title: t('cafeRoutes') }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ title: t('auth') }}
        />
        <Stack.Screen
          name="EventRooms"
          component={EventRoomsScreen}
          options={{ title: t('eventRooms') }}
        />
        <Stack.Screen
          name="MapPicker"
          component={MapPickerScreen}
          options={{ title: t('mapPicker') }}
        />
        <Stack.Screen
          name="RoomChat"
          component={RoomChatScreen}
          options={{ title: t('roomChat') }}
        />
        <Stack.Screen
          name="MyPage"
          component={MyPageScreen}
          options={{ title: t('myPage') }}
        />
        <Stack.Screen
          name="ShareCard"
          component={ShareCardScreen}
          options={{ title: t('shareCard') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider preload={false}>
        <AppLanguageProvider>
          <AuthProvider>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <AppNavigator />
          </AuthProvider>
        </AppLanguageProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

export default App;
