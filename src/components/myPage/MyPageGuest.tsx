import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, layout, radii, spacing} from '../../theme/tokens';
import {Button} from '../ui/Button';
import {Card} from '../ui/Card';

type MyPageGuestProps = {
  onLogin: () => void;
};

export function MyPageGuest({onLogin}: MyPageGuestProps) {
  return (
    <View style={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>마이페이지</Text>
        <Text style={styles.description}>
          저장한 체크리스트와 참여한 단톡방은 로그인 후 확인할 수 있어요.
        </Text>
        <Button onPress={onLogin} title="로그인하기" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: layout.screenPadding,
    paddingBottom: layout.screenBottomPadding,
  },
  card: {
    borderRadius: radii.xl,
    gap: spacing.md,
    padding: layout.screenPadding,
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
