import { requestClient } from '#/api/request';

export interface InfraPageFetchParams {
  [key: string]: any;
  business_address?: string;
  owned_only?: boolean;
  page: number;
  pageSize: number;
  sort_field?: 'addDate' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface InfraAdd {
  ip: string;
  username: string;
  password: string;
  brand: number;
  isAddRun: boolean;
  tag: string;
}

export interface InfraOptionItem {
  label: string;
  value: string;
}

export interface InfraAsset {
  asset_person?: string;
  asset_user_id?: string;
  brand_icon?: string;
  brand_name?: string;
  cabinet_id?: string;
  cabinet_name?: string;
  color?: string;
  id: string;
  info?: string;
  ip_address?: string;
  loc?: string;
  location_id?: string;
  location_name?: string;
  model_name?: string;
  model_image?: string;
  open?: boolean;
  product_id?: string;
  purchase_date?: string;
  region_id?: string;
  region_name?: string;
  serial_number?: string;
  status?: string;
  tag_number?: string;
  uPosition?: string;
  u_position_image?: string;
  created_at?: string;
}

export interface ServerRoomAlarm {
  alarm_id: string;
  alarm_type?: string;
  component?: string;
  message?: string;
  severity: string;
  timestamp?: string;
}

export interface ServerRoomCabinet {
  cabinet_id?: string;
  cabinet_name?: string;
  location_id?: string;
  location_name?: string;
  region_id?: string;
  region_name?: string;
}

export interface ServerRoomServer extends InfraAsset {
  alarm_count: number;
  alarms: ServerRoomAlarm[];
  asset_id: string;
}

export interface ServerRoomScreenData {
  cabinets: ServerRoomCabinet[];
  servers: ServerRoomServer[];
}

export interface ServerRoomEnvironmentStatus {
  abnormal: number;
  count: number;
  latest_update?: null | string;
  normal: number;
  offline: number;
  status: string;
}

export interface ServerRoomEnvironmentMetric extends ServerRoomEnvironmentStatus {
  avg?: null | number;
  max?: null | number;
  min?: null | number;
  value?: null | number;
  wave?: Array<null | number>;
}

export interface ServerRoomEnvironmentPower extends ServerRoomEnvironmentMetric {
  last_month_cost?: null | number;
  last_month_energy?: null | number;
  month_cost?: null | number;
  month_energy?: null | number;
  predicted_month_cost?: null | number;
  predicted_month_energy?: null | number;
  unit_price?: null | number;
}

export interface ServerRoomEnvironmentData {
  device?: null | {
    id: string;
    name: string;
    type: string;
  };
  door: ServerRoomEnvironmentStatus;
  from_cache: boolean;
  humidity: ServerRoomEnvironmentMetric;
  leak: ServerRoomEnvironmentStatus;
  message?: string;
  power?: ServerRoomEnvironmentPower;
  sensors: ServerRoomEnvironmentStatus;
  smoke: ServerRoomEnvironmentStatus;
  status: 'empty' | 'error' | 'online' | 'warning';
  temperature: ServerRoomEnvironmentMetric;
  updated_at?: null | string;
}

export interface InfraAssetLocationUpdate {
  asset_user_id?: string;
  cabinet_id?: string;
  location_id?: string;
  region_id?: string;
  uPosition?: string;
  asset_person?: string;
  notes?: string;
}

export async function getInfraAssetsListApi(params: InfraPageFetchParams) {
  return requestClient.get<{ items: InfraAsset[]; total: number }>(
    '/assets/infra/list',
    { params },
  );
}

export async function addInfraAssetApi(params: InfraAdd) {
  return requestClient.post('/assets/infra/create', params);
}

export async function getRegions() {
  return requestClient.get<InfraOptionItem[]>('/assets/infra/regions');
}

export async function getLocations(regionId?: string) {
  return requestClient.get<InfraOptionItem[]>('/assets/infra/locations', {
    params: regionId ? { region_id: regionId } : {},
  });
}

export async function getCabinets(locationId?: string) {
  return requestClient.get<InfraOptionItem[]>('/assets/infra/cabinets', {
    params: locationId ? { location_id: locationId } : {},
  });
}

export async function getCabinetServers(cabinetId: string) {
  return requestClient.get<InfraAsset[]>(
    `/assets/infra/cabinet/${cabinetId}/servers`,
  );
}

export async function getServerRoomScreenApi() {
  return requestClient.get<ServerRoomScreenData>('/assets/infra/server-room');
}

export async function getServerRoomEnvironmentApi() {
  return requestClient.get<ServerRoomEnvironmentData>(
    '/assets/infra/server-room/environment',
  );
}

export async function updateAssetLocation(
  serverId: string,
  data: InfraAssetLocationUpdate,
) {
  return requestClient.put(`/assets/infra/${serverId}`, data);
}

export async function deleteInfraAssetApi(assetId: string) {
  return requestClient.delete(`/assets/infra/${assetId}`);
}
