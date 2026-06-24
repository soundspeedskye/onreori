import Link from 'next/link';
import {Card} from '@/components/ui/Card';
import {PixelIcon, getPixelIconNameForEmoji} from '@/components/ui/PixelIcon';
import type {EventCategory} from '@/types';

export function CategoryCard({category}: {category: EventCategory}) {
  const iconName = getPixelIconNameForEmoji(category.icon);

  return (
    <Link href={`/categories/${category.id}`} aria-label={category.title}>
      <Card className="category-card">
        <div className="category-card__icon">
          {iconName ? (
            <PixelIcon name={iconName} size={34} />
          ) : (
            <span>{category.icon}</span>
          )}
        </div>
        <div className="category-card__content">
          <strong>{category.title}</strong>
          <p>{category.description}</p>
          <span>{category.roomLabel}</span>
        </div>
      </Card>
    </Link>
  );
}
