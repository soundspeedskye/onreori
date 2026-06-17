import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';
import type {AuthUser} from '../../types';
import {AppLanguageSection} from './AppLanguageSection';
import {Card} from '../ui/Card';
import {PixelIcon} from '../ui/PixelIcon';

type MyPageProfileHeaderProps = {
  user: AuthUser;
};

export function MyPageProfileHeader({user}: MyPageProfileHeaderProps) {
  return (
    <Card style={styles.profileCard}>
      <View style={styles.profileMain}>
        <View style={styles.profileIcon}>
          <PixelIcon name="heart" size={38} />
        </View>
        <View style={styles.profileCopy}>
          <Text numberOfLines={1} style={styles.title}>
            {user.nickname}
          </Text>
          <Text numberOfLines={1} style={styles.description}>
            {user.email}
          </Text>
        </View>
      </View>
      <AppLanguageSection />
    </Card>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'flex-start',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  profileMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minWidth: 0,
  },
  profileIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.card,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
