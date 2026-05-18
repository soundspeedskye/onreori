import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { CategoryDetailScreen } from './src/screens/CategoryDetailScreen';
import { CategoryHomeScreen } from './src/screens/CategoryHomeScreen';
import { ChecklistScreen } from './src/screens/ChecklistScreen';
import { ConditionsScreen } from './src/screens/ConditionsScreen';
import { EventRoomsScreen } from './src/screens/EventRoomsScreen';
import { LandingScreen } from './src/screens/LandingScreen';
import { MyPageScreen } from './src/screens/MyPageScreen';
import { RoomChatScreen } from './src/screens/RoomChatScreen';
import { ShareCardScreen } from './src/screens/ShareCardScreen';
import { TemplatesScreen } from './src/screens/TemplatesScreen';
import type { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f7f1ea',
    card: '#fffaf5',
    text: '#241b16',
    primary: '#ff6b6b',
    border: '#eadccd',
  },
};

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f7f1ea" />
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName="Landing"
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: '#fffaf5' },
              headerTitleStyle: { color: '#241b16', fontWeight: '700' },
              headerTintColor: '#241b16',
              contentStyle: { backgroundColor: '#f7f1ea' },
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
              name="Templates"
              component={TemplatesScreen}
              options={{ title: '템플릿' }}
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
    </SafeAreaProvider>
  );
}

export default App;
