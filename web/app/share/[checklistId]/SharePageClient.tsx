'use client';

import {toPng} from 'html-to-image';
import {useEffect, useMemo, useRef, useState} from 'react';

import {ShareChecklistPreview} from '@/components/checklist/ShareChecklistPreview';
import {Button} from '@/components/ui/Button';
import {EmptyState} from '@/components/ui/EmptyState';
import {ALERT_MESSAGES} from '@/constants/alertMessages';
import {conditions} from '@/data/templates';
import {getChecklistById} from '@/lib/storage/checklists';
import type {Checklist} from '@/types';

type SharePageClientProps = {
  checklistId: string;
};

type ExportAction = 'download' | 'share';

const SHARE_CARD_FILENAME = 'onreori-share-card.png';

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isShareCancelError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /cancel|dismiss|abort/i.test(error.message)
  );
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], filename, {type: blob.type || 'image/png'});
}

function getShareMessage(
  checklist: Checklist,
  checkedCount: number,
  totalCount: number,
  selectedConditionLabels: string[],
): string {
  return [
    `${checklist.icon} ${checklist.title}`,
    `${checkedCount}/${totalCount} 완료`,
    selectedConditionLabels.length > 0
      ? `선택한 상황: ${selectedConditionLabels.join(', ')}`
      : '기본 체크리스트',
  ].join('\n');
}

export function SharePageClient({checklistId}: SharePageClientProps) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [exportAction, setExportAction] = useState<ExportAction | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadChecklist() {
      const storedChecklist = await getChecklistById(checklistId);

      if (active) {
        setChecklist(storedChecklist ?? null);
        setIsLoading(false);
      }
    }

    void loadChecklist();

    return () => {
      active = false;
    };
  }, [checklistId]);

  const selectedConditionLabels = useMemo(
    () =>
      checklist
        ? conditions
            .filter(condition =>
              checklist.selectedConditions.includes(condition.id),
            )
            .map(condition => condition.label)
        : [],
    [checklist],
  );
  const checkedCount =
    checklist?.items.filter(item => item.checked).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;

  async function captureShareCard() {
    if (!previewRef.current) {
      throw new Error(ALERT_MESSAGES.openFailed);
    }

    return toPng(previewRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
  }

  async function handleDownload() {
    if (!checklist || exportAction) {
      return;
    }

    setErrorMessage('');
    setExportAction('download');

    try {
      const dataUrl = await captureShareCard();
      downloadDataUrl(dataUrl, SHARE_CARD_FILENAME);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, ALERT_MESSAGES.saveFailed));
    } finally {
      setExportAction(null);
    }
  }

  async function handleShare() {
    if (!checklist || exportAction) {
      return;
    }

    if (!navigator.share) {
      setErrorMessage('이 브라우저에서는 공유 기능을 사용할 수 없어요.');
      return;
    }

    setErrorMessage('');
    setExportAction('share');

    try {
      const dataUrl = await captureShareCard();
      const file = await dataUrlToFile(dataUrl, SHARE_CARD_FILENAME);
      const shareData: ShareData = {
        files: [file],
        text: getShareMessage(
          checklist,
          checkedCount,
          totalCount,
          selectedConditionLabels,
        ),
        title: checklist.title,
      };

      if (navigator.canShare && !navigator.canShare({files: [file]})) {
        throw new Error('이 브라우저에서는 이미지 공유를 사용할 수 없어요.');
      }

      await navigator.share(shareData);
    } catch (error) {
      if (!isShareCancelError(error)) {
        setErrorMessage(getErrorMessage(error, ALERT_MESSAGES.openFailed));
      }
    } finally {
      setExportAction(null);
    }
  }

  if (isLoading) {
    return (
      <main className="screen">
        <EmptyState title="공유 카드를 준비 중..." />
      </main>
    );
  }

  if (!checklist) {
    return (
      <main className="screen">
        <EmptyState
          description="체크리스트 화면에서 다시 시도해주세요."
          title="공유할 체크리스트를 찾지 못했어요."
        />
      </main>
    );
  }

  return (
    <main className="screen screen-with-bottom-action share-screen">
      <div className="share-capture-target" ref={previewRef}>
        <ShareChecklistPreview
          checkedCount={checkedCount}
          checklist={checklist}
          selectedConditionLabels={selectedConditionLabels}
          totalCount={totalCount}
        />
      </div>

      {errorMessage ? <p className="my-error">{errorMessage}</p> : null}

      <div className="ui-bottom-action-bar">
        <div className="ui-bottom-action-bar-inner share-bottom-actions">
          <Button
            loading={exportAction === 'download'}
            onClick={() => void handleDownload()}
            variant="primary"
          >
            PNG 다운로드
          </Button>
          <Button
            disabled={Boolean(exportAction)}
            loading={exportAction === 'share'}
            onClick={() => void handleShare()}
            variant="brand"
          >
            공유하기
          </Button>
        </div>
      </div>
    </main>
  );
}
