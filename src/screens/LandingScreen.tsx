import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {colors, radii, spacing} from '../theme/tokens';

import {Button} from '../components/ui/Button';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
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
          <Text style={styles.title}>가볍고 확실하게</Text>
          <Text style={styles.description}>
            준비물을 챙기고, 현장 정보를 실시간으로 공유해보세요.
          </Text>
        </View>

        <Button
          onPress={() => navigation.replace('CategoryHome')}
          title="시작하기"
          style={styles.primaryButton}
          textStyle={styles.primaryButtonText}
        />
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
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  visual: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.display,
    borderWidth: 1,
    height: 240,
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    position: 'relative',
    width: '100%',
  },
  visualIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  floatingIcon: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.xl,
    fontSize: 26,
    overflow: 'hidden',
    padding: spacing.md,
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
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  eyebrow: {
    color: colors.brandMuted,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
  },
  description: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    borderRadius: radii.card,
    paddingVertical: 17,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
