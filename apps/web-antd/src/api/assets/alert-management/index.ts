import { baseRequestClient, requestClient } from '#/api/request';

export namespace AlertManagementApi {
  export interface Alert {
    alert_id: string;
    alert_ids?: string[];
    alert_code: string; // 告警代码
    alert_name: string; // 翻译后的中文告警名称
    alert_type: string;
    alert_type_text?: string;
    severity: string;
    severity_text?: string;
    source: string; // 告警来源（BMC等）
    source_text?: string;
    component?: string;
    component_text?: string;
    device_ip: string; // 设备IP
    assignee: string; // 资产负责人
    asset_location: string; // 资产位置
    handler: string; // 处理人员
    handler_user_id?: string;
    status: string;
    alert_time: string;
    handle_time: string;
    description: string;
    action_note?: string;
    handle_note?: string;
    handle_result?: string;
    close_reason_type?: string;
    close_reason_note?: string;
    close_reason?: string;
    ticket?: null | {
      id: string;
      status: string;
      title: string;
    };
    first_alert_time?: string;
    latest_alert_time?: string;
    merged_count?: number;
    group_priority?: number; // 优先级分组
    group_priority_name?: string; // 优先级分组名称
    // 补充设备详情字段
    device_model: string; // 设备型号
    device_sn: string; // 设备序列号
    idc_name: string; // 机房名称
    cabinet_name: string; // 机柜名称
    rack_u: string; // U位
  }

  export interface AlertListParams {
    page: number;
    pageSize: number;
    keyword?: string;
    alert_type?: string;
    severity?: string;
    status?: string;
    assignee?: string;
    handler?: string;
    group_priority?: number;
    merged?: boolean;
  }

  export interface AlertListResponse {
    items: Alert[];
    total: number;
  }

  export interface AlertTicketResponse {
    created?: boolean;
    exists?: boolean;
    ticket?: null | {
      id: string;
      source_ref_id?: string;
      source_type?: string;
      status: string;
      title: string;
    };
  }

  export interface AlertStatistics {
    by_ip?: any[];
    by_severity: Record<string, number>;
    by_source?: Record<string, number>;
    by_status: Record<string, number>;
    by_type?: any[];
    event_subscription?: {
      active: number;
      event_alarm_devices: number;
      last_verified?: string;
      total: number;
    };
  }
}

/**
 * 获取告警列表
 */
export async function getAlertList(params: AlertManagementApi.AlertListParams) {
  return requestClient.get<AlertManagementApi.AlertListResponse>(
    '/assets/alert-management/list',
    {
      params,
    },
  );
}

/**
 * 获取告警详情
 */
export async function getAlertDetail(id: string) {
  return requestClient.get(`/assets/alert-management/${id}`);
}

/**
 * 查看告警关联工单
 */
export async function getAlertTicket(id: string) {
  return requestClient.get<AlertManagementApi.AlertTicketResponse>(
    `/assets/alert-management/${id}/ticket`,
  );
}

/**
 * 转为告警工单；已存在时返回已有工单
 */
export async function ensureAlertTicket(id: string) {
  return requestClient.post<AlertManagementApi.AlertTicketResponse>(
    `/assets/alert-management/${id}/ticket`,
  );
}

/**
 * 处理告警
 */
export async function handleAlert(id: string, data: any) {
  return requestClient.post(`/assets/alert-management/${id}/handle`, data);
}

/**
 * 分配告警
 */
export async function assignAlert(
  id: string,
  data: { assignee?: string; assignee_user_id?: string },
) {
  return requestClient.post(`/assets/alert-management/${id}/assign`, data);
}

/**
 * 关闭告警
 */
export async function closeAlert(id: string, data: any) {
  return requestClient.post(`/assets/alert-management/${id}/close`, data);
}

/**
 * 批量处理告警
 */
export async function batchHandleAlerts(data: {
  action: string;
  alert_ids: string[];
  handle_note?: string;
  result?: string;
}) {
  return requestClient.post('/assets/alert-management/batch', data);
}

/**
 * 导出告警
 */
export async function exportAlerts(params: any) {
  return baseRequestClient.get('/assets/alert-management/export', {
    params,
    responseType: 'blob',
  });
}

/**
 * 获取告警统计
 */
export async function getAlertStatistics() {
  return requestClient.get<AlertManagementApi.AlertStatistics>(
    '/assets/alert-management/statistics',
  );
}
