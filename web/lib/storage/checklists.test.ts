import {beforeEach, describe, expect, it} from 'vitest';
import type {Checklist} from '@/types';
import {
  consumePendingAccountSaveChecklistId,
  getAllChecklists,
  getChecklistById,
  saveChecklistDraft,
  saveChecklistSynced,
  setPendingAccountSaveChecklistId,
} from './checklists';

function checklist(): Checklist {
  return {
    id: 'checklist-1',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: ['rain'],
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    saveState: 'draft',
    items: [],
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('web checklist storage', () => {
  it('saves and reads a draft checklist', async () => {
    await saveChecklistDraft(checklist());
    expect(await getChecklistById('checklist-1')).toMatchObject({
      id: 'checklist-1',
      saveState: 'draft',
    });
    expect(await getAllChecklists()).toHaveLength(1);
  });

  it('records synced remote references', async () => {
    const draft = await saveChecklistDraft(checklist());
    const synced = await saveChecklistSynced(draft, {
      ownerId: 'user-1',
      remoteId: 'remote-1',
    });
    expect(synced.saveState).toBe('synced');
    expect((await getChecklistById('checklist-1'))?.remoteId).toBe('remote-1');
  });

  it('consumes pending account save once', async () => {
    await setPendingAccountSaveChecklistId('checklist-1');
    await expect(consumePendingAccountSaveChecklistId()).resolves.toBe(
      'checklist-1',
    );
    await expect(consumePendingAccountSaveChecklistId()).resolves.toBeNull();
  });
});
