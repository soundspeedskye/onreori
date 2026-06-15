import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {colors, layout, radii, spacing} from '../theme/tokens';

import { useAuth } from '../auth/AuthContext';
import {Card} from '../components/ui/Card';
import {EmptyState} from '../components/ui/EmptyState';
import {PixelIconForEmoji} from '../components/ui/PixelIcon';
import {isCafeEventCategory} from '../constants/eventCategories';
import { getEventCategoryById } from '../data/eventCategories';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryDetail'>;

/**
 * 선택한 이벤트 카테고리에서 체크리스트, 카페 루트, 단톡방 기능으로 분기한다.
 */
export function CategoryDetailScreen({ navigation, route }: Props) {
  const category = getEventCategoryById(route.params.categoryId);
  const { user } = useAuth();

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

  const openRooms = () => {
    if (user) {
      navigation.navigate('EventRooms', { categoryId: category.id });
      return;
    }

    navigation.navigate('Auth', {
      redirect: { type: 'eventRooms', categoryId: category.id },
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <Card style={styles.heroCard}>
          <PixelIconForEmoji
            emoji={category.icon}
            fallbackTextStyle={styles.icon}
            size={54}
          />
          <Text style={styles.title}>{category.title}</Text>
        </Card>

        <View style={styles.actionList}>
          <Card
            onPress={() =>
              navigation.navigate('Conditions', {
                templateId: category.templateId,
              })
            }
            style={styles.actionCard}>
            <Text style={styles.actionTitle}>체크리스트 만들기</Text>
            <Text style={styles.actionDescription}>
              준비물을 체크하고 이미지로 기기에 저장해요.
            </Text>
          </Card>

          {isCafeEventCategory(category.id) ? (
            <Card
              onPress={() =>
                navigation.navigate('CafeRoutes', {categoryId: category.id})
              }
              style={styles.actionCard}>
              <Text style={styles.actionTitle}>생일카페 루트 만들기</Text>
              <Text style={styles.actionDescription}>
                특전 취향에 맞춰 카페를 고르고 내 동선을 저장해요.
              </Text>
            </Card>
          ) : null}

          <Card onPress={openRooms} style={styles.actionCard}>
            <Text style={styles.actionTitle}>오늘의 이벤트 단톡방</Text>
            <Text style={styles.actionDescription}>
              현장에 있는 팬들과 정보를 실시간으로 공유해요.
            </Text>
          </Card>
        </View>
      </View>
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
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: radii.xl,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionList: {
    gap: spacing.lg,
  },
  actionCard: {
    borderRadius: radii.hero,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actionEyebrow: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  actionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  actionDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyState: {
    flex: 1,
  },
});
