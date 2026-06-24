import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import type {AuthUser, Checklist, RemoteChecklistSummary} from '@/types';

import MyPage from './page';

const mockState = vi.hoisted(() => ({
  listAccountChecklists: vi.fn(),
  loading: false,
  restoreChecklistFromAccount: vi.fn(),
  routerPush: vi.fn(),
  saveChecklistRestoredFromAccount: vi.fn(),
  signOut: vi.fn(),
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
    loading: mockState.loading,
    signOut: mockState.signOut,
  }),
}));

vi.mock('@/services/checklistAccount', () => ({
  listAccountChecklists: mockState.listAccountChecklists,
  restoreChecklistFromAccount: mockState.restoreChecklistFromAccount,
}));

vi.mock('@/lib/storage/checklists', () => ({
  saveChecklistRestoredFromAccount: mockState.saveChecklistRestoredFromAccount,
}));

const authUser: AuthUser = {
  id: 'user-1',
  email: 'fan@example.com',
  nickname: 'Fan',
};

const remoteSummary: RemoteChecklistSummary = {
  remoteId: 'remote-1',
  localId: 'local-1',
  categoryId: 'EVENT_DAY',
  templateId: 'concert_basic',
  title: 'Concert checklist',
  selectedConditions: ['rain'],
  createdAt: '2026-06-24T00:00:00.000Z',
  updatedAt: '2026-06-24T01:00:00.000Z',
};

const restoredChecklist: Checklist = {
  id: 'local-1',
  remoteId: 'remote-1',
  ownerId: authUser.id,
  templateId: 'concert_basic',
  categoryId: 'EVENT_DAY',
  title: 'Concert checklist',
  icon: '🎤',
  theme: 'orchid_gold',
  selectedConditions: ['rain'],
  createdAt: '2026-06-24T00:00:00.000Z',
  updatedAt: '2026-06-24T01:00:00.000Z',
  saveState: 'synced',
  items: [],
};

describe('MyPage', () => {
  beforeEach(() => {
    mockState.listAccountChecklists.mockReset();
    mockState.loading = false;
    mockState.restoreChecklistFromAccount.mockReset();
    mockState.routerPush.mockReset();
    mockState.saveChecklistRestoredFromAccount.mockReset();
    mockState.signOut.mockReset();
    mockState.user = null;
  });

  it('shows a login link when signed out', () => {
    render(<MyPage />);

    expect(screen.getByRole('link', {name: /로그인/})).toHaveAttribute(
      'href',
      '/auth?redirect=myPage',
    );
  });

  it('lists account checklists for signed-in users', async () => {
    mockState.user = authUser;
    mockState.listAccountChecklists.mockResolvedValue([remoteSummary]);

    render(<MyPage />);

    expect(mockState.listAccountChecklists).toHaveBeenCalledWith(authUser);
    expect(await screen.findByText('Concert checklist')).toBeInTheDocument();
    expect(screen.getByText('fan@example.com')).toBeInTheDocument();
    expect(screen.getByText('저장된 항목 1개')).toBeInTheDocument();
  });

  it('signs out from the my page', async () => {
    mockState.user = authUser;
    mockState.listAccountChecklists.mockResolvedValue([]);

    render(<MyPage />);

    fireEvent.click(await screen.findByRole('button', {name: '로그아웃'}));

    expect(mockState.signOut).toHaveBeenCalledTimes(1);
  });

  it('restores a remote checklist locally and opens it', async () => {
    mockState.user = authUser;
    mockState.listAccountChecklists.mockResolvedValue([remoteSummary]);
    mockState.restoreChecklistFromAccount.mockResolvedValue(restoredChecklist);

    render(<MyPage />);

    fireEvent.click(await screen.findByRole('button', {name: '열기'}));

    await waitFor(() => {
      expect(mockState.restoreChecklistFromAccount).toHaveBeenCalledWith(
        'remote-1',
        authUser,
      );
    });
    expect(mockState.saveChecklistRestoredFromAccount).toHaveBeenCalledWith(
      restoredChecklist,
    );
    expect(mockState.routerPush).toHaveBeenCalledWith('/checklists/local-1');
  });
});
