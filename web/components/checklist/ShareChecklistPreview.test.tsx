import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import type {Checklist} from '@/types';

import {ShareChecklistPreview} from './ShareChecklistPreview';

function createChecklist(): Checklist {
  return {
    id: 'checklist-share',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: ['rain'],
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    saveState: 'localOnly',
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

describe('ShareChecklistPreview', () => {
  it('renders the title, progress, and checklist item', () => {
    render(
      <ShareChecklistPreview
        checkedCount={0}
        checklist={createChecklist()}
        selectedConditionLabels={['비 예보']}
        totalCount={1}
      />,
    );

    expect(screen.getByText('Concert checklist')).toBeInTheDocument();
    expect(screen.getByText('0/1 완료')).toBeInTheDocument();
    expect(screen.getByText('Ticket')).toBeInTheDocument();
  });
});
