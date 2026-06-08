import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';
import type {AuthUser} from '../../types';
import {Card} from '../ui/Card';

type MyPageProfileHeaderProps = {
  user: AuthUser;
};

export function MyPageProfileHeader({user}: MyPageProfileHeaderProps) {
  return (
    <Card style={styles.profileCard}>
      <Text style={styles.profileIcon}>💗</Text>
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
    fontSize: 36,
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
