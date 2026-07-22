import { requestClient } from '#/api/request';

export namespace RegionApi {
  export interface Region {
    region_id: string;
    region_name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
  }

  export interface RegionListParams {
    page: number;
    pageSize: number;
    search?: string;
  }

  export interface RegionListResult {
    list: Region[];
    total: number;
  }
}

/**
 * 获取区域列表
 */
export async function getRegionList(params?: RegionApi.RegionListParams) {
  const response = await requestClient.get<{
    items?: RegionApi.Region[];
    list?: RegionApi.Region[];
    total: number;
  }>('/system/regions', {
    params,
  });
  return {
    list: response.list || response.items || [],
    total: response.total || 0,
  };
}

/**
 * 创建区域
 */
export async function createRegion(data: Omit<RegionApi.Region, 'region_id'>) {
  return requestClient.post('/system/regions', data);
}

/**
 * 更新区域
 */
export async function updateRegion(
  regionId: string,
  data: Partial<RegionApi.Region>,
) {
  return requestClient.put(`/system/regions/${regionId}`, data);
}

/**
 * 删除区域
 */
export async function deleteRegion(regionId: string) {
  return requestClient.delete(`/system/regions/${regionId}`);
}
