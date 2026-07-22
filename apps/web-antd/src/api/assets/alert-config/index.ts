import { requestClient } from '#/api/request';

export namespace AlertConfigApi {
  export interface AlertConfig {
    id: string;
    name: string;
    target_type: string; // single_server / region / priority_group / all
    target_name: string;
    resource_id: string;
    metric_name: string;
    condition: string;
    threshold: number;
    threshold_max?: number;
    severity: string;
    enabled: boolean;
    notification_channels: string;
    recipients: string;
    recipient_names?: string;
    description: string;
    cooldown_time: number;
    notification_template_id: string;
    created_at: string;
    updated_at: string;
  }

  export interface AlertConfigListParams {
    page: number;
    pageSize: number;
    enabled?: boolean;
    target_type?: string;
  }

  export interface AlertConfigListResponse {
    items: AlertConfig[];
    total: number;
  }

  export interface ResourceOption {
    id: string;
    name: string;
    type: string;
    label: string;
    value: string;
  }

  export interface ResourceGroup {
    label: string;
    options: ResourceOption[];
  }

  export interface MetricOption {
    value: string;
    label: string;
    unit: string;
    default_threshold: number;
    supports_range?: boolean;
    recommended_conditions?: string[];
    description?: string;
  }

  export interface TicketPolicy {
    enabled: boolean;
    escalation_severities: string[];
    high_severities: string[];
    ignored_severities: string[];
    key_group_priorities: number[];
    repeat_threshold: number;
    scan_limit: number;
  }

  export interface ServerAlarmSilenceRule {
    builtin: boolean;
    created_at?: string;
    description?: string;
    effect: string;
    enabled: boolean;
    example?: string;
    id: string;
    match_type: 'contains' | 'regex';
    name: string;
    pattern: string;
    scene?: string;
    sort_order: number;
    updated_at?: string;
  }

  export interface ServerAlarmSilenceRulePayload {
    description?: string;
    effect: string;
    enabled: boolean;
    example?: string;
    match_type: 'contains' | 'regex';
    name: string;
    pattern: string;
    scene?: string;
    sort_order: number;
  }

  export interface ServerAlarmSilenceRuleTestResult {
    matched: boolean;
    rule?: null | ServerAlarmSilenceRule;
  }
}

/**
 * 获取告警配置列表
 */
export async function getAlertConfigList(
  params: AlertConfigApi.AlertConfigListParams,
) {
  return requestClient.get<AlertConfigApi.AlertConfigListResponse>(
    '/assets/alert-config/list',
    { params },
  );
}

/**
 * 获取通知模板列表
 */
export async function getNotificationTemplates() {
  return requestClient.get('/assets/alert-config/templates');
}

/**
 * 获取通知渠道列表
 */
export async function getNotificationChannels() {
  return requestClient.get('/assets/alert-config/channels');
}

/**
 * 获取可监控的资源列表（服务器、区域、优先级分组）
 */
export async function getMonitoringResources(
  targetType?: string,
  keyword?: string,
) {
  return requestClient.get<AlertConfigApi.ResourceGroup[]>(
    '/assets/alert-config/resources',
    { params: { target_type: targetType, keyword } },
  );
}

/**
 * 获取可用的监控指标
 */
export async function getAvailableMetrics(resourceType: string) {
  return requestClient.get<AlertConfigApi.MetricOption[]>(
    '/assets/alert-config/metrics',
    { params: { resource_type: resourceType } },
  );
}

/**
 * 获取用户列表（用于选择接收人）
 */
export async function getUserList() {
  return requestClient.get('/system/user/list', {
    params: { page: 1, pageSize: 1000 },
  });
}

/**
 * 创建告警配置
 */
export async function createAlertConfig(
  data: Partial<AlertConfigApi.AlertConfig>,
) {
  return requestClient.post('/assets/alert-config', data);
}

/**
 * 更新告警配置
 */
export async function updateAlertConfig(
  id: string,
  data: Partial<AlertConfigApi.AlertConfig>,
) {
  return requestClient.put(`/assets/alert-config/${id}`, data);
}

/**
 * 删除告警配置
 */
export async function deleteAlertConfig(id: string) {
  return requestClient.delete(`/assets/alert-config/${id}`);
}

/**
 * 启用/禁用告警配置
 */
export async function toggleAlertConfig(id: string) {
  return requestClient.post(`/assets/alert-config/${id}/toggle`);
}

/**
 * 测试告警配置
 */
export async function testAlertConfig(id: string) {
  return requestClient.post(`/assets/alert-config/${id}/test`);
}

/**
 * 获取服务器告警转工单策略
 */
export async function getServerAlarmTicketPolicy() {
  return requestClient.get<AlertConfigApi.TicketPolicy>(
    '/assets/alert-config/ticket-policy',
  );
}

/**
 * 更新服务器告警转工单策略
 */
export async function updateServerAlarmTicketPolicy(
  data: Partial<AlertConfigApi.TicketPolicy>,
) {
  return requestClient.put<AlertConfigApi.TicketPolicy>(
    '/assets/alert-config/ticket-policy',
    data,
  );
}

/**
 * 获取服务器告警静默匹配规则
 */
export async function getServerAlarmSilenceRules() {
  return requestClient.get<AlertConfigApi.ServerAlarmSilenceRule[]>(
    '/assets/alert-config/silence-rules',
  );
}

/**
 * 创建服务器告警静默匹配规则
 */
export async function createServerAlarmSilenceRule(
  data: AlertConfigApi.ServerAlarmSilenceRulePayload,
) {
  return requestClient.post<AlertConfigApi.ServerAlarmSilenceRule>(
    '/assets/alert-config/silence-rules',
    data,
  );
}

/**
 * 更新服务器告警静默匹配规则
 */
export async function updateServerAlarmSilenceRule(
  id: string,
  data: AlertConfigApi.ServerAlarmSilenceRulePayload,
) {
  return requestClient.put<AlertConfigApi.ServerAlarmSilenceRule>(
    `/assets/alert-config/silence-rules/${id}`,
    data,
  );
}

/**
 * 删除服务器告警静默匹配规则
 */
export async function deleteServerAlarmSilenceRule(id: string) {
  return requestClient.delete<boolean>(
    `/assets/alert-config/silence-rules/${id}`,
  );
}

/**
 * 启用/停用服务器告警静默匹配规则
 */
export async function toggleServerAlarmSilenceRule(id: string) {
  return requestClient.post<AlertConfigApi.ServerAlarmSilenceRule>(
    `/assets/alert-config/silence-rules/${id}/toggle`,
  );
}

/**
 * 测试服务器告警静默匹配规则
 */
export async function testServerAlarmSilenceRules(text: string) {
  return requestClient.post<AlertConfigApi.ServerAlarmSilenceRuleTestResult>(
    '/assets/alert-config/silence-rules/test',
    { text },
  );
}
