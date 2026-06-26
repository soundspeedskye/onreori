import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {colors, radii, spacing} from '../../theme/tokens';
import {Button} from '../ui/Button';
import {TextField} from '../ui/TextField';

type ChatComposerProps = {
  body: string;
  sending: boolean;
  onBodyChange: (body: string) => void;
  onSendImage: () => void;
  onSendText: () => void;
};

export function ChatComposer({
  body,
  sending,
  onBodyChange,
  onSendImage,
  onSendText,
}: ChatComposerProps) {
  const {t} = useTranslation('rooms');
  const isSendDisabled = sending || body.trim().length === 0;
  const handleSubmitEditing = () => {
    if (isSendDisabled) {
      return;
    }

    onSendText();
  };

  return (
    <View style={styles.composer}>
      <Button
        disabled={sending}
        onPress={onSendImage}
        style={styles.photoButton}
        textStyle={styles.smallButtonText}
        title={t('photo')}
        variant="dark"
      />
      <TextField
        onChangeText={onBodyChange}
        onSubmitEditing={handleSubmitEditing}
        placeholder={t('composerPlaceholder')}
        returnKeyType="send"
        submitBehavior="submit"
        style={styles.input}
        value={body}
      />
      <Button
        disabled={isSendDisabled}
        onPress={onSendText}
        style={styles.sendButton}
        textStyle={styles.smallButtonText}
        title={sending ? '...' : t('send')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  photoButton: {
    borderRadius: radii.md,
    minHeight: 0,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    borderRadius: radii.md,
    minHeight: 0,
    minWidth: 52,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
