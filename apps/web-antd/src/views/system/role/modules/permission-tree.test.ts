import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMenuList = vi.fn();

vi.mock('#/api/system/menu', () => ({ getMenuList }));

describe('role permission tree cache', () => {
  beforeEach(() => {
    vi.resetModules();
    getMenuList.mockReset();
  });

  it('shares the pending request and reuses the loaded tree', async () => {
    getMenuList.mockResolvedValue({
      list: [{ id: 'menu-1', meta: { title: 'Menu' } }],
    });
    const { loadRolePermissionTree } = await import('./permission-tree');

    const [first, second] = await Promise.all([
      loadRolePermissionTree(),
      loadRolePermissionTree(),
    ]);
    const third = await loadRolePermissionTree();

    expect(getMenuList).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(third).toBe(first);
  });
});
