import {beforeEach, describe, expect, it, vi} from 'vitest';

import {ALERT_MESSAGES} from '@/constants/alertMessages';
import type {AuthUser, Checklist} from '@/types';

type MockSupabaseClient = {
  rpc: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
};

const user: AuthUser = {
  id: 'user-1',
  email: 'fan@example.com',
  nickname: 'Fan',
};

function createChecklist(overrides: Partial<Checklist> = {}): Checklist {
  return {
    id: 'checklist-1',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: ['rain'],
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    saveState: 'draft',
    items: [
      {
        id: 'item-1',
        sourceItemId: 'ticket',
        name: 'Ticket',
        section: 'Essentials',
        essential: true,
        tip: 'Bring the ticket.',
        checked: false,
        custom: false,
      },
    ],
    ...overrides,
  };
}

async function loadService({
  client,
  configured = true,
}: {
  client: MockSupabaseClient | null;
  configured?: boolean;
}) {
  vi.resetModules();
  vi.doMock('@/lib/supabase/config', () => ({
    isSupabaseConfigured: configured,
  }));
  vi.doMock('@/lib/supabase/browser', () => ({
    createBrowserSupabaseClient: vi.fn(() => client),
  }));

  return import('./checklistAccount');
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('saveChecklistToAccount', () => {
  it('calls the account save RPC with checklist and item rows', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {id: 'remote-1', user_id: user.id, local_id: 'checklist-1'},
      error: null,
    });
    const client = {rpc, from: vi.fn()};
    const {saveChecklistToAccount} = await loadService({client});
    const checklist = createChecklist();

    await expect(saveChecklistToAccount(checklist, user)).resolves.toEqual({
      ownerId: user.id,
      remoteId: 'remote-1',
    });
    expect(rpc).toHaveBeenCalledWith('upsert_checklist_with_items', {
      input_remote_id: null,
      input_local_id: checklist.id,
      input_category_id: checklist.categoryId,
      input_template_id: checklist.templateId,
      input_title: checklist.title,
      input_selected_conditions: checklist.selectedConditions,
      input_items: [
        {
          local_id: 'item-1',
          name: 'Ticket',
          section: 'Essentials',
          essential: true,
          tip: 'Bring the ticket.',
          checked: false,
          custom: false,
          sort_order: 0,
        },
      ],
    });
  });

  it('passes the current remote id when updating an already synced checklist', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {id: 'remote-existing'},
      error: null,
    });
    const client = {rpc, from: vi.fn()};
    const {saveChecklistToAccount} = await loadService({client});

    await saveChecklistToAccount(
      createChecklist({remoteId: 'remote-existing'}),
      user,
    );

    expect(rpc).toHaveBeenCalledWith(
      'upsert_checklist_with_items',
      expect.objectContaining({input_remote_id: 'remote-existing'}),
    );
  });

  it('returns a preview remote reference when Supabase is not configured', async () => {
    const {saveChecklistToAccount} = await loadService({
      client: null,
      configured: false,
    });

    await expect(
      saveChecklistToAccount(createChecklist(), user),
    ).resolves.toEqual({
      ownerId: user.id,
      remoteId: 'preview-checklist-1',
    });
  });
});

describe('listAccountChecklists', () => {
  it('maps account checklist rows into remote summaries', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'remote-1',
          user_id: user.id,
          local_id: 'checklist-1',
          category_id: 'EVENT_DAY',
          template_id: 'concert_basic',
          title: 'Concert checklist',
          selected_conditions: ['rain'],
          created_at: '2026-06-24T00:00:00.000Z',
          updated_at: '2026-06-24T00:05:00.000Z',
        },
      ],
      error: null,
    });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order,
    };
    const client = {rpc: vi.fn(), from: vi.fn(() => query)};
    const {listAccountChecklists} = await loadService({client});

    await expect(listAccountChecklists(user)).resolves.toEqual([
      {
        remoteId: 'remote-1',
        localId: 'checklist-1',
        categoryId: 'EVENT_DAY',
        templateId: 'concert_basic',
        title: 'Concert checklist',
        selectedConditions: ['rain'],
        createdAt: '2026-06-24T00:00:00.000Z',
        updatedAt: '2026-06-24T00:05:00.000Z',
      },
    ]);
    expect(client.from).toHaveBeenCalledWith('checklists');
    expect(query.eq).toHaveBeenCalledWith('user_id', user.id);
    expect(query.order).toHaveBeenCalledWith('updated_at', {
      ascending: false,
    });
  });

  it('returns an empty list when Supabase is not configured', async () => {
    const {listAccountChecklists} = await loadService({
      client: null,
      configured: false,
    });

    await expect(listAccountChecklists(user)).resolves.toEqual([]);
  });
});

describe('restoreChecklistFromAccount', () => {
  it('maps remote checklist and item rows back into a local synced checklist', async () => {
    const checklistQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'remote-1',
          user_id: user.id,
          local_id: 'checklist-1',
          category_id: 'EVENT_DAY',
          template_id: 'concert_basic',
          title: 'Concert checklist',
          selected_conditions: ['rain'],
          created_at: '2026-06-24T00:00:00.000Z',
          updated_at: '2026-06-24T00:05:00.000Z',
        },
        error: null,
      }),
    };
    const itemQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            local_id: 'item-1',
            name: 'Ticket',
            section: 'Essentials',
            essential: true,
            tip: 'Bring the ticket.',
            checked: true,
            custom: false,
            sort_order: 0,
          },
        ],
        error: null,
      }),
    };
    const client = {
      rpc: vi.fn(),
      from: vi.fn().mockReturnValueOnce(checklistQuery).mockReturnValueOnce(itemQuery),
    };
    const {restoreChecklistFromAccount} = await loadService({client});

    await expect(
      restoreChecklistFromAccount('remote-1', user),
    ).resolves.toMatchObject({
      id: 'checklist-1',
      remoteId: 'remote-1',
      ownerId: user.id,
      templateId: 'concert_basic',
      categoryId: 'EVENT_DAY',
      title: 'Concert checklist',
      selectedConditions: ['rain'],
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:05:00.000Z',
      saveState: 'synced',
      items: [
        {
          id: 'item-1',
          sourceItemId: 'item-1',
          name: 'Ticket',
          checked: true,
          custom: false,
        },
      ],
    });
    expect(itemQuery.eq).toHaveBeenCalledWith('checklist_id', 'remote-1');
    expect(itemQuery.order).toHaveBeenCalledWith('sort_order', {
      ascending: true,
    });
  });

  it('throws the Supabase-required message when restore is unavailable in preview mode', async () => {
    const {restoreChecklistFromAccount} = await loadService({
      client: null,
      configured: false,
    });

    await expect(
      restoreChecklistFromAccount('remote-1', user),
    ).rejects.toThrow(ALERT_MESSAGES.supabaseRequired);
  });
});
