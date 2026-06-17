import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, layout, radii, spacing } from '../../theme/tokens';
import { AppLanguageSection } from './AppLanguageSection';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type MyPageGuestProps = {
  onLogin: () => void;
};

export function MyPageGuest({ onLogin }: MyPageGuestProps) {
  const { t } = useTranslation('myPage');

  return (
    <View style={styles.content}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{t('title')}</Text>
          <AppLanguageSection />
        </View>
        {/* <Text style={styles.description}>{t('guestDescription')}</Text> */}
        <Button onPress={onLogin} title={t('common:actions.login')} />
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
    gap: spacing.lg,
    padding: layout.screenPadding,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
