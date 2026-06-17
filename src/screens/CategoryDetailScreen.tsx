import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
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
  const {t} = useTranslation('categories');
  const {t: tRooms} = useTranslation('rooms');
  const category = getEventCategoryById(route.params.categoryId);
  const { user } = useAuth();

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
            <Text style={styles.actionTitle}>
              {t('actions.checklistTitle')}
            </Text>
            <Text style={styles.actionDescription}>
              {t('actions.checklistDescription')}
            </Text>
          </Card>

          {isCafeEventCategory(category.id) ? (
            <Card
              onPress={() =>
                navigation.navigate('CafeRoutes', {categoryId: category.id})
              }
              style={styles.actionCard}>
              <Text style={styles.actionTitle}>
                {t('actions.cafeRoutesTitle')}
              </Text>
              <Text style={styles.actionDescription}>
                {t('actions.cafeRoutesDescription')}
              </Text>
            </Card>
          ) : null}

          <Card onPress={openRooms} style={styles.actionCard}>
            <Text style={styles.actionTitle}>{t('actions.roomsTitle')}</Text>
            <Text style={styles.actionDescription}>
              {t('actions.roomsDescription')}
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
