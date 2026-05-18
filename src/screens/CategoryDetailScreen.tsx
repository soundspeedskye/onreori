import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {getEventCategoryById} from '../data/eventCategories';
import type {RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryDetail'>;

export function CategoryDetailScreen({navigation, route}: Props) {
  const category = getEventCategoryById(route.params.categoryId);
  const {user} = useAuth();

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>카테고리를 찾지 못했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openRooms = () => {
    if (user) {
      navigation.navigate('EventRooms', {categoryId: category.id});
      return;
    }

    navigation.navigate('Auth', {
      redirect: {type: 'eventRooms', categoryId: category.id},
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.icon}>{category.icon}</Text>
          <Text style={styles.title}>{category.title}</Text>
          <Text style={styles.description}>{category.description}</Text>
        </View>

        <View style={styles.actionList}>
          <Pressable
            onPress={() =>
              navigation.navigate('Conditions', {templateId: category.templateId})
            }
            style={styles.actionCard}>
            <Text style={styles.actionEyebrow}>로그인 없이 가능</Text>
            <Text style={styles.actionTitle}>체크리스트 만들기</Text>
            <Text style={styles.actionDescription}>
              템플릿을 바로 열어서 준비물을 체크하고 기기에 저장해요.
            </Text>
          </Pressable>

          <Pressable onPress={openRooms} style={styles.actionCard}>
            <Text style={styles.actionEyebrow}>로그인 필요</Text>
            <Text style={styles.actionTitle}>오늘의 이벤트 단톡방</Text>
            <Text style={styles.actionDescription}>
              입장코드를 받은 방에 들어가 현장 정보를 실시간으로 공유해요.
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7f1ea',
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 26,
    borderWidth: 1,
    gap: 8,
    padding: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    color: '#241b16',
    fontSize: 26,
    fontWeight: '900',
  },
  description: {
    color: '#5f5047',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionList: {
    gap: 14,
  },
  actionCard: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 22,
    borderWidth: 1,
    gap: 7,
    padding: 18,
  },
  actionEyebrow: {
    color: '#b05f3c',
    fontSize: 12,
    fontWeight: '900',
  },
  actionTitle: {
    color: '#241b16',
    fontSize: 20,
    fontWeight: '900',
  },
  actionDescription: {
    color: '#5f5047',
    fontSize: 14,
    lineHeight: 21,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '800',
  },
});
