import type {
  Checklist,
  ConditionId,
  Template,
} from '../types';
import {createLocalId} from '../utils/localId';
import templatesDocument from './templates.v1.json';

export const conditions = templatesDocument.conditions;
const templates = templatesDocument.templates;

export function getTemplateById(templateId: string): Template | undefined {
  return templates.find(template => template.id === templateId);
}

export function createChecklistFromTemplate(
  template: Template,
  selectedConditions: ConditionId[],
): Checklist {
  const now = new Date().toISOString();

  return {
    id: createLocalId('checklist'),
    templateId: template.id,
    categoryId: template.category,
    title: template.title,
    icon: template.icon,
    theme: template.theme,
    selectedConditions,
    createdAt: now,
    updatedAt: now,
    saveState: 'draft',
    items: template.items.map(item => ({
      ...item,
      checked: false,
      custom: false,
      sourceItemId: item.id,
    })),
  };
}
