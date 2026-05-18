import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

type StickerSlotProps = {
  value: string | null;
  onPress: () => void;
  positionStyle: object;
};

export function StickerSlot({value, onPress, positionStyle}: StickerSlotProps) {
  return (
    <Pressable onPress={onPress} style={[styles.slot, positionStyle]}>
      <Text style={styles.value}>{value ?? '+'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#eadccd',
    borderRadius: 18,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 46,
  },
  value: {
    fontSize: 24,
  },
});
