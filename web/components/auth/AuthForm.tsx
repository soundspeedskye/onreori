'use client';

import {useState, type FormEvent} from 'react';

import {ALERT_MESSAGES} from '@/constants/alertMessages';
import {useAuth} from '@/lib/auth/AuthProvider';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {TextField} from '@/components/ui/TextField';

type AuthFormMode = 'signIn' | 'signUp';

type AuthFormProps = {
  onSuccess: () => void;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ALERT_MESSAGES.failed;
}

export function AuthForm({onSuccess}: AuthFormProps) {
  const {signIn, signUp} = useAuth();
  const [mode, setMode] = useState<AuthFormMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signUp';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(email, password, nickname);
      } else {
        await signIn(email, password);
      }

      onSuccess();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleModeSwitch() {
    setMode(isSignUp ? 'signIn' : 'signUp');
    setErrorMessage('');
  }

  return (
    <Card className="auth-card">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__heading">
          <h1>{isSignUp ? '계정 만들기' : '로그인'}</h1>
          <p>
            {isSignUp
              ? '체크리스트를 계정에 저장할 수 있어요.'
              : '저장한 체크리스트와 MY 페이지를 이어서 볼 수 있어요.'}
          </p>
        </div>

        <div className="auth-form__fields">
          {isSignUp ? (
            <label className="auth-form__field">
              <span>닉네임</span>
              <TextField
                autoComplete="nickname"
                onChange={event => setNickname(event.target.value)}
                placeholder="팬덤에서 쓰는 이름"
                value={nickname}
              />
            </label>
          ) : null}

          <label className="auth-form__field">
            <span>이메일</span>
            <TextField
              autoComplete="email"
              inputMode="email"
              onChange={event => setEmail(event.target.value)}
              placeholder="fan@example.com"
              type="email"
              value={email}
            />
          </label>

          <label className="auth-form__field">
            <span>비밀번호</span>
            <TextField
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              onChange={event => setPassword(event.target.value)}
              placeholder="비밀번호"
              type="password"
              value={password}
            />
          </label>
        </div>

        <div aria-live="polite" className="auth-form__error">
          {errorMessage}
        </div>

        <div className="auth-form__actions">
          <Button loading={submitting} type="submit" variant="brand">
            {isSignUp ? '회원가입' : '로그인'}
          </Button>
          <Button
            disabled={submitting}
            onClick={handleModeSwitch}
            type="button"
            variant="ghost"
          >
            {isSignUp ? '로그인으로 전환' : '회원가입으로 전환'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
