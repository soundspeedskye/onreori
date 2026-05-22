import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  consumePendingAccountSaveChecklistId,
  getChecklistById,
  saveChecklistDraft,
  saveChecklistLocalOnly,
  saveChecklistSynced,
  setPendingAccountSaveChecklistId,
} from '../src/storage/checklists';
import type {Checklist} from '../src/types';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();

  return {
    __store: store,
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

const storageStore = AsyncStorage as unknown as {
  __store: Map<string, string>;
};

function makeChecklist(overrides: Partial<Checklist> = {}): Checklist {
  return {
    id: 'checklist-local-1',
    templateId: 'concert_basic',
    categoryId: 'concert',
    title: '콘서트/팬콘 기본 체크리스트',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: [],
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
    saveState: 'draft',
    items: [],
    ...overrides,
  };
}

beforeEach(() => {
  storageStore.__store.clear();
  jest.clearAllMocks();
});

test('saves an anonymous checklist as a draft before account save', async () => {
  await saveChecklistDraft(makeChecklist({saveState: 'localOnly'}));

  const storedChecklist = await getChecklistById('checklist-local-1');

  expect(storedChecklist?.saveState).toBe('draft');
  expect(storedChecklist?.remoteId).toBeUndefined();
  expect(storedChecklist?.ownerId).toBeUndefined();
});

test('marks a checklist as local-only when the user chooses local save', async () => {
  await saveChecklistLocalOnly(makeChecklist());

  const storedChecklist = await getChecklistById('checklist-local-1');

  expect(storedChecklist?.saveState).toBe('localOnly');
});

test('marks a checklist as synced after saving it to the user account', async () => {
  await saveChecklistSynced(makeChecklist(), {
    ownerId: 'user-1',
    remoteId: 'server-checklist-1',
  });

  const storedChecklist = await getChecklistById('checklist-local-1');

  expect(storedChecklist?.saveState).toBe('synced');
  expect(storedChecklist?.ownerId).toBe('user-1');
  expect(storedChecklist?.remoteId).toBe('server-checklist-1');
});

test('consumes the pending account-save checklist id after login', async () => {
  await setPendingAccountSaveChecklistId('checklist-local-1');

  await expect(consumePendingAccountSaveChecklistId()).resolves.toBe(
    'checklist-local-1',
  );
  await expect(consumePendingAccountSaveChecklistId()).resolves.toBeNull();
});
