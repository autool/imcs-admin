import type { DataNode } from 'ant-design-vue/es/tree';

import { getMenuList } from '#/api/system/menu';

const CACHE_TTL = 60_000;

let cachedAt = 0;
let cachedPermissions: DataNode[] = [];
let pendingRequest: null | Promise<DataNode[]> = null;

export async function loadRolePermissionTree(): Promise<DataNode[]> {
  if (cachedPermissions.length > 0 && Date.now() - cachedAt < CACHE_TTL) {
    return cachedPermissions;
  }
  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = getMenuList()
    .then((response) => {
      cachedPermissions = response.list as unknown as DataNode[];
      cachedAt = Date.now();
      return cachedPermissions;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}
