import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AuthProvider, useAuth} from './AuthProvider';

vi.mock('@/lib/supabase/config', () => ({
  isSupabaseConfigured: false,
}));

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => null,
}));

const PREVIEW_USER_KEY = '@onreori/previewUser';

function Probe() {
  const {user, signIn, signOut} = useAuth();

  return (
    <div>
      <span>{user?.email ?? 'signed-out'}</span>
      <button onClick={() => signIn('fan@example.com', 'password')}>
        sign in
      </button>
      <button onClick={() => signOut()}>sign out</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores preview sign in when Supabase env is missing', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'sign in'}));
    expect(await screen.findByText('fan@example.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'sign out'}));
    await waitFor(() =>
      expect(screen.getByText('signed-out')).toBeInTheDocument(),
    );
  });

  it('loads a stored preview user on mount', async () => {
    localStorage.setItem(
      PREVIEW_USER_KEY,
      JSON.stringify({
        id: 'preview-stored@example.com',
        email: 'stored@example.com',
        nickname: 'stored',
      }),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('stored@example.com')).toBeInTheDocument();
  });

  it('clears malformed preview storage on mount', async () => {
    localStorage.setItem(PREVIEW_USER_KEY, '{malformed');

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    expect(localStorage.getItem(PREVIEW_USER_KEY)).toBeNull();
  });
});
