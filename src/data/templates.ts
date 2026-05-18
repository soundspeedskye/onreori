import type {
  Checklist,
  ConditionId,
  StickerSlotKey,
  Template,
  TemplatesDocument,
} from '../types';

const templatesDocument = require('../../data/templates.v1.json') as TemplatesDocument;

const emptyStickers: Record<StickerSlotKey, string | null> = {
  topLeft: null,
  topRight: null,
  bottomLeft: null,
  bottomRight: null,
};

export const conditions = templatesDocument.conditions;
export const templates = templatesDocument.templates;

export function getTemplateById(templateId: string): Template | undefined {
  return templates.find(template => template.id === templateId);
}

export function getTemplateByCategory(categoryId: string): Template | undefined {
  return templates.find(template => template.category === categoryId);
}

export function createChecklistFromTemplate(
  template: Template,
  selectedConditions: ConditionId[],
): Checklist {
  const now = new Date().toISOString();

  return {
    id: `checklist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id,
    categoryId: template.category,
    title: template.title,
    icon: template.icon,
    theme: template.theme,
    selectedConditions,
    createdAt: now,
    updatedAt: now,
    saveState: 'draft',
    items: template.items
      .filter(
        item =>
          item.when.length === 0 ||
          item.when.some(conditionId => selectedConditions.includes(conditionId)),
      )
      .map(item => ({
        ...item,
        checked: false,
        custom: false,
        sourceItemId: item.id,
      })),
    stickers: {...emptyStickers},
  };
}
