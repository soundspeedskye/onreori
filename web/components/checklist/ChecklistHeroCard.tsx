import {Card} from '@/components/ui/Card';
import {PixelIcon, getPixelIconNameForEmoji} from '@/components/ui/PixelIcon';

type ChecklistHeroCardProps = {
  icon: string;
  title: string;
  meta: string;
  saveStateLabel: string;
  conditionLabels: string[];
};

export function ChecklistHeroCard({
  conditionLabels,
  icon,
  meta,
  saveStateLabel,
  title,
}: ChecklistHeroCardProps) {
  const iconName = getPixelIconNameForEmoji(icon);

  return (
    <Card className="checklist-hero-card">
      <div className="checklist-hero-card__top">
        <div className="checklist-hero-card__icon" aria-hidden="true">
          {iconName ? (
            <PixelIcon name={iconName} size={46} />
          ) : (
            <span>{icon}</span>
          )}
        </div>
        <div className="checklist-hero-card__copy">
          <p>{meta}</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="checklist-hero-card__footer">
        <span className="checklist-save-state">{saveStateLabel}</span>
        <div className="checklist-condition-list" aria-label="선택한 상황">
          {conditionLabels.length > 0 ? (
            conditionLabels.map(label => (
              <span className="checklist-condition-pill" key={label}>
                {label}
              </span>
            ))
          ) : (
            <span className="checklist-condition-pill checklist-condition-pill--muted">
              선택한 추가 조건 없음
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
