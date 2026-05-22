import {colors, radii, spacing} from '../src/theme/tokens';

test('defines the agreed Orchid Gold color system', () => {
  expect(colors.brand).toBe('#8f4dd8');
  expect(colors.action).toBe('#ffcf3f');
  expect(colors.actionText).toBe('#251b2d');
  expect(colors.text).toBe('#251b2d');
  expect(colors.background).toBe('#fbf7ff');
  expect(colors.surface).toBe('#ffffff');
  expect(colors.border).toBe('#eadff2');
});

test('defines reusable shape and spacing tokens', () => {
  expect(radii.bubble).toBe(17);
  expect(radii.card).toBe(18);
  expect(spacing.screen).toBe(20);
});
