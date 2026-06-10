import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {colors} from './src/theme/tokens';

import { AuthProvider } from './src/auth/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
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

function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider preload={false}>
        <AuthProvider>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
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
                options={{ title: 'onreori' }}
              />
              <Stack.Screen
                name="CategoryDetail"
                component={CategoryDetailScreen}
                options={{ title: '카테고리' }}
              />
              <Stack.Screen
                name="Conditions"
                component={ConditionsScreen}
                options={{ title: '상황 선택' }}
              />
              <Stack.Screen
                name="Checklist"
                component={ChecklistScreen}
                options={{ title: '체크리스트' }}
              />
              <Stack.Screen
                name="Auth"
                component={AuthScreen}
                options={{ title: '로그인' }}
              />
              <Stack.Screen
                name="EventRooms"
                component={EventRoomsScreen}
                options={{ title: '이벤트 단톡방' }}
              />
              <Stack.Screen
                name="MapPicker"
                component={MapPickerScreen}
                options={{ title: '장소 선택' }}
              />
              <Stack.Screen
                name="RoomChat"
                component={RoomChatScreen}
                options={{ title: '단톡방' }}
              />
              <Stack.Screen
                name="MyPage"
                component={MyPageScreen}
                options={{ title: '마이페이지' }}
              />
              <Stack.Screen
                name="ShareCard"
                component={ShareCardScreen}
                options={{ title: '공유 카드' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

export default App;
