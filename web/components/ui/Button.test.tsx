import {createElement} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Button} from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(createElement(Button, null, 'Save'));
    expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
  });

  it('disables while loading', () => {
    render(createElement(Button, {loading: true}, 'Save'));
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('처리 중')).toBeInTheDocument();
  });
});
