import { requestClient } from '#/api/request';

export namespace BusinessIPApi {
  export interface BusinessIP {
    id: string;
    server_id?: string;
    ip_address: string;
    ip_type?: string;
    network_segment?: string;
    vlan_id?: string;
    gateway?: string;
    subnet_mask?: string;
    mac_address?: string;
    status?: string;
    ip_user_id?: string;
    ip_person?: string;
    usage_purpose?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    server_ip?: string;
    server_brand?: string;
    server_model?: string;
    asset_person?: string;
    vlan_name?: string;
    vlan_group_id?: string;
    vlan_group_name?: string;
    source_type?: string;
    source_id?: string;
    source_name?: string;
    source_category?: string;
    address_source?: string;
    address_sources?: string[];
    ip_types?: string[];
    is_editable?: boolean;
    is_fused?: boolean;
    source_count?: number;
  }

  export interface BusinessIPHistory {
    id: string;
    business_ip_id?: string;
    server_id?: string;
    ip_address?: string;
    ip_type?: string;
    network_segment?: string;
    vlan_id?: string;
    gateway?: string;
    status?: string;
    change_type?: string;
    change_reason?: string;
    operator?: string;
    created_at?: string;
  }

  export interface BusinessIPListParams {
    page: number;
    pageSize: number;
    server_id?: string;
    ip_address?: string;
    ip_type?: string;
    status?: string;
    network_segment?: string;
    vlan_id?: string;
  }

  export interface BusinessIPListResponse {
    total: number;
    items: BusinessIP[];
    page: number;
    page_size: number;
  }
}

/**
 * 获取业务地址列表
 */
export async function getBusinessIPList(
  params: BusinessIPApi.BusinessIPListParams,
) {
  return requestClient.get<BusinessIPApi.BusinessIPListResponse>(
    '/network/business-ips/',
    { params },
  );
}

/**
 * 创建业务地址
 */
export async function createBusinessIP(
  data: Partial<BusinessIPApi.BusinessIP>,
) {
  return requestClient.post('/network/business-ips/', data);
}

/**
 * 更新业务地址
 */
export async function updateBusinessIP(
  id: string,
  data: Partial<BusinessIPApi.BusinessIP>,
) {
  return requestClient.put(`/network/business-ips/${id}`, data);
}

/**
 * 删除业务地址
 */
export async function deleteBusinessIP(id: string) {
  return requestClient.delete(`/network/business-ips/${id}`);
}

/**
 * 获取业务地址详情
 */
export async function getBusinessIPDetail(id: string) {
  return requestClient.get<BusinessIPApi.BusinessIP>(
    `/network/business-ips/${id}`,
  );
}

/**
 * 获取业务地址历史记录
 */
export async function getBusinessIPHistory(
  id: string,
  page = 1,
  pageSize = 20,
) {
  return requestClient.get(`/network/business-ips/${id}/history`, {
    params: { page, page_size: pageSize },
  });
}
