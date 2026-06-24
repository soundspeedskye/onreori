import {describe, expect, it} from 'vitest';

import {getSuccessPath} from './AuthPageClient';

function successPath(query: string) {
  return getSuccessPath(new URLSearchParams(query));
}

describe('getSuccessPath', () => {
  it('maps account save redirect with checklist id', () => {
    expect(successPath('redirect=accountSave&checklistId=checklist-123')).toBe(
      '/checklists/checklist-123?saveToAccount=1',
    );
  });

  it('maps my page redirect', () => {
    expect(successPath('redirect=myPage')).toBe('/my');
  });

  it('falls back when account save is missing checklist id', () => {
    expect(successPath('redirect=accountSave')).toBe('/categories');
  });

  it('falls back when redirect is missing', () => {
    expect(successPath('')).toBe('/categories');
  });
});
