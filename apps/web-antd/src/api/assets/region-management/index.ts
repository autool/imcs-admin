import { requestClient } from '#/api/request';

export namespace RegionManagementApi {
  export interface Region {
    region_id: string;
    region_name: string;
    region_type: string;
    location: string;
    parent_region_id: string;
    parent_region: string;
    responsible_person: string;
    responsible_user_id?: string;
    contact: string;
    status: string;
    asset_count: number;
    description: string;
    created_at: string;
    updated_at: string;
  }

  export interface RegionListParams {
    page: number;
    pageSize: number;
    region_name?: string;
    region_type?: string;
    status?: string;
  }

  export interface RegionListResponse {
    items: Region[];
    total: number;
  }
}

/**
 * 获取区域列表
 */
export async function getRegionList(
  params: RegionManagementApi.RegionListParams,
) {
  return requestClient.get<RegionManagementApi.RegionListResponse>(
    '/system/regions',
    {
      params,
    },
  );
}

/**
 * 创建区域
 */
export async function createRegion(data: Partial<RegionManagementApi.Region>) {
  return requestClient.post('/system/regions', data);
}

/**
 * 更新区域
 */
export async function updateRegion(
  id: string,
  data: Partial<RegionManagementApi.Region>,
) {
  return requestClient.put(`/system/regions/${id}`, data);
}

/**
 * 获取所有区域（不分页）
 */
export async function getAllRegions() {
  return requestClient.get('/system/regions/all');
}

/**
 * 获取区域详情
 */
export async function getRegionDetail(id: string) {
  return requestClient.get(`/system/regions/${id}`);
}

/**
 * 删除区域
 */
export async function deleteRegion(id: string) {
  return requestClient.delete(`/system/regions/${id}`);
}

/**
 * 锁定区域
 */
export async function lockRegion(id: string) {
  return requestClient.post(`/system/regions/${id}/lock`);
}

/**
 * 解锁区域
 */
export async function unlockRegion(id: string) {
  return requestClient.post(`/system/regions/${id}/unlock`);
}
