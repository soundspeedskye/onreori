import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';
import type {EventCategory} from '../../types';
import {Card} from '../ui/Card';
import {PixelIcon, getPixelIconNameForEmoji} from '../ui/PixelIcon';

type CategoryCardProps = {
  category: EventCategory;
  onPress: () => void;
};

export function CategoryCard({category, onPress}: CategoryCardProps) {
  const pixelIconName = getPixelIconNameForEmoji(category.icon);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        {pixelIconName ? (
          <PixelIcon name={pixelIconName} size={34} />
        ) : (
          <Text style={styles.icon}>{category.icon}</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{category.title}</Text>
        <Text style={styles.description}>{category.description ?? ''}</Text>
        <Text style={styles.meta}>{category.roomLabel}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.hero,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.card,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  icon: {
    fontSize: 30,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: colors.brandMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
