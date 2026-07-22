import { requestClient } from '#/api/request';

export interface ServerPageFetchParams {
  [key: string]: any;
  business_address?: string;
  owned_only?: boolean;
  page: number;
  pageSize: number;
}

export interface ServerAdd {
  asset_person?: string;
  asset_user_id?: string;
  credential_id: string;
  cabinet_id?: string;
  ip: string;
  brand: number;
  location_id?: string;
  model?: string;
  notes?: string;
  region_id?: string;
  isAddRun: boolean;
  tag: string;
  uPosition?: string;
}

export interface ServerUpdate {
  asset_person?: string;
  asset_user_id?: string;
  brand?: number | string;
  credential_id?: string;
  ip?: string;
  isAddRun?: boolean;
  model?: string;
  models_id?: number | string;
  password?: string;
  tag?: string;
  username?: string;
}

export interface ServerImportData {
  ip: string;
  username: string;
  password: string;
  brand: string;
  model?: string;
  tag?: string;
  area?: string;
  region?: string;
  cabinet?: string;
  uPosition?: string;
  serialNumber?: string;
  owner?: string;
}

export interface BatchImportResult {
  success_count: number;
  failed_count: number;
  total: number;
  failed_items: Array<{
    ip: string;
    reason: string;
    row: number;
  }>;
}

export interface ServerDiscoveredDevice {
  brand_id?: null | string;
  brand_name?: null | string;
  id: string;
  ip_address: string;
  mac_address?: null | string;
  guuid?: null | string;
  serial_number?: null | string;
  vendor?: null | string;
  model?: null | string;
  device_type?: null | string;
  detected_by?: null | string;
  credential_source_ip?: null | string;
  credential_id?: null | string;
  credential_name?: null | string;
  status: 'ignored' | 'managed' | 'pending';
  matched_server_id?: null | string;
  first_seen_at?: string;
  last_seen_at?: string;
  discovered_count?: number;
  last_task_execution_id?: null | string;
  model_name?: null | string;
  models_id?: null | string;
  ignored_reason?: null | string;
  ignored_at?: null | string;
}

