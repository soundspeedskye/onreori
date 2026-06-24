import type {TFunction} from 'i18next';

import {i18n} from '../i18n';
import type {Checklist, ChecklistItem} from '../types';
import {getLocalizedChecklistItem} from './checklistTemplateTranslations';

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
  options: {templateId?: string; t?: TFunction} = {},
): ChecklistSectionGroup[] {
  const sections = new Map<string, ChecklistItem[]>();

  items.forEach(item => {
    const displayItem =
      options.templateId && options.t
        ? getLocalizedChecklistItem({templateId: options.templateId}, item, options.t)
        : item;
    const currentItems = sections.get(displayItem.section) ?? [];
    currentItems.push(displayItem);
    sections.set(displayItem.section, currentItems);
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
        section: i18n.t('customSection', {ns: 'checklist'}),
        essential: false,
        tip: nextDescription || i18n.t('customTip', {ns: 'checklist'}),
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
