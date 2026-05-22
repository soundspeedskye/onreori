import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {ShareCardScreen} from '../src/screens/ShareCardScreen';
import {getChecklistById} from '../src/storage/checklists';
import type {Checklist} from '../src/types';

jest.mock('../src/storage/checklists', () => ({
  getChecklistById: jest.fn(),
  saveChecklist: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({children}: {children: React.ReactNode}) => children,
}));

const mockGetChecklistById = getChecklistById as jest.MockedFunction<
  typeof getChecklistById
>;

function makeChecklist(): Checklist {
  return {
    id: 'checklist-1',
    templateId: 'concert_basic',
    categoryId: 'concert',
    title: '콘서트 체크리스트',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: [],
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
    saveState: 'draft',
    items: [
      {
        id: 'ticket',
        name: '티켓',
        section: '입장',
        essential: true,
        tip: '',
        when: [],
        checked: true,
        custom: false,
      },
    ],
  };
}

function collectText(node: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  if (typeof node === 'string') {
    return [node];
  }

  if (!node || typeof node !== 'object') {
    return [];
  }

  const children = (node as {children?: unknown[]}).children ?? [];
  return children.flatMap(collectText);
}

test('share card does not render sticker controls', async () => {
  mockGetChecklistById.mockResolvedValue(makeChecklist());

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ShareCardScreen
        route={{key: 'ShareCard', name: 'ShareCard', params: {checklistId: 'checklist-1'}}}
        navigation={{} as never}
      />,
    );
  });

  const renderedText = collectText(renderer!.toJSON()).join(' ');

  expect(renderedText).not.toContain('꾸미기 안내');
  expect(renderedText).not.toContain('스티커');
  expect(renderedText).not.toContain('+');
});
