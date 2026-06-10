import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radii, spacing} from '../../theme/tokens';

export type MyPageTab = 'checklists' | 'rooms';

type MyPageTabsProps = {
  activeTab: MyPageTab;
  onChangeTab: (tab: MyPageTab) => void;
};

const tabs: Array<{id: MyPageTab; label: string; accessibilityLabel: string}> = [
  {
    id: 'checklists',
    label: '내 체크리스트',
    accessibilityLabel: '내 체크리스트 탭',
  },
  {
    id: 'rooms',
    label: '내 단톡방',
    accessibilityLabel: '내 단톡방 탭',
  },
];

export function MyPageTabs({activeTab, onChangeTab}: MyPageTabsProps) {
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
