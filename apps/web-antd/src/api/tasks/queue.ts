/**
 * 任务队列观测 API
 */
import { requestClient } from '#/api/request';

export namespace TaskQueueApi {
  /** Celery 任务明细 */
  export interface QueueTask {
    args: string;
    eta?: string;
    id: string;
    kwargs: string;
    name: string;
    queue: string;
    routing_key: string;
    state: 'active' | 'reserved' | 'scheduled' | string;
    time_start?: number;
    worker: string;
  }

  /** 最近任务执行记录 */
  export interface RecentExecution {
    active_executions: number;
    collected: number;
    diagnosis_reason: string;
    end_time?: string;
    failed: number;
    failure_category?: string;
    failure_summary?: string;
    id: string;
    last_run_at: string;
    last_run_status: string;
    node_id: string;
    next_run_at: string;
    source: string;
    start_time: string;
    status: string;
    stale: boolean;
    stale_seconds: number;
    system_closed?: boolean;
    task_name: string;
    task_scheduled_id: string;
    task_type: string;
    total: number;
    updated_at: string;
  }

  /** Celery Worker 状态 */
  export interface QueueWorker {
    source: string;
    source_name: string;
    name: string;
    status: string;
    queues: string[];
    active: number;
    active_tasks: QueueTask[];
    reserved: number;
    reserved_tasks: QueueTask[];
    scheduled: number;
    scheduled_tasks: QueueTask[];
    processed: Record<string, number>;
    pool: {
      implementation?: string;
      max_concurrency?: number;
    };
  }

  /** Celery 队列状态 */
  export interface QueueItem {
    source: string;
    source_name: string;
    name: string;
    active: number;
    reserved: number;
    scheduled: number;
  }

  /** Celery 来源状态 */
  export interface QueueSource {
    key: string;
    name: string;
    online: boolean;
    broker_url: string;
    result_backend: string;
    workers: QueueWorker[];
    queues: QueueItem[];
    summary: QueueStatus['summary'];
    error?: string;
  }

  /** 任务队列观测结果 */
  export interface QueueStatus {
    online: boolean;
    inspected_at: string;
    broker_url: string;
    result_backend: string;
    workers: QueueWorker[];
    queues: QueueItem[];
    recent_executions: RecentExecution[];
    sources: QueueSource[];
    summary: {
      active: number;
      reserved: number;
      scheduled: number;
      worker_count: number;
    };
    error?: string;
    refreshing: boolean;
    stale: boolean;
  }
}

/**
 * 获取 Celery 队列运行状态
 */
export interface QueueStatusRequestOptions {
  detailed?: boolean;
  forceRefresh?: boolean;
  recentExecutions?: boolean;
  timeout?: number;
}

export async function getTaskQueueStatusApi(
  forceRefreshOrOptions: boolean | QueueStatusRequestOptions = false,
) {
  const options =
    typeof forceRefreshOrOptions === 'boolean'
      ? { forceRefresh: forceRefreshOrOptions }
      : forceRefreshOrOptions;
  const forceRefresh = options.forceRefresh ?? false;

  return requestClient.get<TaskQueueApi.QueueStatus>('/tasks/queue/status', {
    params: {
      force_refresh: forceRefresh,
      detailed: options.detailed ?? true,
      recent_executions: options.recentExecutions ?? true,
      timeout: options.timeout ?? (forceRefresh ? 1.2 : 0.5),
    },
  });
}
