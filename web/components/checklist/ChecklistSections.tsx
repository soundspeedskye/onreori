import type {ChecklistItem} from '@/types';

type ChecklistSectionsProps = {
  sections: Array<{title: string; items: ChecklistItem[]}>;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
};

export function ChecklistSections({
  onDeleteItem,
  onToggleItem,
  sections,
}: ChecklistSectionsProps) {
  return (
    <div className="checklist-sections">
      {sections.map(section => (
        <section className="checklist-section" key={section.title}>
          <h2>{section.title}</h2>
          <div className="checklist-section__items">
            {section.items.map(item => (
              <article
                className={[
                  'checklist-item-card',
                  item.checked ? 'checklist-item-card--checked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={item.id}
              >
                <label className="checklist-item-card__label">
                  <input
                    aria-label={item.name}
                    checked={item.checked}
                    onChange={() => onToggleItem(item.id)}
                    type="checkbox"
                  />
                  <span className="checklist-item-card__content">
                    <strong>{item.name}</strong>
                    {item.tip ? <span>{item.tip}</span> : null}
                  </span>
                </label>

                {item.custom ? (
                  <button
                    aria-label={`${item.name} 삭제`}
                    className="checklist-item-card__delete"
                    onClick={() => onDeleteItem(item.id)}
                    type="button"
                  >
                    삭제
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
