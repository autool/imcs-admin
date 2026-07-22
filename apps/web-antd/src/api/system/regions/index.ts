import { requestClient } from '#/api/request';

export namespace RegionApi {
  export interface Region {
    region_id: string;
    region_name: string;
  }

  export interface RegionListResponse {
    list: Region[];
    total: number;
  }
}

/**
 * 获取所有区域列表
 */
export async function getAllRegions() {
  return requestClient.get<RegionApi.RegionListResponse>('/system/regions');
}

/**
 * 获取区域详情
 */
export async function getRegionDetail(regionId: string) {
  return requestClient.get<RegionApi.Region>(`/system/regions/${regionId}`);
}
