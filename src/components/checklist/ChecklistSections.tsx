import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, spacing} from '../../theme/tokens';
import type {ChecklistSectionGroup} from '../../utils/checklistItems';
import {ChecklistItemRow} from './ChecklistItemRow';

type ChecklistSectionsProps = {
  sections: ChecklistSectionGroup[];
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
};

export function ChecklistSections({
  sections,
  onToggleItem,
  onDeleteItem,
}: ChecklistSectionsProps) {
  return (
    <>
      {sections.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionList}>
            {section.items.map(item => (
              <ChecklistItemRow
                canDelete={!item.essential}
                key={item.id}
                item={item}
                onDeleteItem={onDeleteItem}
                onToggleItem={onToggleItem}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionList: {
    gap: spacing.sm,
  },
});
