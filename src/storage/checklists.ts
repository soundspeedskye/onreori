import AsyncStorage from '@react-native-async-storage/async-storage';

import type {Checklist} from '../types';

const STORAGE_KEY = '@onreori/checklists';
const PENDING_ACCOUNT_SAVE_KEY = '@onreori/pendingAccountSaveChecklistId';

async function readChecklists(): Promise<Checklist[]> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as Checklist[];
  } catch {
    return [];
  }
}

async function writeChecklists(checklists: Checklist[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
}

async function upsertChecklist(checklist: Checklist): Promise<void> {
  const checklists = await readChecklists();
  const existingIndex = checklists.findIndex(item => item.id === checklist.id);

  if (existingIndex >= 0) {
    checklists[existingIndex] = checklist;
  } else {
    checklists.unshift(checklist);
  }

  await writeChecklists(checklists);
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

export async function saveChecklistLocalOnly(
  checklist: Checklist,
): Promise<Checklist> {
  const nextChecklist: Checklist = {
    ...checklist,
    saveState: 'localOnly',
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
