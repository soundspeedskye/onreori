import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {useTranslation} from 'react-i18next';

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
  const {t} = useTranslation('checklist');

  return (
    <Card style={styles.addCard}>
      <Text style={styles.sectionTitle}>{t('addItemTitle')}</Text>
      <View style={styles.addFields}>
        <TextField
          onChangeText={onNameChange}
          placeholder={t('itemPlaceholder')}
          value={name}
        />
        <TextField
          multiline
          onChangeText={onDescriptionChange}
          placeholder={t('descriptionPlaceholder')}
          style={styles.descriptionInput}
          value={description}
        />
        <Button
          onPress={onAdd}
          style={styles.addButton}
          textStyle={styles.addButtonText}
          title={t('addItem')}
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
