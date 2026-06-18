import React from 'react';
import { StyleSheet } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { colors } from '../../theme/tokens';
import { Button } from './Button';

describe('Button', () => {
  it('renders brand variant with brand purple background', () => {
    let component: renderer.ReactTestRenderer | undefined;

    act(() => {
      component = renderer.create(
        <Button title="브랜드 버튼" variant={'brand' as never} />,
      );
    });

    const button = component!.toJSON() as renderer.ReactTestRendererJSON;
    const label = button.children?.[0] as renderer.ReactTestRendererJSON;

    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      backgroundColor: colors.brandMuted,
    });
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({
      color: colors.textInverse,
    });
  });
});
