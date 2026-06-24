'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useState} from 'react';

import {ALERT_MESSAGES} from '@/constants/alertMessages';
import {useAuth} from '@/lib/auth/AuthProvider';
import {saveChecklistRestoredFromAccount} from '@/lib/storage/checklists';
import {
  listAccountChecklists,
  restoreChecklistFromAccount,
} from '@/services/checklistAccount';
import type {RemoteChecklistSummary} from '@/types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '최근 저장';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function MyPage() {
  const {loading, user} = useAuth();
  const router = useRouter();
  const [checklists, setChecklists] = useState<RemoteChecklistSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadChecklists() {
      if (!user) {
        setChecklists([]);
        return;
      }

      setErrorMessage('');
      setListLoading(true);

      try {
        const remoteChecklists = await listAccountChecklists(user);

        if (active) {
          setChecklists(remoteChecklists);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error, ALERT_MESSAGES.loadFailed));
        }
      } finally {
        if (active) {
          setListLoading(false);
        }
      }
    }

    void loadChecklists();

    return () => {
      active = false;
    };
  }, [user]);

  const handleRestore = useCallback(
    async (remoteChecklistId: string) => {
      if (!user || restoringId) {
        return;
      }

      setErrorMessage('');
      setRestoringId(remoteChecklistId);

      try {
        const checklist = await restoreChecklistFromAccount(
          remoteChecklistId,
          user,
        );
        await saveChecklistRestoredFromAccount(checklist);
        router.push(`/checklists/${encodeURIComponent(checklist.id)}`);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, ALERT_MESSAGES.loadFailed));
      } finally {
        setRestoringId(null);
      }
    },
    [restoringId, router, user],
  );

  if (loading) {
    return (
      <main className="screen my-screen">
        <section className="ui-card ui-empty-state">
          <h1 className="ui-empty-state-title">계정을 확인 중</h1>
          <p className="ui-empty-state-description">
            저장된 체크리스트를 불러올 준비를 하고 있어요.
          </p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="screen my-screen">
        <header className="my-page-header">
          <p>MY</p>
          <h1>내 계정에 저장한 준비를 이어가요</h1>
        </header>
        <section className="ui-card my-guest-card">
          <div>
            <h2>로그인이 필요해요</h2>
            <p>계정에 저장한 체크리스트는 로그인 후 다시 열 수 있어요.</p>
          </div>
          <Link className="primary-link" href="/auth?redirect=myPage">
            로그인
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="screen my-screen">
      <header className="my-page-header">
        <p>MY</p>
        <h1>{user.nickname}님의 체크리스트</h1>
      </header>

      <section className="ui-card my-summary-card">
        <span className="ui-chip ui-chip-brand">계정 저장</span>
        <strong>저장된 항목 {checklists.length}개</strong>
      </section>

      {errorMessage ? <p className="my-error">{errorMessage}</p> : null}

      {listLoading ? (
        <section className="ui-card ui-empty-state">
          <h2 className="ui-empty-state-title">불러오는 중</h2>
          <p className="ui-empty-state-description">
            계정에 저장된 체크리스트를 확인하고 있어요.
          </p>
        </section>
      ) : null}

      {!listLoading && checklists.length === 0 ? (
        <section className="ui-card ui-empty-state">
          <h2 className="ui-empty-state-title">아직 저장된 항목이 없어요</h2>
          <p className="ui-empty-state-description">
            체크리스트 화면에서 내 계정에 저장하면 여기에 표시돼요.
          </p>
        </section>
      ) : null}

      <div className="my-checklist-list">
        {checklists.map(checklist => (
          <article className="ui-card my-checklist-card" key={checklist.remoteId}>
            <div className="my-checklist-card__copy">
              <h2>{checklist.title}</h2>
              <p>{formatUpdatedAt(checklist.updatedAt)} 저장</p>
            </div>
            <button
              className="my-checklist-card__button"
              disabled={restoringId !== null}
              onClick={() => void handleRestore(checklist.remoteId)}
              type="button"
            >
              {restoringId === checklist.remoteId ? '처리 중' : '열기'}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
