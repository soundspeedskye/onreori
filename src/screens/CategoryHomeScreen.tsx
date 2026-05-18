import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {eventCategories} from '../data/eventCategories';
import type {EventCategory, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryHome'>;

export function CategoryHomeScreen({navigation}: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>어떤 팬 이벤트인가요?</Text>
              <Text style={styles.description}>
                체크리스트는 로그인 없이 바로 만들고, 현장 단톡방은 로그인 후
                입장코드로 참여해요.
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('MyPage')}
              style={styles.myButton}>
              <Text style={styles.myButtonText}>MY</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.categoryList}>
          {eventCategories.map((item: EventCategory) => (
            <Pressable
              key={item.id}
              onPress={() =>
                navigation.navigate('CategoryDetail', {categoryId: item.id})
              }
              style={styles.categoryCard}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                <Text style={styles.cardMeta}>{item.roomLabel}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7f1ea',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 18,
  },
  headerTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: '#241b16',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  description: {
    color: '#5f5047',
    fontSize: 15,
    lineHeight: 22,
  },
  myButton: {
    alignItems: 'center',
    backgroundColor: '#241b16',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  myButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  categoryList: {
    gap: 14,
  },
  categoryCard: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#ffe4d6',
    borderRadius: 18,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  icon: {
    fontSize: 30,
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    color: '#241b16',
    fontSize: 19,
    fontWeight: '800',
  },
  cardDescription: {
    color: '#5f5047',
    fontSize: 14,
    lineHeight: 20,
  },
  cardMeta: {
    color: '#b05f3c',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
