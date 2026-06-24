import Link from 'next/link';
import {CategoryCard} from '@/components/categories/CategoryCard';
import {ScreenHeader} from '@/components/ui/ScreenHeader';
import {getEventCategories} from '@/data/eventCategories';

export default function CategoriesPage() {
  const categories = getEventCategories();

  return (
    <main className="screen">
      <ScreenHeader
        title="어떤 이벤트인가요?"
        trailing={
          <Link className="my-button" href="/my">
            MY
          </Link>
        }
      />
      <div className="stack">
        {categories.map(category => (
          <CategoryCard category={category} key={category.id} />
        ))}
      </div>
    </main>
  );
}
