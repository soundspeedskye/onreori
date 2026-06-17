import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {colors, radii, spacing} from '../theme/tokens';

import {Button} from '../components/ui/Button';
import {PixelIcon} from '../components/ui/PixelIcon';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

/**
 * 앱의 첫 진입 화면으로 핵심 사용 맥락을 보여주고 카테고리 홈으로 이동시킨다.
 */
export function LandingScreen({ navigation }: Props) {
  const {t} = useTranslation('categories');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.visual}>
          <PixelIcon name="ticket" size={80} />
          <View style={[styles.floatingIcon, styles.topLeft]}>
            <PixelIcon name="coffee" size={32} />
          </View>
          <View style={[styles.floatingIcon, styles.topRight]}>
            <PixelIcon name="bag" size={32} />
          </View>
          <View style={[styles.floatingIcon, styles.bottomLeft]}>
            <PixelIcon name="mic" size={32} />
          </View>
          <View style={[styles.floatingIcon, styles.bottomRight]}>
            <PixelIcon name="chat" size={32} />
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Fan day planner</Text>
          <Text style={styles.title}>{t('landing.title')}</Text>
          <Text style={styles.description}>
            {t('landing.description')}
          </Text>
        </View>

        <Button
          onPress={() => navigation.replace('CategoryHome')}
          title={t('landing.start')}
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
  floatingIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.xl,
    height: 54,
    justifyContent: 'center',
    position: 'absolute',
    width: 54,
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
