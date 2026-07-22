import { requestClient } from '#/api/request';

export interface TerminalAssetItem {
  id: string;
  tag_number: string;
  business_address?: string;
  serial_number?: string;
  asset_type: 'computer' | 'laptop';
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  brand_icon?: string;
  brand_id?: string;
  brand_name?: string;
  cpu_model?: string;
  memory_size?: number;
  disk_size?: number;
  os_type?: string;
  os_version?: string;
  hostname?: string;
  ip_address?: string;
  mac_address?: string;
  model_id?: string;
  user_id?: string;
  model_name?: string;
  user_name?: string;
  user_dept?: string;
  asset_user_id?: string;
  asset_person?: string;
  supplier?: string;
  purchase_date?: string;
  warranty_period?: number;
  region_id?: string;
  region_name?: string;
  location_id?: string;
  location_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TerminalAssetListParams {
  asset_person?: string;
  asset_user_id?: string;
  business_address?: string;
  brand_id?: string;
  ip_address?: string;
  model_id?: string;
  owned_only?: boolean;
  page: number;
  pageSize: number;
  serial_number?: string;
  status?: string;
  tag_number?: string;
  asset_type?: string;
}

export function getTerminalAssetListApi(params: TerminalAssetListParams) {
  return requestClient.get<{
    items: TerminalAssetItem[];
    total: number;
  }>('/assets/terminal/list', { params });
}

export function createTerminalAssetApi(
  data: Omit<TerminalAssetItem, 'created_at' | 'id' | 'updated_at'>,
) {
  return requestClient.post('/assets/terminal/create', data);
}

export function updateTerminalAssetApi(
  id: string,
  data: Partial<TerminalAssetItem>,
) {
  return requestClient.put(`/assets/terminal/${id}`, data);
}

export function getTerminalAssetDetailApi(id: string) {
  return requestClient.get<TerminalAssetItem>(`/assets/terminal/${id}`);
}

export function deleteTerminalAssetApi(id: string) {
  return requestClient.delete(`/assets/terminal/${id}`);
}

export interface TerminalBrandOption {
  label: string;
  value: string;
}

export interface TerminalModelOption {
  label: string;
  value: string;
}

export function getTerminalBrandsApi() {
  return requestClient.get<TerminalBrandOption[]>('/devices/terminal/brands');
}

export function getTerminalModelsApi(params?: { brand_id?: string }) {
  return requestClient.get<TerminalModelOption[]>('/devices/terminal/models', {
    params,
  });
}

export interface TerminalAssetHistory {
  id: string;
  asset_id: string;
  tag_number?: string;
  user_name?: string;
  user_dept?: string;
  ip_address?: string;
  mac_address?: string;
  hostname?: string;
  location?: string;
  status?: string;
  change_type: 'create' | 'retire' | 'transfer' | 'update';
  change_reason?: string;
  operator?: string;
  created_at: string;
}

export function getTerminalAssetHistoryApi(assetId: string) {
  return requestClient.get<TerminalAssetHistory[]>(
    `/devices/terminal/asset/${assetId}/history`,
  );
}

export function createTerminalAssetHistoryApi(
  assetId: string,
  data: Partial<TerminalAssetHistory>,
) {
  return requestClient.post(`/devices/terminal/asset/${assetId}/history`, data);
}
