/**
 * 工作流工作台 API
 */
import { requestClient } from '#/api/request';

export namespace WorkflowApi {
  export interface Stats {
    my_pending: number;
    my_processing: number;
    my_overdue: number;
    my_completed: number;
    total_completed: number;
    total_tickets: number;
  }

  export interface SourceItem {
    source_type: string;
    count: number;
  }

  export interface Topology {
    sources: SourceItem[];
    pool_count: number;
    status_distribution: Record<string, number>;
  }

  export interface TodoItem {
    id: string;
    ticket_id: string;
    title: string;
    source_type: string;
    priority?: string;
    status: string;
    current_node_name?: string;
    item_kind?: 'ticket' | 'workflow';
    node_type?: string;
    assignee_id?: string;
    created_at?: string;
    due_date?: string;
    source_data?: Record<string, any>;
  }

  export interface NodeComplete {
    completed_node_id: string;
    next_node_id?: string;
    workflow_complete: boolean;
    ticket_status: string;
  }

  export interface WorkflowRecord {
    id: string;
    ticket_id: string;
    node_id: string;
    node_type: string;
    assignee_id: string;
    assignee_name?: string;
    status: string;
    action_taken?: string;
    comment?: string;
    started_at?: string;
    completed_at?: string;
  }

  export interface WorkflowProgress {
    ticket_id: string;
    template?: { code: string; id: string; name: string };
    current_node_id?: string;
    records: WorkflowRecord[];
  }

  export interface TimeoutCheckResult {
    timeout_count: number;
    escalated_count: number;
    auto_completed_count: number;
    created_ticket_count: number;
  }
}

/**
 * 获取工作台统计
 */
export async function getWorkflowStatsApi() {
  return requestClient.get<WorkflowApi.Stats>('/operation/workflow/stats');
}

/**
 * 获取工作流拓扑
 */
export async function getWorkflowTopologyApi() {
  return requestClient.get<WorkflowApi.Topology>(
    '/operation/workflow/topology',
  );
}

/**
 * 获取我的待办
 */
export async function getMyTodosApi(params?: {
  page?: number;
  page_size?: number;
}) {
  return requestClient.get<{ items: WorkflowApi.TodoItem[]; total: number }>(
    '/operation/workflow/my-todos',
    { params },
  );
}

/**
 * 完成当前节点
 */
export async function completeNodeApi(
  ticketId: string,
  action: string,
  comment?: string,
) {
  return requestClient.post<WorkflowApi.NodeComplete>(
    `/operation/workflow/complete/${ticketId}`,
    {
      action,
      comment,
    },
  );
}

/**
 * 扫描并处置超时节点
 */
export async function checkWorkflowTimeoutsApi() {
  return requestClient.post<WorkflowApi.TimeoutCheckResult>(
    '/operation/workflow/check-timeouts',
  );
}

/**
 * 获取工单流程进度
 */
export async function getWorkflowProgressApi(ticketId: string) {
  return requestClient.get<WorkflowApi.WorkflowProgress>(
    `/operation/workflow/progress/${ticketId}`,
  );
}
