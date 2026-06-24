import {createElement} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {EVENT_CATEGORY_IDS} from '@/constants/eventCategories';

import LandingPage from './page';

describe('category entry flow routes', () => {
  it('renders the landing page with a start link to categories', () => {
    render(createElement(LandingPage));

    expect(
      screen.getByRole('heading', {name: '팬 이벤트 당일 준비를 한곳에서'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: '시작하기'})).toHaveAttribute(
      'href',
      '/categories',
    );
  });

  it('renders category choices with links and a MY shortcut', async () => {
    const CategoriesPage = (await import('./categories/page')).default;

    render(createElement(CategoriesPage));

    expect(
      screen.getByRole('heading', {name: '어떤 이벤트인가요?'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'MY'})).toHaveAttribute(
      'href',
      '/my',
    );
    expect(screen.getByRole('link', {name: '콘서트/팬콘'})).toHaveAttribute(
      'href',
      `/categories/${EVENT_CATEGORY_IDS.EVENT_DAY}`,
    );
    expect(screen.getByText('공연장 실시간 정보 공유')).toBeInTheDocument();
  });

  it('renders checklist and disabled action cards on a category detail page', async () => {
    const CategoryDetailPage = (await import('./categories/[categoryId]/page'))
      .default;

    render(
      await CategoryDetailPage({
        params: Promise.resolve({categoryId: EVENT_CATEGORY_IDS.EVENT_DAY}),
      }),
    );

    expect(
      screen.getByRole('heading', {name: '콘서트/팬콘', level: 1}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: '체크리스트 만들기'}),
    ).toHaveAttribute('href', '/conditions/concert_basic');
    expect(
      screen.getByRole('heading', {name: '오늘의 단톡방'}),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: '카페 루트'})).not.toBeInTheDocument();
  });

  it('shows the cafe route placeholder for cafe event categories', async () => {
    const CategoryDetailPage = (await import('./categories/[categoryId]/page'))
      .default;

    render(
      await CategoryDetailPage({
        params: Promise.resolve({categoryId: EVENT_CATEGORY_IDS.CAFE_EVENT}),
      }),
    );

    expect(screen.getByRole('heading', {name: '카페 루트'})).toBeInTheDocument();
    expect(screen.getAllByText('웹 2차에서 제공됩니다.')).toHaveLength(2);
  });
});
