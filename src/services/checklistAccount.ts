import {ALERT_MESSAGES} from '../constants/alertMessages';
import {isSupabaseConfigured, supabase} from '../config/supabase';
import {getTemplateById} from '../data/templates';
import type {
  AuthUser,
  Checklist,
  ChecklistItem,
  RemoteChecklistSummary,
} from '../types';

type RemoteChecklistReference = {
  remoteId: string;
  ownerId: string;
};

type ChecklistRow = {
  id: unknown;
  user_id: unknown;
  local_id: unknown;
  category_id: unknown;
  template_id: unknown;
  title: unknown;
  selected_conditions: unknown;
  created_at: unknown;
  updated_at: unknown;
};

type ChecklistItemRow = {
  local_id: unknown;
  name: unknown;
  section: unknown;
  essential: unknown;
  tip: unknown;
  checked: unknown;
  custom: unknown;
  sort_order?: unknown;
};

const CHECKLIST_SELECT =
  'id, user_id, local_id, category_id, template_id, title, selected_conditions, created_at, updated_at';
const CHECKLIST_ITEM_SELECT =
  'local_id, name, section, essential, tip, checked, custom, sort_order';

function selectedConditionsFromRow(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function mapChecklistSummary(row: ChecklistRow): RemoteChecklistSummary {
  return {
    remoteId: row.id as string,
    localId: row.local_id as string,
    categoryId: row.category_id as string,
    templateId: row.template_id as string,
    title: row.title as string,
    selectedConditions: selectedConditionsFromRow(row.selected_conditions),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapChecklistItemRow(row: ChecklistItemRow): ChecklistItem {
  const localId = row.local_id as string;

  return {
    id: localId,
    sourceItemId: localId,
    name: row.name as string,
    section: row.section as string,
    essential: Boolean(row.essential),
    tip: row.tip as string,
    checked: Boolean(row.checked),
    custom: Boolean(row.custom),
  };
}

function mapRemoteChecklistToLocal(
  checklistRow: ChecklistRow,
  itemRows: ChecklistItemRow[],
): Checklist {
  const template = getTemplateById(checklistRow.template_id as string);

  return {
    id: checklistRow.local_id as string,
    remoteId: checklistRow.id as string,
    ownerId: checklistRow.user_id as string,
    templateId: checklistRow.template_id as string,
    categoryId: checklistRow.category_id as string,
    title: checklistRow.title as string,
    icon: template?.icon ?? '✅',
    theme: template?.theme ?? 'orchid_gold',
    selectedConditions: selectedConditionsFromRow(
      checklistRow.selected_conditions,
    ),
    createdAt: checklistRow.created_at as string,
    updatedAt: checklistRow.updated_at as string,
    saveState: 'synced',
    items: itemRows.map(mapChecklistItemRow),
  };
}

export async function saveChecklistToAccount(
  checklist: Checklist,
  user: AuthUser,
): Promise<RemoteChecklistReference> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ownerId: user.id,
      remoteId: `preview-${checklist.id}`,
    };
  }

  const itemRows = checklist.items.map((item, index) => ({
    local_id: item.id,
    name: item.name,
    section: item.section,
    essential: item.essential,
    tip: item.tip,
    checked: item.checked,
    custom: item.custom,
    sort_order: index,
  }));

  const {data, error} = await supabase.rpc('upsert_checklist_with_items', {
    input_remote_id: checklist.remoteId ?? null,
    input_local_id: checklist.id,
    input_category_id: checklist.categoryId,
    input_template_id: checklist.templateId,
    input_title: checklist.title,
    input_selected_conditions: checklist.selectedConditions,
    input_items: itemRows,
  });

  if (error || !data) {
    throw new Error(error?.message ?? ALERT_MESSAGES.saveFailed);
  }

  return {
    ownerId: user.id,
    remoteId: (data as {id: string}).id,
  };
}

export async function listAccountChecklists(
  user: AuthUser,
): Promise<RemoteChecklistSummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const {data, error} = await supabase
    .from('checklists')
    .select(CHECKLIST_SELECT)
    .eq('user_id', user.id)
    .order('updated_at', {ascending: false});

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ChecklistRow[]).map(mapChecklistSummary);
}

export async function restoreChecklistFromAccount(
  remoteChecklistId: string,
  user: AuthUser,
): Promise<Checklist> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 설정이 필요합니다.');
  }

  const {data: checklistRow, error: checklistError} = await supabase
    .from('checklists')
    .select(CHECKLIST_SELECT)
    .eq('id', remoteChecklistId)
    .eq('user_id', user.id)
    .single();

  if (checklistError || !checklistRow) {
    throw new Error(
      checklistError?.message ?? ALERT_MESSAGES.loadFailed,
    );
  }

  const {data: itemRows, error: itemsError} = await supabase
    .from('checklist_items')
    .select(CHECKLIST_ITEM_SELECT)
    .eq('checklist_id', remoteChecklistId)
    .order('sort_order', {ascending: true});

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return mapRemoteChecklistToLocal(
    checklistRow as ChecklistRow,
    (itemRows ?? []) as ChecklistItemRow[],
  );
}
