import AsyncStorage from '@react-native-async-storage/async-storage';

import type {Checklist} from '../types';

const STORAGE_KEY = '@onreori/checklists';
const PENDING_ACCOUNT_SAVE_KEY = '@onreori/pendingAccountSaveChecklistId';
let checklistMutationQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getSaveState(value: unknown): Checklist['saveState'] {
  return value === 'draft' ||
    value === 'localOnly' ||
    value === 'deviceSaved' ||
    value === 'synced' ||
    value === 'syncFailed'
    ? value
    : 'localOnly';
}

function normalizeChecklistItem(
  value: unknown,
): Checklist['items'][number] | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const name = getString(value.name);
  const section = getString(value.section);

  if (!id || !name || !section) {
    return null;
  }

  return {
    id,
    sourceItemId: getString(value.sourceItemId),
    name,
    section,
    essential: Boolean(value.essential),
    tip: typeof value.tip === 'string' ? value.tip : '',
    checked: Boolean(value.checked),
    custom: Boolean(value.custom),
  };
}

function normalizeChecklist(value: unknown): Checklist | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const templateId = getString(value.templateId);
  const categoryId = getString(value.categoryId);
  const title = getString(value.title);
  const icon = getString(value.icon);
  const theme = getString(value.theme);
  const createdAt = getString(value.createdAt);
  const updatedAt = getString(value.updatedAt);

  if (
    !id ||
    !templateId ||
    !categoryId ||
    !title ||
    !icon ||
    !theme ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    remoteId: getString(value.remoteId),
    ownerId: getString(value.ownerId),
    templateId,
    categoryId,
    title,
    icon,
    theme,
    selectedConditions: getStringArray(value.selectedConditions),
    createdAt,
    updatedAt,
    saveState: getSaveState(value.saveState),
    items: Array.isArray(value.items)
      ? value.items.flatMap(item => {
          const normalizedItem = normalizeChecklistItem(item);

          return normalizedItem ? [normalizedItem] : [];
        })
      : [],
  };
}

async function readChecklists(): Promise<Checklist[]> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap(item => {
      const checklist = normalizeChecklist(item);

      return checklist ? [checklist] : [];
    });
  } catch {
    return [];
  }
}

async function writeChecklists(checklists: Checklist[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
}

async function enqueueChecklistMutation(
  mutate: (checklists: Checklist[]) => Checklist[],
): Promise<void> {
  const nextMutation = checklistMutationQueue
    .catch(() => undefined)
    .then(async () => {
      const checklists = await readChecklists();
      await writeChecklists(mutate(checklists));
    });

  checklistMutationQueue = nextMutation.catch(() => undefined);

  return nextMutation;
}

async function upsertChecklist(checklist: Checklist): Promise<void> {
  await enqueueChecklistMutation(checklists => {
    const existingIndex = checklists.findIndex(
      item => item.id === checklist.id,
    );

    if (existingIndex >= 0) {
      return checklists.map(item =>
        item.id === checklist.id ? checklist : item,
      );
    }

    return [checklist, ...checklists];
  });
}

async function upsertChecklistByRemoteId(checklist: Checklist): Promise<void> {
  await enqueueChecklistMutation(checklists => {
    const existingIndex = checklist.remoteId
      ? checklists.findIndex(item => item.remoteId === checklist.remoteId)
      : checklists.findIndex(item => item.id === checklist.id);

    if (existingIndex >= 0) {
      return checklists.map((item, index) =>
        index === existingIndex ? checklist : item,
      );
    }

    return [checklist, ...checklists];
  });
}

export async function getAllChecklists(): Promise<Checklist[]> {
  return readChecklists();
}

export async function getChecklistById(
  checklistId: string,
): Promise<Checklist | undefined> {
  const checklists = await readChecklists();
  return checklists.find(checklist => checklist.id === checklistId);
}

export async function saveChecklist(checklist: Checklist): Promise<void> {
  await upsertChecklist(checklist);
}

export async function saveChecklistDraft(
  checklist: Checklist,
): Promise<Checklist> {
  const nextChecklist: Checklist = {
    ...checklist,
    remoteId: undefined,
    ownerId: undefined,
    saveState: 'draft',
    updatedAt: new Date().toISOString(),
  };

  await upsertChecklist(nextChecklist);
  return nextChecklist;
}

export async function saveChecklistDeviceSaved(
  checklist: Checklist,
): Promise<Checklist> {
  const nextChecklist: Checklist = {
    ...checklist,
    saveState: 'deviceSaved',
    updatedAt: new Date().toISOString(),
  };

  await upsertChecklist(nextChecklist);
  return nextChecklist;
}

export async function saveChecklistSynced(
  checklist: Checklist,
  remoteReference: {ownerId: string; remoteId: string},
): Promise<Checklist> {
  const nextChecklist: Checklist = {
    ...checklist,
    ownerId: remoteReference.ownerId,
    remoteId: remoteReference.remoteId,
    saveState: 'synced',
    updatedAt: new Date().toISOString(),
  };

  await upsertChecklist(nextChecklist);
  return nextChecklist;
}

export async function saveChecklistSyncFailed(
  checklist: Checklist,
): Promise<Checklist> {
  const nextChecklist: Checklist = {
    ...checklist,
    saveState: 'syncFailed',
    updatedAt: new Date().toISOString(),
  };

  await upsertChecklist(nextChecklist);
  return nextChecklist;
}

export async function saveChecklistRestoredFromAccount(
  checklist: Checklist,
): Promise<void> {
  await upsertChecklistByRemoteId(checklist);
}

export async function setPendingAccountSaveChecklistId(
  checklistId: string,
): Promise<void> {
  await AsyncStorage.setItem(PENDING_ACCOUNT_SAVE_KEY, checklistId);
}

export async function consumePendingAccountSaveChecklistId(): Promise<
  string | null
> {
  const checklistId = await AsyncStorage.getItem(PENDING_ACCOUNT_SAVE_KEY);

  if (checklistId) {
    await AsyncStorage.removeItem(PENDING_ACCOUNT_SAVE_KEY);
  }

  return checklistId;
}
