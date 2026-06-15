import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type PixelRole = 'k' | 'bg' | 'p' | 'l' | 'd';
type PixelRect = readonly [PixelRole, number, number, number, number];

export type PixelIconName =
  | 'bag'
  | 'chat'
  | 'checkOff'
  | 'checkOn'
  | 'coffee'
  | 'heart'
  | 'mic'
  | 'ticket';

type PixelIconProps = {
  name: PixelIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type PixelIconForEmojiProps = {
  emoji: string | undefined;
  fallbackTextStyle?: StyleProp<TextStyle>;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const GRID_SIZE = 16;

const iconRects: Record<PixelIconName, readonly PixelRect[]> = {
  ticket: [
    ['k', 2, 3, 12, 10],
    ['bg', 3, 4, 10, 8],
    ['p', 4, 5, 2, 2],
    ['p', 7, 5, 5, 1],
    ['p', 7, 7, 4, 1],
    ['l', 4, 9, 7, 1],
    ['k', 2, 6, 1, 2],
    ['k', 13, 6, 1, 2],
    ['k', 5, 4, 1, 8],
  ],
  coffee: [
    ['k', 3, 5, 9, 7],
    ['bg', 4, 6, 7, 5],
    ['p', 5, 7, 5, 3],
    ['l', 5, 6, 5, 1],
    ['k', 11, 7, 3, 3],
    ['bg', 12, 8, 1, 1],
    ['d', 4, 11, 8, 1],
    ['p', 5, 2, 1, 2],
    ['p', 8, 1, 1, 3],
    ['p', 11, 2, 1, 2],
  ],
  bag: [
    ['k', 4, 5, 9, 9],
    ['bg', 5, 6, 7, 7],
    ['p', 5, 8, 7, 4],
    ['l', 6, 6, 5, 2],
    ['k', 6, 3, 5, 4],
    ['bg', 7, 4, 3, 3],
    ['d', 5, 12, 7, 1],
  ],
  mic: [
    ['k', 6, 2, 5, 8],
    ['p', 7, 3, 3, 6],
    ['l', 8, 3, 1, 5],
    ['k', 4, 7, 2, 3],
    ['k', 11, 7, 2, 3],
    ['k', 7, 10, 3, 3],
    ['k', 5, 13, 7, 1],
    ['d', 7, 9, 3, 1],
  ],
  chat: [
    ['k', 3, 4, 10, 7],
    ['bg', 4, 5, 8, 5],
    ['p', 5, 6, 6, 2],
    ['l', 5, 8, 4, 1],
    ['k', 6, 10, 2, 3],
    ['p', 7, 10, 3, 1],
  ],
  heart: [
    ['k', 4, 3, 3, 2],
    ['k', 9, 3, 3, 2],
    ['k', 3, 5, 10, 4],
    ['k', 5, 9, 6, 2],
    ['k', 7, 11, 2, 2],
    ['p', 5, 4, 2, 1],
    ['p', 9, 4, 2, 1],
    ['p', 4, 5, 8, 3],
    ['p', 6, 8, 4, 2],
    ['p', 8, 10, 1, 1],
    ['l', 5, 5, 2, 1],
  ],
  checkOn: [
    ['k', 3, 3, 10, 10],
    ['bg', 4, 4, 8, 8],
    ['p', 5, 8, 2, 2],
    ['p', 7, 9, 2, 2],
    ['p', 9, 6, 2, 3],
    ['p', 11, 5, 1, 2],
  ],
  checkOff: [
    ['k', 3, 3, 10, 10],
    ['bg', 4, 4, 8, 8],
  ],
};

const iconPalettes: Record<
  PixelIconName,
  Record<PixelRole, string>
> = {
  ticket: {
    k: '#251b2d',
    bg: '#ffffff',
    p: '#ffcf3f',
    l: '#fff3c5',
    d: '#d89613',
  },
  coffee: {
    k: '#251b2d',
    bg: '#ffffff',
    p: '#c98a52',
    l: '#f6d8b8',
    d: '#7a4b30',
  },
  bag: {
    k: '#251b2d',
    bg: '#ffffff',
    p: '#ff7eb6',
    l: '#ffd1e5',
    d: '#bc3f7d',
  },
  mic: {
    k: '#251b2d',
    bg: '#ffffff',
    p: '#8f4dd8',
    l: '#d9b7ff',
    d: '#61308f',
  },
  chat: {
    k: '#251b2d',
    bg: '#ffffff',
    p: '#76e4ff',
    l: '#d9f8ff',
    d: '#2a8eae',
  },
  heart: {
    k: '#251b2d',
    bg: '#ffffff',
    p: '#ff6fae',
    l: '#ffd1e5',
    d: '#a93a72',
  },
  checkOn: {
    k: '#251b2d',
    bg: '#ffffff',
    p: '#22a86b',
    l: '#d8f8e7',
    d: '#0c6846',
  },
  checkOff: {
    k: '#bcaec8',
    bg: '#ffffff',
    p: '#bcaec8',
    l: '#ffffff',
    d: '#8a7d94',
  },
};

const emojiIconMap: Record<string, PixelIconName> = {
  '🎟️': 'ticket',
  '🎟': 'ticket',
  '☕': 'coffee',
  '🛍️': 'bag',
  '🛍': 'bag',
  '🎤': 'mic',
  '💬': 'chat',
  '💗': 'heart',
  '✅': 'checkOn',
  '☑︎': 'checkOn',
  '☑': 'checkOn',
  '☐': 'checkOff',
};

export function getPixelIconNameForEmoji(
  emoji: string | undefined,
): PixelIconName | undefined {
  if (!emoji) {
    return undefined;
  }

  return emojiIconMap[emoji];
}

export function getPixelIconRects(name: PixelIconName): readonly PixelRect[] {
  return iconRects[name];
}

export function PixelIcon({
  name,
  size = 32,
  style,
  testID = 'pixel-icon',
}: PixelIconProps) {
  const unit = size / GRID_SIZE;
  const palette = iconPalettes[name];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      pointerEvents="none"
      style={[styles.root, {height: size, width: size}, style]}
      testID={testID}>
      {iconRects[name].map(([role, x, y, width, height], index) => (
        <View
          key={`${role}-${x}-${y}-${width}-${height}-${index}`}
          style={[
            styles.block,
            {
              backgroundColor: palette[role],
              height: height * unit,
              left: x * unit,
              top: y * unit,
              width: width * unit,
            },
          ]}
          testID="pixel-icon-block"
        />
      ))}
    </View>
  );
}

export function PixelIconForEmoji({
  emoji,
  fallbackTextStyle,
  size = 32,
  style,
  testID = 'pixel-icon',
}: PixelIconForEmojiProps) {
  const iconName = getPixelIconNameForEmoji(emoji);

  if (iconName) {
    return <PixelIcon name={iconName} size={size} style={style} testID={testID} />;
  }

  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={fallbackTextStyle}
      testID={testID}>
      {emoji ?? ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  block: {
    position: 'absolute',
  },
});
