import { requestClient } from '#/api/request';

export namespace AuditLogApi {
  export interface AuditLog {
    action: string;
    after_data?: any;
    before_data?: any;
    created_at: string;
    error_message?: string;
    id: string;
    ip_address?: string;
    module: string;
    operator_id?: string;
    operator_name?: string;
    result: string;
    summary?: string;
    target_id?: string;
    target_type: string;
    user_agent?: string;
  }

  export interface AuditLogListParams {
    action?: string;
    limit?: number;
    module?: string;
    operator_name?: string;
    result?: string;
    search?: string;
    skip?: number;
    start_time?: string;
    target_type?: string;
    end_time?: string;
  }
}

export async function getAuditLogsApi(params?: AuditLogApi.AuditLogListParams) {
  return requestClient.get<{
    list: AuditLogApi.AuditLog[];
    total: number;
    total_exact?: boolean;
  }>('/audit/logs', { params });
}
