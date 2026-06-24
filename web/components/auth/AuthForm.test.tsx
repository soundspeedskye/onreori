import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {AuthForm} from './AuthForm';

const authMocks = vi.hoisted(() => ({
  serverConfigured: true,
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: () => ({
    serverConfigured: authMocks.serverConfigured,
    signIn: authMocks.signIn,
    signUp: authMocks.signUp,
  }),
}));

describe('AuthForm', () => {
  beforeEach(() => {
    authMocks.serverConfigured = true;
    authMocks.signIn.mockReset();
    authMocks.signUp.mockReset();
  });

  it('uses a section heading for the form title', () => {
    render(<AuthForm onSuccess={vi.fn()} />);

    expect(
      screen.getByRole('heading', {level: 2, name: '로그인'}),
    ).toBeInTheDocument();
  });

  it('shows a preview mode notice when Supabase is not configured', () => {
    authMocks.serverConfigured = false;

    render(<AuthForm onSuccess={vi.fn()} />);

    expect(screen.getByText('미리보기 모드로 로그인합니다.')).toBeInTheDocument();
  });

  it('submits sign in credentials and calls onSuccess', async () => {
    authMocks.signIn.mockResolvedValue({
      id: 'user-1',
      email: 'fan@example.com',
      nickname: 'fan',
    });
    const onSuccess = vi.fn();

    render(<AuthForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: {value: 'fan@example.com'},
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: {value: 'password'},
    });
    fireEvent.click(screen.getByRole('button', {name: '로그인'}));

    await waitFor(() =>
      expect(authMocks.signIn).toHaveBeenCalledWith(
        'fan@example.com',
        'password',
      ),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('switches to sign up mode and submits a nickname', async () => {
    authMocks.signUp.mockResolvedValue({
      id: 'user-2',
      email: 'fan@example.com',
      nickname: 'fanclub',
    });
    const onSuccess = vi.fn();

    render(<AuthForm onSuccess={onSuccess} />);

    fireEvent.click(
      screen.getByRole('button', {name: '회원가입으로 전환'}),
    );
    fireEvent.change(screen.getByLabelText('닉네임'), {
      target: {value: 'fanclub'},
    });
    fireEvent.change(screen.getByLabelText('이메일'), {
      target: {value: 'fan@example.com'},
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: {value: 'password'},
    });
    fireEvent.click(screen.getByRole('button', {name: '회원가입'}));

    await waitFor(() =>
      expect(authMocks.signUp).toHaveBeenCalledWith(
        'fan@example.com',
        'password',
        'fanclub',
      ),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
