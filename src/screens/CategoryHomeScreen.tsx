import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {colors, layout, radii, spacing} from '../theme/tokens';

import {CategoryCard} from '../components/categories/CategoryCard';
import {Button} from '../components/ui/Button';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import { eventCategories } from '../data/eventCategories';
import type { EventCategory, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryHome'>;

/**
 * 이벤트 카테고리 목록을 보여주고 선택한 카테고리 상세 또는 마이페이지로 연결한다.
 */
export function CategoryHomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="어떤 이벤트인가요?"
          description="현장에 있는 팬들과 실시간으로 소통해요."
          trailing={
            <Button
              onPress={() => navigation.navigate('MyPage')}
              style={styles.myButton}
              textStyle={styles.myButtonText}
              title="MY"
              variant="dark"
            />
          }
          style={styles.header}
        />

        <View style={styles.categoryList}>
          {eventCategories.map((item: EventCategory) => (
            <CategoryCard
              key={item.id}
              category={item}
              onPress={() =>
                navigation.navigate('CategoryDetail', { categoryId: item.id })
              }
            />
          ))}
        </View>
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
    padding: layout.screenPadding,
    paddingBottom: layout.screenBottomPadding,
  },
  header: {
    marginBottom: spacing.lg,
  },
  myButton: {
    borderRadius: radii.md,
    height: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 44,
  },
  myButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  categoryList: {
    gap: spacing.lg,
  },
});
