import { getCafeRoutesByCategory, saveCafeRoute } from './cafeRoutes';

const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) =>
    Promise.resolve(mockStorage.get(key) ?? null),
  ),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
}));

describe('cafe route storage', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('drops legacy room sharing fields when persisting routes', async () => {
    await saveCafeRoute({
      id: 'route-1',
      ownerId: 'user-1',
      categoryId: 'birthday-cafe',
      title: '성수 루트',
      visibility: 'shared',
      linkedRoom: {
        roomId: 'room-1',
        title: '성수 단톡방',
        status: 'active',
        activeFromAt: '2026-06-17T00:00:00.000Z',
        activeUntilAt: '2026-06-18T00:00:00.000Z',
        linkedAt: '2026-06-17T00:00:00.000Z',
      },
      stops: [],
      createdAt: '2026-06-17T00:00:00.000Z',
      updatedAt: '2026-06-17T00:00:00.000Z',
    } as never);

    const routes = await getCafeRoutesByCategory('birthday-cafe');

    expect(routes).toHaveLength(1);
    expect(routes[0]).not.toHaveProperty('visibility');
    expect(routes[0]).not.toHaveProperty('linkedRoom');
  });
});
