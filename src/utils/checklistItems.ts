import type {Checklist, ChecklistItem} from '../types';

export type ChecklistSectionGroup = {
  title: string;
  items: ChecklistItem[];
};

type CustomChecklistItemInput = {
  id: string;
  name: string;
  description: string;
};

export function groupChecklistItemsBySection(
  items: ChecklistItem[],
): ChecklistSectionGroup[] {
  const sections = new Map<string, ChecklistItem[]>();

  items.forEach(item => {
    const currentItems = sections.get(item.section) ?? [];
    currentItems.push(item);
    sections.set(item.section, currentItems);
  });

  return Array.from(sections.entries()).map(([title, sectionItems]) => ({
    title,
    items: sectionItems,
  }));
}

export function toggleChecklistItem(
  checklist: Checklist,
  itemId: string,
  updatedAt = new Date().toISOString(),
): Checklist {
  return {
    ...checklist,
    updatedAt,
    items: checklist.items.map(item =>
      item.id === itemId ? {...item, checked: !item.checked} : item,
    ),
  };
}

export function addCustomChecklistItem(
  checklist: Checklist,
  input: CustomChecklistItemInput,
  updatedAt = new Date().toISOString(),
): Checklist {
  const nextDescription = input.description.trim();
  const nextName = input.name.trim();

  return {
    ...checklist,
    updatedAt,
    items: [
      ...checklist.items,
      {
        id: input.id,
        name: nextName,
        section: '추가 항목',
        essential: false,
        tip: nextDescription || '직접 추가한 항목입니다.',
        checked: false,
        custom: true,
      },
    ],
  };
}

export function deleteChecklistItem(
  checklist: Checklist,
  itemId: string,
  updatedAt = new Date().toISOString(),
): Checklist {
  const targetItem = checklist.items.find(item => item.id === itemId);

  if (!targetItem || targetItem.essential) {
    return checklist;
  }

  return {
    ...checklist,
    updatedAt,
    items: checklist.items.filter(item => item.id !== itemId),
  };
}
