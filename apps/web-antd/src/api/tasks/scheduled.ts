/**
 * 定时任务管理 API
 */
import { requestClient } from '#/api/request';

export namespace ScheduledTasksApi {
  /** 定时任务信息 */
  export interface ScheduledTask {
    id: string;
    task_name: string;
    task_type: string;
    dispatch_mode?: 'agent' | 'celery';
    node_id?: string;
    queue_name?: null | string;
    requires_node?: boolean;
    schedule_rule: Record<string, any>;
    description?: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
    next_run_at?: null | string;
    last_run_at?: null | string;
    last_run_status?: null | string;
    last_failure_category?: null | string;
    last_failure_summary?: null | string;
    last_system_closed?: boolean;
    archive_count?: number;
  }

  /** 定时任务详情 */
  export interface ScheduledTaskDetail {
    id: string;
    task_name: string;
    task_type: string;
    dispatch_mode?: 'agent' | 'celery';
    node_id?: string;
    queue_name?: null | string;
    requires_node?: boolean;
    schedule_rule: Record<string, any>;
    description?: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
    next_run_at?: null | string;
    last_run_at?: null | string;
    last_run_status?: null | string;
    last_failure_category?: null | string;
    last_failure_summary?: null | string;
    last_system_closed?: boolean;
    archive_count?: number;
  }

  /** 创建任务请求 */
  export interface CreateTaskRequest {
    task_name: string;
    task_type: string;
    schedule_rule: Record<string, any>; // 包含 cron 和 params
    description?: string;
    enabled?: boolean;
    node_id?: string;
  }

  /** 更新任务请求 */
  export interface UpdateTaskRequest {
    task_name?: string;
    schedule_rule?: Record<string, any>; // 包含 cron 和 params
    description?: string;
    enabled?: boolean;
    node_id?: string;
  }

  /** 任务列表响应 */
  export interface TaskListResponse {
    total: number;
    list: ScheduledTask[];
  }

  /** 查询参数 */
  export interface QueryParams {
    archive_scope?: 'active' | 'archived';
    skip?: number;
    limit?: number;
    task_type?: string;
    enabled?: boolean;
    search?: string;
    node_id?: string;
  }

  /** 任务类型 */
  export interface TaskType {
    value: string;
    label: string;
    description: string;
    default_cron: string;
    cron_description: string;
    dispatch_mode?: 'agent' | 'celery';
    node_type: string;
    params_schema: Record<string, any>;
    queue_name?: null | string;
    requires_node?: boolean;
  }

  /** 立即执行响应 */
  export interface RunTaskResponse {
    task_id: string;
    task_name: string;
    task_type: string;
    celery_task_id: string;
    dispatch_mode?: 'celery' | 'scheduled';
    execution_id: string;
    message: string;
  }
}

/**
 * 获取定时任务列表
 */
export async function getScheduledTasksApi(
  params?: ScheduledTasksApi.QueryParams,
) {
  return requestClient.get<ScheduledTasksApi.TaskListResponse>(
    '/tasks/scheduled/list',
    { params },
  );
}

/**
 * 获取定时任务详情
 */
export async function getScheduledTaskApi(id: string) {
  return requestClient.get<ScheduledTasksApi.ScheduledTaskDetail>(
    `/tasks/scheduled/${id}`,
  );
}

/**
 * 创建定时任务
 */
export async function createScheduledTaskApi(
  data: ScheduledTasksApi.CreateTaskRequest,
) {
  return requestClient.post<{ id: string }>('/tasks/scheduled/create', data);
}

/**
 * 更新定时任务
 */
export async function updateScheduledTaskApi(
  id: string,
  data: ScheduledTasksApi.UpdateTaskRequest,
) {
  return requestClient.put(`/tasks/scheduled/${id}`, data);
}

/**
 * 删除定时任务
 */
export async function deleteScheduledTaskApi(id: string) {
  return requestClient.delete(`/tasks/scheduled/${id}`);
}

/**
 * 启用定时任务
 */
export async function enableScheduledTaskApi(id: string) {
  return requestClient.post(`/tasks/scheduled/${id}/enable`);
}

/**
 * 禁用定时任务
 */
export async function disableScheduledTaskApi(id: string) {
  return requestClient.post(`/tasks/scheduled/${id}/disable`);
}

/**
 * 立即执行定时任务
 */
export async function runScheduledTaskNowApi(id: string) {
  return requestClient.post<ScheduledTasksApi.RunTaskResponse>(
    `/tasks/scheduled/${id}/run`,
  );
}

/**
 * 扫描到期任务并投递
 */
export async function scanDueScheduledTasksApi(limit = 20) {
  return requestClient.post<Record<string, any>>(
    '/tasks/scheduled/scheduler/scan-due',
    undefined,
    { params: { limit } },
  );
}

/**
 * 获取任务类型列表
 */
export async function getTaskTypesApi(params?: { node_id?: string }) {
  return requestClient.get<ScheduledTasksApi.TaskType[]>(
    '/tasks/scheduled/types/list',
    { params },
  );
}
