import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, radii, spacing} from '../../theme/tokens';

export type MyPageTab = 'checklists' | 'rooms';

type MyPageTabsProps = {
  activeTab: MyPageTab;
  onChangeTab: (tab: MyPageTab) => void;
};

export function MyPageTabs({activeTab, onChangeTab}: MyPageTabsProps) {
  const {t} = useTranslation('myPage');
  const tabs: Array<{
    id: MyPageTab;
    label: string;
    accessibilityLabel: string;
  }> = [
    {
      id: 'checklists',
      label: t('checklistsTab'),
      accessibilityLabel: t('checklistsTabAccessibility'),
    },
    {
      id: 'rooms',
      label: t('roomsTab'),
      accessibilityLabel: t('roomsTabAccessibility'),
    },
  ];

  return (
    <View style={styles.tabList}>
      {tabs.map(tab => (
        <Pressable
          key={tab.id}
          accessibilityLabel={tab.accessibilityLabel}
          onPress={() => onChangeTab(tab.id)}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}>
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
            ]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabList: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  activeTab: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  tabText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  activeTabText: {
    color: colors.text,
  },
});
