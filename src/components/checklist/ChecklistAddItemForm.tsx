import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextField } from '../ui/TextField';

type ChecklistAddItemFormProps = {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAdd: () => void;
};

export function ChecklistAddItemForm({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onAdd,
}: ChecklistAddItemFormProps) {
  return (
    <Card style={styles.addCard}>
      <Text style={styles.sectionTitle}>아이템 추가</Text>
      <View style={styles.addFields}>
        <TextField
          onChangeText={onNameChange}
          placeholder="아이템"
          value={name}
        />
        <TextField
          multiline
          onChangeText={onDescriptionChange}
          placeholder="설명"
          style={styles.descriptionInput}
          value={description}
        />
        <Button
          onPress={onAdd}
          style={styles.addButton}
          textStyle={styles.addButtonText}
          title="추가"
          variant="dark"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  addCard: {
    gap: spacing.md,
  },
  addFields: {
    gap: spacing.sm,
  },
  descriptionInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  addButton: {
    borderRadius: radii.button,
    minHeight: 0,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
