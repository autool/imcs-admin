/**
 * 任务执行记录 API
 */
import { requestClient } from '#/api/request';

export interface TaskExecutionItem {
  id: string;
  task_scheduled_id: string;
  task_name: string;
  task_type: string;
  status: string;
  total: number;
  collected: number;
  failed: number;
  failed_devices?: any;
  failure_category?: string;
  failure_summary?: string;
  system_closed?: boolean;
  start_time: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  stale?: boolean;
}

export interface TaskExecutionListResponse {
  total: number;
  total_exact?: boolean;
  list: TaskExecutionItem[];
}

export interface TaskExecutionSummaryItem {
  task_scheduled_id: string;
  task_name: string;
  task_type: string;
  total_executions: number;
  success_count: number;
  failed_count: number;
  cleanup_count?: number;
  raw_failed_count?: number;
  last_execution_status: string;
  last_execution_time: string;
}

export interface TaskExecutionSummaryResponse {
  total: number;
  total_exact?: boolean;
  list: TaskExecutionSummaryItem[];
}

export async function getTaskExecutionSummaryApi(params?: {
  limit?: number;
  search?: string;
  skip?: number;
  task_type?: string;
}) {
  return requestClient.get<TaskExecutionSummaryResponse>(
    '/tasks/execution/summary',
    {
      params,
    },
  );
}

export async function getTaskExecutionListApi(params?: {
  limit?: number;
  search?: string;
  skip?: number;
  status?: string;
  task_name?: string;
  task_scheduled_id?: string;
  task_type?: string;
}) {
  return requestClient.get<TaskExecutionListResponse>('/tasks/execution/list', {
    params,
  });
}

export async function getTaskExecutionDetailApi(
  id: string,
  params?: {
    detail_limit?: number;
    detail_skip?: number;
  },
) {
  return requestClient.get(`/tasks/execution/${id}`, { params });
}

export async function rerunTaskExecutionApi(id: string) {
  return requestClient.post<{
    celery_task_id?: string;
    dispatch_mode?: 'celery' | 'scheduled';
    execution_id?: string;
    task_id: string;
  }>(`/tasks/execution/${id}/rerun`);
}

export async function closeStaleTaskExecutionApi(
  id: string,
  reason = '人工收口疑似卡死任务',
) {
  return requestClient.post<{
    id: string;
    previous_status: string;
    status: string;
    task_name: string;
    task_scheduled_id: string;
    task_type: string;
  }>(`/tasks/execution/${id}/close-stale`, { reason });
}

export async function ensureTaskExecutionTicketApi(id: string) {
  return requestClient.post<{
    created?: boolean;
    ticket?: null | {
      id: string;
      status: string;
      title: string;
    };
  }>(`/tasks/execution/${id}/ticket`);
}
