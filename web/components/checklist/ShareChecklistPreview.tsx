import type {Checklist} from '@/types';

import {getPixelIconNameForEmoji, PixelIcon} from '../ui/PixelIcon';

type ShareChecklistPreviewProps = {
  checklist: Checklist;
  selectedConditionLabels: string[];
  checkedCount: number;
  totalCount: number;
  previewLimit?: number;
};

export function ShareChecklistPreview({
  checkedCount,
  checklist,
  previewLimit = 5,
  selectedConditionLabels,
  totalCount,
}: ShareChecklistPreviewProps) {
  const previewItems = checklist.items.slice(0, previewLimit);
  const checklistIconName = getPixelIconNameForEmoji(checklist.icon);

  return (
    <div className="share-preview-wrap">
      <article className="ui-card share-preview-card">
        <header className="share-preview-header">
          <div className="share-preview-icon" aria-hidden="true">
            {checklistIconName ? (
              <PixelIcon name={checklistIconName} size={46} />
            ) : (
              checklist.icon
            )}
          </div>
          <h1>{checklist.title}</h1>
          <p>{checkedCount}/{totalCount} 완료</p>
        </header>

        <div aria-label="선택한 상황" className="share-preview-conditions">
          {selectedConditionLabels.length > 0 ? (
            selectedConditionLabels.map(label => (
              <span className="ui-chip ui-chip-brand" key={label}>
                {label}
              </span>
            ))
          ) : (
            <span className="ui-chip ui-chip-brand">기본 체크리스트</span>
          )}
        </div>

        <div className="share-preview-list">
          {previewItems.map(item => (
            <div className="share-preview-item" key={item.id}>
              <PixelIcon name={item.checked ? 'checkOn' : 'checkOff'} size={20} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
