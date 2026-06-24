import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Card} from '@/components/ui/Card';
import {PixelIcon, getPixelIconNameForEmoji} from '@/components/ui/PixelIcon';
import {isCafeEventCategory} from '@/constants/eventCategories';
import {getEventCategoryById} from '@/data/eventCategories';

type CategoryDetailPageProps = {
  params: Promise<{
    categoryId: string;
  }>;
};

export default async function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const {categoryId} = await params;
  const category = getEventCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  const iconName = getPixelIconNameForEmoji(category.icon);

  return (
    <main className="screen stack">
      <Card className="hero-card">
        {iconName ? (
          <PixelIcon name={iconName} size={54} />
        ) : (
          <span className="hero-card__emoji">{category.icon}</span>
        )}
        <h1>{category.title}</h1>
      </Card>

      <Link href={`/conditions/${category.templateId}`}>
        <Card className="action-card">
          <h2>체크리스트 만들기</h2>
        </Card>
      </Link>

      {isCafeEventCategory(category.id) ? (
        <Card className="action-card action-card--disabled">
          <h2>카페 루트</h2>
          <p>웹 2차에서 제공됩니다.</p>
        </Card>
      ) : null}

      <Card className="action-card action-card--disabled">
        <h2>오늘의 단톡방</h2>
        <p>웹 2차에서 제공됩니다.</p>
      </Card>
    </main>
  );
}
