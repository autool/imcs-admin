import { requestClient } from '#/api/request';

export namespace VLANApi {
  export interface VLAN {
    id: string;
    vlan_id: string;
    vlan_name: string;
    network_segment?: string;
    gateway?: string;
    subnet_mask?: string;
    region_id?: string;
    region_name?: string;
    group_id?: string;
    group_name?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    ip_count?: number;
  }

  export interface VLANListParams {
    page: number;
    pageSize: number;
    vlan_id?: string;
    vlan_name?: string;
    status?: string;
    network_segment?: string;
    region_id?: string;
    group_id?: string;
  }

  export interface VLANListResponse {
    total: number;
    items: VLAN[];
    page: number;
    page_size: number;
  }
}

/**
 * 获取 VLAN 列表
 */
export async function getVLANList(params: VLANApi.VLANListParams) {
  return requestClient.get<VLANApi.VLANListResponse>('/network/vlans/', {
    params,
  });
}

/**
 * 根据 IP 地址匹配所属 VLAN
 */
export async function matchVLANByIP(ipAddress: string) {
  return requestClient.get<null | VLANApi.VLAN>('/network/vlans/match-ip', {
    params: { ip_address: ipAddress },
  });
}

/**
 * 创建 VLAN
 */
export async function createVLAN(data: Partial<VLANApi.VLAN>) {
  return requestClient.post('/network/vlans/', data);
}

/**
 * 更新 VLAN
 */
export async function updateVLAN(id: string, data: Partial<VLANApi.VLAN>) {
  return requestClient.put(`/network/vlans/${id}`, data);
}

/**
 * 删除 VLAN
 */
export async function deleteVLAN(id: string) {
  return requestClient.delete(`/network/vlans/${id}`);
}

/**
 * 获取 VLAN 详情
 */
export async function getVLANDetail(id: string) {
  return requestClient.get<VLANApi.VLAN>(`/network/vlans/${id}`);
}

/**
 * 获取 VLAN 历史记录
 */
export async function getVLANHistory(id: string, page = 1, pageSize = 20) {
  return requestClient.get(`/network/vlans/${id}/history`, {
    params: { page, page_size: pageSize },
  });
}
