import {createElement} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Card} from './Card';

describe('Card', () => {
  it('forwards props to actionable cards', () => {
    render(
      createElement(
        Card,
        {
          'aria-label': 'Open details',
          asButton: true,
          disabled: true,
          id: 'action-card',
        },
        'Details',
      ),
    );

    expect(
      screen.getByRole('button', {name: 'Open details'}),
    ).toHaveAttribute('id', 'action-card');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
