import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export function LandingScreen({navigation}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.visual}>
          <Text style={styles.visualIcon}>🎟️</Text>
          <Text style={[styles.floatingIcon, styles.topLeft]}>☕</Text>
          <Text style={[styles.floatingIcon, styles.topRight]}>🛍️</Text>
          <Text style={[styles.floatingIcon, styles.bottomLeft]}>🎤</Text>
          <Text style={[styles.floatingIcon, styles.bottomRight]}>💬</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Fan day planner</Text>
          <Text style={styles.title}>팬 이벤트 준비를 가볍고 확실하게</Text>
          <Text style={styles.description}>
            체크리스트는 바로 써보고, 현장 정보가 필요할 때만 로그인해서
            이벤트 단톡방에 참여하세요.
          </Text>
        </View>

        <Pressable
          onPress={() => navigation.replace('CategoryHome')}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>시작하기</Text>
        </Pressable>
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
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  visual: {
    alignSelf: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 32,
    borderWidth: 1,
    height: 240,
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
    width: '100%',
  },
  visualIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  floatingIcon: {
    backgroundColor: '#ffe4d6',
    borderRadius: 24,
    fontSize: 26,
    overflow: 'hidden',
    padding: 12,
    position: 'absolute',
  },
  topLeft: {
    left: 26,
    top: 26,
  },
  topRight: {
    right: 32,
    top: 42,
  },
  bottomLeft: {
    bottom: 34,
    left: 48,
  },
  bottomRight: {
    bottom: 26,
    right: 34,
  },
  copy: {
    gap: 10,
    marginBottom: 28,
  },
  eyebrow: {
    color: '#b05f3c',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#241b16',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
  },
  description: {
    color: '#5f5047',
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 18,
    paddingVertical: 17,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
