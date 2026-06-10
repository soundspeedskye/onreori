import React from 'react';
import {StyleSheet, View} from 'react-native';

import {spacing} from '../../theme/tokens';
import {Button} from '../ui/Button';
import {TextField} from '../ui/TextField';

type HashtagFilterBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

export function HashtagFilterBar({
  value,
  onChange,
  onClear,
}: HashtagFilterBarProps) {
  return (
    <View style={styles.filterBar}>
      <TextField
        onChangeText={onChange}
        placeholder="카페명 또는 #태그 검색"
        style={styles.filterInput}
        value={value}
      />
      {value.trim() ? (
        <Button
          onPress={onClear}
          style={styles.clearFilterButton}
          title="해제"
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  filterInput: {
    flex: 1,
  },
  clearFilterButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
