import {createElement} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {EVENT_CATEGORY_IDS} from '@/constants/eventCategories';
import type {EventCategory} from '@/types';

import {CategoryCard} from './CategoryCard';

describe('CategoryCard', () => {
  it('links to the category detail route with category content', () => {
    const category: EventCategory = {
      id: EVENT_CATEGORY_IDS.EVENT_DAY,
      title: '테스트 이벤트',
      icon: '🧡',
      description: '준비 흐름을 테스트해요',
      templateId: 'test_template',
      roomLabel: '현장 정보 공유',
    };

    render(createElement(CategoryCard, {category}));

    expect(screen.getByRole('link', {name: '테스트 이벤트'})).toHaveAttribute(
      'href',
      `/categories/${EVENT_CATEGORY_IDS.EVENT_DAY}`,
    );
    expect(screen.getByText('🧡')).toBeInTheDocument();
    expect(screen.getByText('준비 흐름을 테스트해요')).toBeInTheDocument();
    expect(screen.getByText('현장 정보 공유')).toBeInTheDocument();
  });
});