export interface ServerDiscoveredListResult {
  items: ServerDiscoveredDevice[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ServerLifecycleEvent {
  change_reason?: null | string;
  change_type?: null | string;
  component_id?: null | string;
  component_type?: null | string;
  created_at?: string;
  event_type: 'business_ip' | 'hardware' | 'ip' | 'server' | string;
  field_name?: null | string;
  id: string;
  ip_address?: null | string;
  new_value?: null | string;
  old_value?: null | string;
  operator?: null | string;
  source?: string;
}

export interface ServerLifecycleResult {
  items: ServerLifecycleEvent[];
  page: number;
  page_size: number;
  read_at?: null | string;
  read_state_available?: boolean;
  server?: Record<string, any>;
  total: number;
  unread_count?: number;
}

export interface ServerBrandCatalogItem {
  aliases: string[];
  label: string;
  models: Array<{
    label: string;
    value: string;
  }>;
  value: string;
}

export interface HardwareAdapterRule {
  capability_labels: string[];
  capabilities: string[];
  description: string;
  firmware_prefixes: string[];
  generation: string;
  key: string;
  model_aliases: string[];
  notes: string[];
  support_label: string;
  support_level: 'full' | 'partial';
}

export interface HardwareAdapterItem {
  adapter_key: string;
  bmc_name: string;
  brand_names: string[];
  capability_labels: string[];
  class_path: string;
  enabled: boolean;
  generated_at?: string;
  health?: {
    description?: string;
    label: string;
    last_checked_at?: null | string;
    last_issue_count?: number;
    last_message?: string;
    last_status?: string;
    level: 'default' | 'error' | 'processing' | 'success' | 'warning';
    success_rate?: null | number;
  };
  locked?: boolean;
  note?: string;
  rule_count: number;
  rules: HardwareAdapterRule[];
  support_label: string;
  support_level: 'full' | 'partial';
  support_summary: string;
  updated_at?: string;
  vendor_key: string;
  vendor_name: string;
}

export interface HardwareAdapterListResult {
  generated_at: string;
  items: HardwareAdapterItem[];
  total: number;
}

export interface HardwareAdapterCollectResult {
  adapter_key: string;
  device_ip: string;
  finished_at?: string;
  message: string;
  quality_rating?: {
    label: string;
    level: 'default' | 'error' | 'processing' | 'success' | 'warning';
    reason: string;
  };
  started_at?: string;
  status: 'failed' | 'success';
  summary?: {
    adapter_variant?: Record<string, any>;
    components?: Record<string, any>;
    counts?: Record<string, number>;
    missing_fields?: string[];
    objects?: Record<string, Array<Record<string, any>>>;
    profile?: Record<string, any>;
    quality_flags?: string[];
    required_field_coverage?: Record<string, any>;
    success?: boolean;
  };
}

export interface HardwareAdapterCollectRecord {
  adapter_key: string;
  counts?: Record<string, number>;
  created_at?: string;
  device_ip: string;
  finished_at?: string;
  firmware_version?: string;
  id: string;
  issue_count: number;
  message?: string;
  model?: string;
  quality_rating?: {
    label: string;
    level: 'default' | 'error' | 'processing' | 'success' | 'warning';
    reason: string;
  };
  rule_key?: string;
  started_at?: string;
  status: 'failed' | 'success';
  vendor_name?: string;
}

export interface HardwareAdapterCollectRecordListResult {
  items: HardwareAdapterCollectRecord[];
  total: number;
}

export interface HardwareAdapterCoverageItem {
  brand_name: string;
  firmware_version: string;
  ip_address: string;
  is_live: boolean;
  matched_rule?: string;
  model: string;
  reason: string;
  server_id: string;
  status: 'dedicated' | 'fallback';
  status_label: string;
  support_label: string;
}

export interface HardwareAdapterCoverageResult {
  adapter_key: string;
  items: HardwareAdapterCoverageItem[];
  recommendation: {
    description: string;
    label: string;
    level: 'default' | 'error' | 'processing' | 'success' | 'warning';
  };
  summary: {
    coverage_rate: number;
    dedicated: number;
    fallback: number;
    fallback_rate: number;
    full_support: number;
    in_scope: number;
    offline: number;
    partial_support: number;
    total_servers: number;
  };
  total: number;
}

export interface HardwareAdapterImpactResult {
  action_notes: string[];
  adapter_key: string;
  affected_items: HardwareAdapterCoverageItem[];
  enabled: boolean;
  locked?: boolean;
  quality: {
    failed: number;
    last_checked_at?: null | string;
    success: number;
    success_rate?: null | number;
    total: number;
    with_issues: number;
  };
  recommendation: HardwareAdapterCoverageResult['recommendation'];
  summary: HardwareAdapterCoverageResult['summary'];
  total: number;
}

export interface HardwareAdapterCandidateItem {
  brand_name: string;
  firmware_version: string;
  ip_address: string;
  is_live: boolean;
  label: string;
  matched_rule?: string;
  model: string;
  server_id: string;
  status: string;
  status_label: string;
}

export interface HardwareAdapterCandidateListResult {
  adapter_key: string;
  items: HardwareAdapterCandidateItem[];
  total: number;
}

export interface HardwareAdapterAuditLog {
  action: string;
  action_label: string;
  adapter_key: string;
  created_at?: string;
  detail?: Record<string, any>;
  id: string;
  operator_name?: string;
}

export interface HardwareAdapterAuditLogListResult {
  items: HardwareAdapterAuditLog[];
  total: number;
}

export interface HardwareAdapterQualityIssueItem {
  count: number;
  key: string;
  label: string;
}

export interface HardwareAdapterComponentHealthItem {
  average_count?: null | number;
  component: string;
  count: number;
  identity_coverage_rate?: null | number;
  label: string;
  missing_identity: number;
  with_identity: number;
}

export interface HardwareAdapterQualityResult {
  adapter_key: string;
  component_counts: Array<{
    component: string;
    count: number;
    label: string;
  }>;
  component_health: HardwareAdapterComponentHealthItem[];
  period_days: number;
  recent_problem_records: HardwareAdapterCollectRecord[];
  recommendation: {
    description: string;
    label: string;
    level: 'default' | 'error' | 'processing' | 'success' | 'warning';
  };
  rule_hits: Array<{
    count: number;
    rule_key: string;
  }>;
  summary: {
    failed: number;
    issue_rate?: null | number;
    last_checked_at?: null | string;
    success: number;
    success_rate?: null | number;
    total: number;
    with_issues: number;
  };
  top_issues: HardwareAdapterQualityIssueItem[];
  top_missing_fields: HardwareAdapterQualityIssueItem[];
  top_quality_flags: HardwareAdapterQualityIssueItem[];
}

export async function getServersListApi(params: ServerPageFetchParams) {
  return requestClient.get('/devices/server/list', { params });
}

export async function addServerApi(params: ServerAdd) {
  return requestClient.post('/devices/server/add', params);
}

export async function checkServerCredentialApi(params: {
  credential_id: string;
  ip: string;
}) {
  return requestClient.post('/devices/server/check-credential', params);
}

export async function getBrandOptionsApi() {
  return requestClient.get('/devices/server/brand');
}

export async function getBrandCatalogApi() {
  return requestClient.get<{ items: ServerBrandCatalogItem[] }>(
    '/devices/server/brand/catalog',
  );
}

export async function getModelOptionsApi(params: any) {
  return requestClient.get('/devices/server/brand/models', { params });
}

export async function getServerDetailsApi(serverId: string) {
  return requestClient.get(`/devices/server/details/${serverId}`);
}

export async function updateServerApi(serverId: string, params: ServerUpdate) {
  return requestClient.put(`/devices/server/${serverId}`, params);
}

export async function deleteServerApi(serverId: string) {
  return requestClient.delete(`/devices/server/${serverId}`);
}

export async function getServerInfoApi(serverId: string) {
  return requestClient.get(`/devices/server/${serverId}/info`);
}

export async function getServerLifecycleApi(
  serverId: string,
  params?: {
    category?: 'all' | 'business_ip' | 'hardware' | 'ip' | 'server';
    page?: number;
    page_size?: number;
  },
) {
  return requestClient.get<ServerLifecycleResult>(
    `/devices/server/${serverId}/lifecycle`,
    { params },
  );
}

export async function markServerLifecycleReadApi(serverId: string) {
  return requestClient.post<{
    persistent?: boolean;
    read_at?: null | string;
    server_id: string;
    unread_count: number;
  }>(`/devices/server/${serverId}/lifecycle/read`);
}

export async function batchImportServersApi(data: ServerImportData[]) {
  return requestClient.post<BatchImportResult>(
    '/devices/server/batch-import',
    data,
  );
}

export async function getImportTasksApi(params: {
  page: number;
  pageSize: number;
}) {
  return requestClient.get('/devices/server/import-tasks', { params });
}

export async function getImportTaskDetailApi(taskId: string) {
  return requestClient.get(`/devices/server/import-tasks/${taskId}`);
}

export async function getDiscoveredServersApi(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | 'ignored' | 'managed' | 'pending';
}) {
  return requestClient.get<ServerDiscoveredListResult>(
    '/devices/server/discovered',
    { params },
  );
}

export async function ignoreDiscoveredServerApi(
  recordId: string,
  reason?: string,
) {
  return requestClient.post(
    `/devices/server/discovered/${recordId}/ignore`,
    undefined,
    {
      params: reason ? { reason } : undefined,
    },
  );
}

export async function getHardwareAdaptersApi() {
  return requestClient.get<HardwareAdapterListResult>(
    '/devices/server/adapters',
  );
}

export async function updateHardwareAdapterEnabledApi(
  adapterKey: string,
  data: { enabled: boolean; note?: string },
) {
  return requestClient.put(
    `/devices/server/adapters/${adapterKey}/enabled`,
    data,
  );
}

export async function syncHardwareAdaptersApi() {
  return requestClient.post<HardwareAdapterListResult>(
    '/devices/server/adapters/sync',
  );
}

export async function collectHardwareAdapterTestApi(
  adapterKey: string,
  data: { device_ip: string; force?: boolean },
) {
  return requestClient.post<HardwareAdapterCollectResult>(
    `/devices/server/adapters/${adapterKey}/collect-test`,
    data,
    { timeout: 120_000 },
  );
}

export async function getHardwareAdapterCollectRecordsApi(
  adapterKey: string,
  params?: { limit?: number },
) {
  return requestClient.get<HardwareAdapterCollectRecordListResult>(
    `/devices/server/adapters/${adapterKey}/collect-records`,
    { params },
  );
}

export async function getHardwareAdapterCoverageApi(adapterKey: string) {
  return requestClient.get<HardwareAdapterCoverageResult>(
    `/devices/server/adapters/${adapterKey}/coverage`,
  );
}

export async function getHardwareAdapterImpactApi(adapterKey: string) {
  return requestClient.get<HardwareAdapterImpactResult>(
    `/devices/server/adapters/${adapterKey}/impact`,
  );
}

export async function getHardwareAdapterCandidatesApi(
  adapterKey: string,
  params?: { limit?: number },
) {
  return requestClient.get<HardwareAdapterCandidateListResult>(
    `/devices/server/adapters/${adapterKey}/candidates`,
    { params },
  );
}

export async function getHardwareAdapterAuditLogsApi(
  adapterKey: string,
  params?: { limit?: number },
) {
  return requestClient.get<HardwareAdapterAuditLogListResult>(
    `/devices/server/adapters/${adapterKey}/audit-logs`,
    { params },
  );
}

export async function getHardwareAdapterQualityApi(adapterKey: string) {
  return requestClient.get<HardwareAdapterQualityResult>(
    `/devices/server/adapters/${adapterKey}/quality`,
  );
}
