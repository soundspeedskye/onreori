import React from 'react';
import {TextInput} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import {ChecklistScreen} from '../src/screens/ChecklistScreen';
import {getChecklistById, saveChecklist} from '../src/storage/checklists';
import type {Checklist} from '../src/types';

jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({user: null}),
}));

jest.mock('../src/services/checklistAccount', () => ({
  saveChecklistToAccount: jest.fn(),
}));

jest.mock('../src/storage/checklists', () => ({
  getChecklistById: jest.fn(),
  saveChecklist: jest.fn(() => Promise.resolve()),
  saveChecklistDraft: jest.fn(),
  saveChecklistLocalOnly: jest.fn(),
  saveChecklistSynced: jest.fn(),
  setPendingAccountSaveChecklistId: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({children}: {children: React.ReactNode}) => children,
}));

const mockGetChecklistById = getChecklistById as jest.MockedFunction<
  typeof getChecklistById
>;
const mockSaveChecklist = saveChecklist as jest.MockedFunction<
  typeof saveChecklist
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
        tip: '모바일 티켓과 신분증을 같이 확인하세요.',
        when: [],
        checked: false,
        custom: false,
      },
      {
        id: 'water',
        name: '물',
        section: '대기',
        essential: false,
        tip: '대기 시간이 길면 작은 물을 챙기세요.',
        when: [],
        checked: false,
        custom: false,
      },
    ],
  };
}

async function renderChecklistScreen() {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ChecklistScreen
        route={{key: 'Checklist', name: 'Checklist', params: {checklistId: 'checklist-1'}}}
        navigation={{navigate: jest.fn()} as never}
      />,
    );
  });

  return renderer!;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(1234);
  mockGetChecklistById.mockResolvedValue(makeChecklist());
  mockSaveChecklist.mockResolvedValue();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('does not show a delete button for an essential checklist item', async () => {
  const renderer = await renderChecklistScreen();

  expect(() => {
    renderer.root.findByProps({accessibilityLabel: '티켓 삭제'});
  }).toThrow();
});

test('deletes a non-essential default checklist item from its card', async () => {
  const renderer = await renderChecklistScreen();

  await ReactTestRenderer.act(async () => {
    renderer.root
      .findByProps({accessibilityLabel: '물 삭제'})
      .props.onPress();
  });

  expect(mockSaveChecklist).toHaveBeenCalledWith(
    expect.objectContaining({
      items: [expect.objectContaining({id: 'ticket'})],
    }),
  );
});

test('adds a custom item with the entered name and description', async () => {
  const renderer = await renderChecklistScreen();
  const inputs = renderer.root.findAllByType(TextInput);

  await ReactTestRenderer.act(async () => {
    inputs
      .find(input => input.props.placeholder === 'item')
      ?.props.onChangeText('응원봉 배터리');
    inputs
      .find(input => input.props.placeholder === 'description')
      ?.props.onChangeText('여분 배터리와 충전 상태를 확인해요.');
  });

  await ReactTestRenderer.act(async () => {
    renderer.root.findByProps({title: '추가'}).props.onPress();
  });

  expect(mockSaveChecklist).toHaveBeenCalledWith(
    expect.objectContaining({
      items: [
        expect.objectContaining({id: 'ticket'}),
        expect.objectContaining({id: 'water'}),
        expect.objectContaining({
          id: 'custom-1234',
          name: '응원봉 배터리',
          tip: '여분 배터리와 충전 상태를 확인해요.',
          custom: true,
        }),
      ],
    }),
  );
});
