import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';
import type {AuthUser} from '../../types';
import {Card} from '../ui/Card';
import {PixelIcon} from '../ui/PixelIcon';

type MyPageProfileHeaderProps = {
  user: AuthUser;
};

export function MyPageProfileHeader({user}: MyPageProfileHeaderProps) {
  return (
    <Card style={styles.profileCard}>
      <View style={styles.profileIcon}>
        <PixelIcon name="heart" size={38} />
      </View>
      <View style={styles.profileCopy}>
        <Text style={styles.title}>{user.nickname}</Text>
        <Text style={styles.description}>{user.email}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
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
