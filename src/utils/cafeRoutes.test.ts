import { createCafeRouteDraft, getNextRouteIdAfterDelete } from './cafeRoutes';

describe('cafe route utilities', () => {
  it('creates personal route drafts without room sharing fields', () => {
    const route = createCafeRouteDraft({
      categoryId: 'birthday-cafe',
      ownerId: 'user-1',
      title: '성수 루트',
      now: '2026-06-17T00:00:00.000Z',
    });

    expect(route).not.toHaveProperty('visibility');
    expect(route).not.toHaveProperty('linkedRoom');
  });

  it('selects the next available route after deleting a route', () => {
    const routes = [
      createCafeRouteDraft({
        categoryId: 'birthday-cafe',
        now: '2026-06-17T00:00:00.000Z',
        title: '첫 번째 루트',
      }),
      createCafeRouteDraft({
        categoryId: 'birthday-cafe',
        now: '2026-06-17T00:01:00.000Z',
        title: '두 번째 루트',
      }),
      createCafeRouteDraft({
        categoryId: 'birthday-cafe',
        now: '2026-06-17T00:02:00.000Z',
        title: '세 번째 루트',
      }),
    ];

    expect(getNextRouteIdAfterDelete(routes, routes[1].id)).toBe(routes[2].id);
    expect(getNextRouteIdAfterDelete(routes, routes[2].id)).toBe(routes[1].id);
    expect(
      getNextRouteIdAfterDelete([routes[0]], routes[0].id),
    ).toBeUndefined();
  });
});
