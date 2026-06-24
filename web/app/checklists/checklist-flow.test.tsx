import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import type {AuthUser, Checklist} from '@/types';

import {
  ChecklistClient,
  getAccountSaveHref,
  getShareHref,
} from './[checklistId]/page';

const mockState = vi.hoisted(() => ({
  routerPush: vi.fn(),
  saveChecklistToAccount: vi.fn(),
  user: null as AuthUser | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockState.routerPush,
  }),
}));

vi.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockState.user,
    loading: false,
    serverConfigured: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('@/services/checklistAccount', () => ({
  saveChecklistToAccount: mockState.saveChecklistToAccount,
}));

const user = {
  async click(element: HTMLElement) {
    fireEvent.click(element);
  },
};

const authUser: AuthUser = {
  id: 'user-1',
  email: 'fan@example.com',
  nickname: 'Fan',
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {promise, reject, resolve};
}

function createChecklist(overrides: Partial<Checklist> = {}): Checklist {
  return {
    id: 'checklist-flow',
    templateId: 'concert_basic',
    categoryId: 'EVENT_DAY',
    title: 'Concert checklist',
    icon: '🎤',
    theme: 'orchid_gold',
    selectedConditions: [],
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    saveState: 'draft',
    items: [
      {
        id: 'ticket',
        sourceItemId: 'ticket',
        name: 'Ticket',
        section: '필수',
        essential: true,
        tip: 'Bring the ticket.',
        checked: false,
        custom: false,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  mockState.routerPush.mockReset();
  mockState.saveChecklistToAccount.mockReset();
  mockState.saveChecklistToAccount.mockResolvedValue({
    ownerId: authUser.id,
    remoteId: 'remote-1',
  });
  mockState.user = null;
});

describe('checklist flow', () => {
  it('toggles an item and updates the completed count', async () => {
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([createChecklist()]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    expect(await screen.findByText(/0\/1 완료/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', {name: /Ticket/}));
    expect(await screen.findByText(/1\/1 완료/)).toBeInTheDocument();
  });

  it('uses the planned account save and share routes', () => {
    expect(getAccountSaveHref('checklist-flow')).toBe(
      '/auth?redirect=accountSave&checklistId=checklist-flow',
    );
    expect(getShareHref('checklist-flow')).toBe('/share/checklist-flow');
  });

  it('saves a draft and redirects to auth when saving to account as a guest', async () => {
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([createChecklist({saveState: 'localOnly'})]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    await user.click(await screen.findByRole('button', {name: '내 계정에 저장'}));

    await waitFor(() => {
      expect(mockState.routerPush).toHaveBeenCalledWith(
        '/auth?redirect=accountSave&checklistId=checklist-flow',
      );
    });
    expect(
      JSON.parse(window.localStorage.getItem('onreori.checklists') ?? '[]')[0],
    ).toMatchObject({id: 'checklist-flow', saveState: 'draft'});
    expect(window.localStorage.getItem('onreori.pendingAccountSaveChecklistId')).toBe(
      'checklist-flow',
    );
  });

  it('saves the current checklist to the signed-in account', async () => {
    mockState.user = authUser;
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([createChecklist({saveState: 'localOnly'})]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    await user.click(await screen.findByRole('button', {name: '내 계정에 저장'}));

    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledWith(
        expect.objectContaining({id: 'checklist-flow'}),
        authUser,
      );
    });
    expect(
      JSON.parse(window.localStorage.getItem('onreori.checklists') ?? '[]')[0],
    ).toMatchObject({
      id: 'checklist-flow',
      ownerId: authUser.id,
      remoteId: 'remote-1',
      saveState: 'synced',
    });
    expect(await screen.findByText('계정에 저장됨')).toBeInTheDocument();
  });

  it('syncs newer edits made while the first account save is pending', async () => {
    const firstSync = createDeferred<{ownerId: string; remoteId: string}>();
    const secondSync = createDeferred<{ownerId: string; remoteId: string}>();
    mockState.saveChecklistToAccount
      .mockReturnValueOnce(firstSync.promise)
      .mockReturnValueOnce(secondSync.promise);
    mockState.user = authUser;
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([createChecklist({saveState: 'localOnly'})]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    const saveToAccountButton = await screen.findByRole('button', {
      name: '내 계정에 저장',
    });
    await user.click(saveToAccountButton);
    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledTimes(1);
    });
    expect(saveToAccountButton).toBeDisabled();
    await user.click(saveToAccountButton);
    expect(mockState.saveChecklistToAccount).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('아이템 이름'), {
      target: {value: 'VIP badge'},
    });
    await user.click(screen.getByRole('button', {name: '추가'}));

    await waitFor(() => {
      expect(screen.getByText('VIP badge')).toBeInTheDocument();
    });
    expect(mockState.saveChecklistToAccount).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstSync.resolve({ownerId: authUser.id, remoteId: 'remote-1'});
      await firstSync.promise;
    });
    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledTimes(2);
    });

    expect(mockState.saveChecklistToAccount).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'checklist-flow',
        remoteId: 'remote-1',
        items: expect.arrayContaining([
          expect.objectContaining({id: 'ticket'}),
          expect.objectContaining({name: 'VIP badge'}),
        ]),
      }),
      authUser,
    );

    await act(async () => {
      secondSync.resolve({ownerId: authUser.id, remoteId: 'remote-1'});
      await secondSync.promise;
    });

    const storedChecklist = JSON.parse(
      window.localStorage.getItem('onreori.checklists') ?? '[]',
    )[0] as Checklist;
    expect(storedChecklist).toMatchObject({
      remoteId: 'remote-1',
      saveState: 'synced',
    });
    expect(storedChecklist.items).toEqual(
      expect.arrayContaining([expect.objectContaining({name: 'VIP badge'})]),
    );
  });

  it('consumes the pending account save after auth redirects back', async () => {
    mockState.user = authUser;
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([createChecklist({saveState: 'draft'})]),
    );
    window.localStorage.setItem(
      'onreori.pendingAccountSaveChecklistId',
      'checklist-flow',
    );

    render(<ChecklistClient checklistId="checklist-flow" saveToAccount />);

    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledWith(
        expect.objectContaining({id: 'checklist-flow'}),
        authUser,
      );
    });
    expect(
      window.localStorage.getItem('onreori.pendingAccountSaveChecklistId'),
    ).toBeNull();
  });

  it('syncs a previously synced checklist after a local edit', async () => {
    mockState.user = authUser;
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([
        createChecklist({
          ownerId: authUser.id,
          remoteId: 'remote-1',
          saveState: 'synced',
        }),
      ]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    await user.click(await screen.findByRole('checkbox', {name: /Ticket/}));

    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'checklist-flow',
          remoteId: 'remote-1',
          items: [expect.objectContaining({id: 'ticket', checked: true})],
        }),
        authUser,
      );
    });
  });

  it('retries account sync for a failed remote checklist after a local edit', async () => {
    mockState.user = authUser;
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([
        createChecklist({
          ownerId: authUser.id,
          remoteId: 'remote-failed',
          saveState: 'syncFailed',
        }),
      ]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    await user.click(await screen.findByRole('checkbox', {name: /Ticket/}));

    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'checklist-flow',
          remoteId: 'remote-failed',
          saveState: 'syncFailed',
          items: [expect.objectContaining({id: 'ticket', checked: true})],
        }),
        authUser,
      );
    });
  });

  it('queues auto-sync RPCs so remote writes follow local mutation order', async () => {
    const firstSync = createDeferred<{ownerId: string; remoteId: string}>();
    const secondSync = createDeferred<{ownerId: string; remoteId: string}>();
    mockState.saveChecklistToAccount
      .mockReturnValueOnce(firstSync.promise)
      .mockReturnValueOnce(secondSync.promise);
    mockState.user = authUser;
    window.localStorage.setItem(
      'onreori.checklists',
      JSON.stringify([
        createChecklist({
          ownerId: authUser.id,
          remoteId: 'remote-1',
          saveState: 'synced',
        }),
      ]),
    );

    render(<ChecklistClient checklistId="checklist-flow" />);

    await user.click(await screen.findByRole('checkbox', {name: /Ticket/}));
    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('아이템 이름'), {
      target: {value: 'VIP badge'},
    });
    await user.click(screen.getByRole('button', {name: '추가'}));

    await waitFor(() => {
      expect(screen.getByText('VIP badge')).toBeInTheDocument();
      expect(
        JSON.parse(window.localStorage.getItem('onreori.checklists') ?? '[]')[0]
          .items,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({name: 'VIP badge'}),
        ]),
      );
    });
    expect(mockState.saveChecklistToAccount).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstSync.resolve({ownerId: authUser.id, remoteId: 'remote-1'});
      await firstSync.promise;
    });
    await waitFor(() => {
      expect(mockState.saveChecklistToAccount).toHaveBeenCalledTimes(2);
    });

    expect(mockState.saveChecklistToAccount).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'checklist-flow',
        remoteId: 'remote-1',
        items: expect.arrayContaining([
          expect.objectContaining({id: 'ticket', checked: true}),
          expect.objectContaining({name: 'VIP badge'}),
        ]),
      }),
      authUser,
    );

    await act(async () => {
      secondSync.resolve({ownerId: authUser.id, remoteId: 'remote-1'});
      await secondSync.promise;
    });

    const storedChecklist = JSON.parse(
      window.localStorage.getItem('onreori.checklists') ?? '[]',
    )[0] as Checklist;
    expect(storedChecklist.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({id: 'ticket', checked: true}),
        expect.objectContaining({name: 'VIP badge'}),
      ]),
    );
    expect(screen.getByText('VIP badge')).toBeInTheDocument();
  });
});
