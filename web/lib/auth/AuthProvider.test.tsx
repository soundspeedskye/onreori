import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

type AuthModule = typeof import('./AuthProvider');
type MockUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};
type MockSession = {
  user: MockUser;
};

const PREVIEW_USER_KEY = '@onreori/previewUser';

function createProbe(useAuth: AuthModule['useAuth']) {
  return function Probe() {
    const {serverConfigured, user, signIn, signOut} = useAuth();

    return (
      <div>
        <span>{serverConfigured ? 'configured' : 'preview'}</span>
        <span>{user?.email ?? 'signed-out'}</span>
        <button onClick={() => signIn('fan@example.com', 'password')}>
          sign in
        </button>
        <button onClick={() => signOut()}>sign out</button>
      </div>
    );
  };
}

function createConfiguredProbe(useAuth: AuthModule['useAuth']) {
  return function ConfiguredProbe() {
    const {user, signIn, signOut, signUp} = useAuth();

    return (
      <div>
        <span>{user?.email ?? 'signed-out'}</span>
        <button onClick={() => signIn(' fan@example.com ', 'password')}>
          sign in
        </button>
        <button
          onClick={() => signUp(' join@example.com ', 'password', ' Join Fan ')}
        >
          sign up
        </button>
        <button onClick={() => signOut()}>sign out</button>
      </div>
    );
  };
}

async function importPreviewAuthProvider(): Promise<AuthModule> {
  vi.resetModules();
  vi.doMock('@/lib/supabase/config', () => ({
    isSupabaseConfigured: false,
  }));
  vi.doMock('@/lib/supabase/browser', () => ({
    createBrowserSupabaseClient: () => null,
  }));

  return import('./AuthProvider');
}

function createMockSupabaseClient() {
  const authState = {
    callback: undefined as
      | ((event: string, session: MockSession | null) => void)
      | undefined,
  };
  const unsubscribe = vi.fn();
  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(
      (
        callback: (event: string, session: MockSession | null) => void,
      ) => {
        authState.callback = callback;

        return {
          data: {
            subscription: {
              unsubscribe,
            },
          },
        };
      },
    ),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  };

  return {
    auth,
    authState,
    client: {auth},
    unsubscribe,
  };
}

async function importConfiguredAuthProvider(
  supabase: ReturnType<typeof createMockSupabaseClient>,
): Promise<AuthModule> {
  vi.resetModules();
  vi.doMock('@/lib/supabase/config', () => ({
    isSupabaseConfigured: true,
  }));
  vi.doMock('@/lib/supabase/browser', () => ({
    createBrowserSupabaseClient: () => supabase.client,
  }));

  return import('./AuthProvider');
}

describe('AuthProvider preview mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.doUnmock('@/lib/supabase/config');
    vi.doUnmock('@/lib/supabase/browser');
    vi.resetModules();
  });

  it('stores preview sign in when Supabase env is missing', async () => {
    const {AuthProvider, useAuth} = await importPreviewAuthProvider();
    const Probe = createProbe(useAuth);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    expect(screen.getByText('preview')).toBeInTheDocument();
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
    const {AuthProvider, useAuth} = await importPreviewAuthProvider();
    const Probe = createProbe(useAuth);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('stored@example.com')).toBeInTheDocument();
  });

  it('clears malformed preview storage on mount', async () => {
    localStorage.setItem(PREVIEW_USER_KEY, '{malformed');
    const {AuthProvider, useAuth} = await importPreviewAuthProvider();
    const Probe = createProbe(useAuth);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    expect(localStorage.getItem(PREVIEW_USER_KEY)).toBeNull();
  });
});

describe('AuthProvider configured Supabase mode', () => {
  let supabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    localStorage.clear();
    supabase = createMockSupabaseClient();
    supabase.auth.getSession.mockResolvedValue({data: {session: null}});
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'signed-in-user',
          email: 'fan@example.com',
          user_metadata: {nickname: 'Fan'},
        },
      },
      error: null,
    });
    supabase.auth.signUp.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'signed-up-user',
            email: 'join@example.com',
            user_metadata: {nickname: 'Join Fan'},
          },
        },
        user: {
          id: 'signed-up-user',
          email: 'join@example.com',
          user_metadata: {nickname: 'Join Fan'},
        },
      },
      error: null,
    });
    supabase.auth.signOut.mockResolvedValue({error: null});
  });

  afterEach(() => {
    localStorage.clear();
    vi.doUnmock('@/lib/supabase/config');
    vi.doUnmock('@/lib/supabase/browser');
    vi.resetModules();
  });

  it('loads the current Supabase session and unsubscribes on cleanup', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'session-user',
            email: 'session@example.com',
            user_metadata: {nickname: 'Session Fan'},
          },
        },
      },
    });
    const {AuthProvider, useAuth} =
      await importConfiguredAuthProvider(supabase);
    const Probe = createProbe(useAuth);

    const {unmount} = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('session@example.com')).toBeInTheDocument();
    expect(screen.getByText('configured')).toBeInTheDocument();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);

    unmount();

    expect(supabase.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('updates the user from Supabase auth state changes', async () => {
    const {AuthProvider, useAuth} =
      await importConfiguredAuthProvider(supabase);
    const Probe = createProbe(useAuth);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    await waitFor(() =>
      expect(supabase.authState.callback).toEqual(expect.any(Function)),
    );

    act(() => {
      supabase.authState.callback?.('SIGNED_IN', {
        user: {
          id: 'event-user',
          email: 'event@example.com',
          user_metadata: {nickname: 'Event Fan'},
        },
      });
    });

    expect(await screen.findByText('event@example.com')).toBeInTheDocument();

    act(() => {
      supabase.authState.callback?.('SIGNED_OUT', null);
    });

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
  });

  it('calls Supabase sign in, sign up, and sign out methods', async () => {
    const {AuthProvider, useAuth} =
      await importConfiguredAuthProvider(supabase);
    const ConfiguredProbe = createConfiguredProbe(useAuth);

    render(
      <AuthProvider>
        <ConfiguredProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'sign in'}));
    expect(await screen.findByText('fan@example.com')).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'fan@example.com',
      password: 'password',
    });

    fireEvent.click(screen.getByRole('button', {name: 'sign up'}));
    expect(await screen.findByText('join@example.com')).toBeInTheDocument();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'join@example.com',
      password: 'password',
      options: {
        data: {nickname: 'Join Fan'},
      },
    });

    fireEvent.click(screen.getByRole('button', {name: 'sign out'}));
    await waitFor(() =>
      expect(screen.getByText('signed-out')).toBeInTheDocument(),
    );
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
