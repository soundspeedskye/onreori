import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';

import type {Checklist} from '@/types';

import {ChecklistClient} from './[checklistId]/page';

const user = {
  async click(element: HTMLElement) {
    fireEvent.click(element);
  },
};

function createChecklist(): Checklist {
  return {
    id: 'checklist-flow',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: [],
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    saveState: 'draft',
    items: [
      {
        id: 'ticket',
        sourceItemId: 'ticket',
        name: 'Ticket',
        section: '필수',
        essential: true,
        tip: 'Bring the ticket.',
        checked: false,
        custom: false,
      },
    ],
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('checklist flow', () => {
  it('toggles an item and updates the completed count', async () => {
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([createChecklist()]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    expect(await screen.findByText(/0\/1 완료/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', {name: /Ticket/}));
    expect(await screen.findByText(/1\/1 완료/)).toBeInTheDocument();
  });
});
