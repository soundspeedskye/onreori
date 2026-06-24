'use client';

import {useRouter, useSearchParams} from 'next/navigation';
import {useCallback} from 'react';

import {AuthForm} from '@/components/auth/AuthForm';

export function getSuccessPath(searchParams: URLSearchParams): string {
  const redirect = searchParams.get('redirect');

  if (redirect === 'accountSave') {
    const checklistId = searchParams.get('checklistId');

    if (checklistId) {
      return `/checklists/${encodeURIComponent(checklistId)}?saveToAccount=1`;
    }
  }

  if (redirect === 'myPage') {
    return '/my';
  }

  return '/categories';
}

export function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSuccess = useCallback(() => {
    router.replace(getSuccessPath(searchParams));
  }, [router, searchParams]);

  return (
    <main className="screen auth-screen">
      <div className="auth-screen__header">
        <p>ONREORI ACCOUNT</p>
        <h1>준비한 체크리스트를 계속 이어가요</h1>
      </div>
      <AuthForm onSuccess={handleSuccess} />
    </main>
  );
}
