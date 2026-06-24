import {describe, expect, it} from 'vitest';
import type {TFunction} from 'i18next';
import type {Checklist} from '@/types';
import {
  addCustomChecklistItem,
  deleteChecklistItem,
  groupChecklistItemsBySection,
  toggleChecklistItem,
} from './checklistItems';

function createChecklist(): Checklist {
  return {
    id: 'checklist-1',
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
        tip: '',
        checked: false,
        custom: false,
      },
    ],
  };
}

const fallbackT = ((key: string, options?: {defaultValue?: string}) =>
  options?.defaultValue ?? key) as TFunction;

describe('checklist item utilities', () => {
  it('toggles an item checked state', () => {
    const checklist = createChecklist();
    const nextChecklist = toggleChecklistItem(checklist, 'ticket');
    expect(nextChecklist.items[0].checked).toBe(true);
    expect(nextChecklist.updatedAt).not.toBe(checklist.updatedAt);
  });

  it('adds a custom item to the custom section', () => {
    const checklist = createChecklist();
    const nextChecklist = addCustomChecklistItem(checklist, {
      id: 'custom-1',
      name: 'Portable charger',
      description: 'Charge before leaving',
    });
    expect(nextChecklist.items).toHaveLength(2);
    expect(nextChecklist.items[1]).toMatchObject({
      id: 'custom-1',
      name: 'Portable charger',
      custom: true,
    });
  });

  it('does not delete template items and deletes custom items', () => {
    const checklist = addCustomChecklistItem(createChecklist(), {
      id: 'custom-1',
      name: 'Portable charger',
      description: '',
    });
    expect(deleteChecklistItem(checklist, 'ticket')).toBe(checklist);
    expect(deleteChecklistItem(checklist, 'custom-1').items).toHaveLength(1);
  });

  it('groups checklist items by section', () => {
    const grouped = groupChecklistItemsBySection(createChecklist().items, {
      templateId: 'concert_basic',
      t: fallbackT,
    });
    expect(grouped[0].title).toBe('필수');
    expect(grouped[0].items).toHaveLength(1);
  });
});
