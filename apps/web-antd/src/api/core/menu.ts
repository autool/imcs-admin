import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

export interface MenuResponse {
  menus: RouteRecordStringComponent[];
  authCodes: string[];
}

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi(): Promise<MenuResponse> {
  return requestClient.get<MenuResponse>('/menu/all');
}
