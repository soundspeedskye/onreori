import type {TFunction} from 'i18next';

import {conditions, getTemplateById} from '../data/templates';
import type {
  Checklist,
  ChecklistItem,
  ConditionId,
  Template,
  TemplateCondition,
  TemplateItem,
} from '../types';

function translateString(
  t: TFunction,
  key: string,
  defaultValue: string,
): string {
  const translatedValue = t(key, {defaultValue});

  return typeof translatedValue === 'string' ? translatedValue : defaultValue;
}

function getTemplateItemTranslationKey(
  templateId: string,
  itemId: string,
  field: 'name' | 'section' | 'tip',
) {
  return `templates.${templateId}.items.${itemId}.${field}`;
}

export function getLocalizedTemplateTitle(
  templateId: string,
  fallbackTitle: string,
  t: TFunction,
): string {
  return translateString(t, `templates.${templateId}.title`, fallbackTitle);
}

export function getLocalizedTemplate(
  template: Template,
  t: TFunction,
): Template {
  return {
    ...template,
    title: getLocalizedTemplateTitle(template.id, template.title, t),
    description: translateString(
      t,
      `templates.${template.id}.description`,
      template.description,
    ),
    items: template.items.map(item =>
      getLocalizedTemplateItem(template.id, item, t),
    ),
  };
}

export function getLocalizedTemplateItem(
  templateId: string,
  item: TemplateItem,
  t: TFunction,
): TemplateItem {
  return {
    ...item,
    name: translateString(
      t,
      getTemplateItemTranslationKey(templateId, item.id, 'name'),
      item.name,
    ),
    section: translateString(
      t,
      getTemplateItemTranslationKey(templateId, item.id, 'section'),
      item.section,
    ),
    tip: translateString(
      t,
      getTemplateItemTranslationKey(templateId, item.id, 'tip'),
      item.tip,
    ),
  };
}

export function getLocalizedCondition(
  condition: TemplateCondition,
  t: TFunction,
): TemplateCondition {
  return {
    ...condition,
    label: translateString(
      t,
      `conditions.${condition.id}.label`,
      condition.label,
    ),
    description: translateString(
      t,
      `conditions.${condition.id}.description`,
      condition.description,
    ),
  };
}

export function getLocalizedChecklistTitle(
  checklist: Checklist,
  t: TFunction,
): string {
  const template = getTemplateById(checklist.templateId);
  const fallbackTitle = template?.title ?? checklist.title;

  return getLocalizedTemplateTitle(checklist.templateId, fallbackTitle, t);
}

export function getLocalizedChecklistItem(
  checklist: Pick<Checklist, 'templateId'>,
  item: ChecklistItem,
  t: TFunction,
): ChecklistItem {
  if (item.custom) {
    return item;
  }

  const sourceItemId = item.sourceItemId ?? item.id;

  return {
    ...item,
    name: translateString(
      t,
      getTemplateItemTranslationKey(checklist.templateId, sourceItemId, 'name'),
      item.name,
    ),
    section: translateString(
      t,
      getTemplateItemTranslationKey(
        checklist.templateId,
        sourceItemId,
        'section',
      ),
      item.section,
    ),
    tip: translateString(
      t,
      getTemplateItemTranslationKey(checklist.templateId, sourceItemId, 'tip'),
      item.tip,
    ),
  };
}

export function getLocalizedChecklist(
  checklist: Checklist,
  t: TFunction,
): Checklist {
  return {
    ...checklist,
    title: getLocalizedChecklistTitle(checklist, t),
    items: checklist.items.map(item =>
      getLocalizedChecklistItem(checklist, item, t),
    ),
  };
}

export function getSelectedConditionLabels(
  selectedConditions: ConditionId[],
  t: TFunction,
): string[] {
  return conditions
    .filter(condition => selectedConditions.includes(condition.id))
    .map(condition => getLocalizedCondition(condition, t).label);
}
