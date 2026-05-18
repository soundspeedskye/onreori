import {isSupabaseConfigured, supabase} from '../config/supabase';
import type {AuthUser, Checklist} from '../types';

type RemoteChecklistReference = {
  remoteId: string;
  ownerId: string;
};

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

  const {data: savedChecklist, error: checklistError} = await supabase
    .from('checklists')
    .insert({
      user_id: user.id,
      local_id: checklist.id,
      category_id: checklist.categoryId,
      template_id: checklist.templateId,
      title: checklist.title,
      selected_conditions: checklist.selectedConditions,
    })
    .select('id')
    .single();

  if (checklistError || !savedChecklist) {
    throw new Error(checklistError?.message ?? '체크리스트 저장에 실패했습니다.');
  }

  const itemRows = checklist.items.map((item, index) => ({
    checklist_id: savedChecklist.id,
    local_id: item.id,
    name: item.name,
    section: item.section,
    essential: item.essential,
    tip: item.tip,
    checked: item.checked,
    custom: item.custom,
    sort_order: index,
  }));

  if (itemRows.length > 0) {
    const {error: itemsError} = await supabase
      .from('checklist_items')
      .insert(itemRows);

    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  return {
    ownerId: user.id,
    remoteId: savedChecklist.id as string,
  };
}
