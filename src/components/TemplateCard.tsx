import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {Template} from '../types';

type TemplateCardProps = {
  template: Template;
  onPress: () => void;
};

export function TemplateCard({template, onPress}: TemplateCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{template.icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{template.title}</Text>
        <Text style={styles.category}>{template.category}</Text>
        <Text style={styles.description}>{template.description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffaf5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eadccd',
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#ffe4d6',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '700',
  },
  category: {
    color: '#b05f3c',
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: '#5f5047',
    fontSize: 14,
    lineHeight: 20,
  },
});
