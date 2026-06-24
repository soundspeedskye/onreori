import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {Checklist} from '@/types';

import {SharePageClient} from './[checklistId]/SharePageClient';

const mockState = vi.hoisted(() => ({
  toPng: vi.fn(),
}));

vi.mock('html-to-image', () => ({
  toPng: mockState.toPng,
}));

function createChecklist(): Checklist {
  return {
    id: 'checklist-share',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: [],
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

describe('SharePageClient', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockState.toPng.mockReset();
    mockState.toPng.mockResolvedValue('data:image/png;base64,share-card');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a stored checklist and exports the preview as PNG', async () => {
    const clickedDownloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function clickDownload(this: HTMLAnchorElement) {
        clickedDownloads.push(this.download);
      },
    );
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([createChecklist()]),
    );

    render(<SharePageClient checklistId="checklist-share" />);

    expect(await screen.findByText('Concert checklist')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'PNG 다운로드'}));

    await waitFor(() => {
      expect(mockState.toPng).toHaveBeenCalledTimes(1);
    });
    expect(clickedDownloads).toEqual(['onreori-share-card.png']);
  });
});
