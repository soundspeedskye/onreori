import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type StickerPickerModalProps = {
  visible: boolean;
  options: string[];
  onClose: () => void;
  onSelect: (emoji: string) => void;
  onClear: () => void;
};

export function StickerPickerModal({
  visible,
  options,
  onClose,
  onSelect,
  onClear,
}: StickerPickerModalProps) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>스티커 고르기</Text>
          <ScrollView contentContainerStyle={styles.grid}>
            {options.map(option => (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={styles.option}>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable onPress={onClear} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>지우기</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(36, 27, 22, 0.38)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fffaf5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
    maxHeight: '58%',
    padding: 20,
  },
  title: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#eadccd',
    borderRadius: 18,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  optionText: {
    fontSize: 30,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#efe2d5',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#5c4940',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
