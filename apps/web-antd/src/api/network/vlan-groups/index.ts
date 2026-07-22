import { requestClient } from '#/api/request';

export namespace VLANGroupApi {
  export interface VLANGroup {
    id: string;
    group_name: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    vlan_count?: number;
    active_vlan_count?: number;
    inactive_vlan_count?: number;
    network_segment_count?: number;
    vlan_id_min?: number | string;
    vlan_id_max?: number | string;
    vlan_id_range?: string;
    last_vlan_updated_at?: string;
  }

  export interface VLANGroupListParams {
    page: number;
    pageSize: number;
    group_name?: string;
    status?: string;
  }

  export interface VLANGroupListResponse {
    total: number;
    items: VLANGroup[];
    page: number;
    page_size: number;
  }
}

/**
 * 获取 VLAN 分组列表
 */
export async function getVLANGroupList(
  params: VLANGroupApi.VLANGroupListParams,
) {
  return requestClient.get<VLANGroupApi.VLANGroupListResponse>(
    '/network/vlan-groups/',
    { params },
  );
}

/**
 * 获取所有 VLAN 分组（用于下拉选择）
 */
export async function getAllVLANGroups(status = 'active') {
  return requestClient.get<VLANGroupApi.VLANGroup[]>(
    '/network/vlan-groups/all',
    { params: { status } },
  );
}

/**
 * 创建 VLAN 分组
 */
export async function createVLANGroup(data: Partial<VLANGroupApi.VLANGroup>) {
  return requestClient.post('/network/vlan-groups/', data);
}

/**
 * 更新 VLAN 分组
 */
export async function updateVLANGroup(
  id: string,
  data: Partial<VLANGroupApi.VLANGroup>,
) {
  return requestClient.put(`/network/vlan-groups/${id}`, data);
}

/**
 * 删除 VLAN 分组
 */
export async function deleteVLANGroup(id: string) {
  return requestClient.delete(`/network/vlan-groups/${id}`);
}

/**
 * 获取 VLAN 分组详情
 */
export async function getVLANGroupDetail(id: string) {
  return requestClient.get<VLANGroupApi.VLANGroup>(
    `/network/vlan-groups/${id}`,
  );
}
