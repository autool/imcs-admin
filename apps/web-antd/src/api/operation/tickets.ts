/**
 * 工单管理 API
 */
import { baseRequestClient, requestClient } from '#/api/request';

export namespace TicketsApi {
  export interface Ticket {
    id: string;
    title: string;
    type: string;
    priority?: string;
    status: string;
    description?: string;
    requester_id: string;
    assignee_id?: string;
    department?: string;
    category?: string;
    due_date?: string;
    source_type?: string;
    source_ref_id?: string;
    source_data?: Record<string, any>;
    template_id?: string;
    current_node_id?: string;
    created_at: string;
    updated_at: string;
    workflow_completed_at?: string;
  }

  export interface TicketCreate {
    title: string;
    type?: string;
    priority?: string;
    description?: string;
    assignee_id?: string;
    department?: string;
    category?: string;
    due_date?: string;
    source_type?: string;
    source_ref_id?: string;
    source_data?: Record<string, any>;
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

  export interface ClosureAction {
    key: string;
    label: string;
  }

  export interface SourceActionResult {
    celery_task_id?: string;
    dispatch_mode?: string;
    execution_id?: string;
    message?: string;
    success: boolean;
    task_id?: string;
    updated?: boolean;
  }

  export interface ClosureContext {
    ticket: Ticket;
    source: {
      data: Record<string, any>;
      found: boolean;
      ref_id?: string;
      type: string;
    };
    workflow: Record<string, any>[];
    comments: Record<string, any>[];
    attachments: TicketAttachment[];
    actions: ClosureAction[];
  }

  export interface TicketAttachment {
    created_at: string;
    download_url: string;
    file_size: number;
    file_type: string;
    filename: string;
    id: string;
    user_id: string;
  }

  export interface TicketListResult {
    items: Ticket[];
    list: Ticket[];
    total: number;
  }
}

/**
 * 获取工单列表
 */
export async function getTicketsApi(params?: {
  assignee_id?: string;
  page?: number;
  page_size?: number;
  priority?: string;
  scope?: string;
  search?: string;
  source_type?: string;
  status?: string;
  type?: string;
}) {
  const result = await requestClient.get<{
    items?: TicketsApi.Ticket[];
    list?: TicketsApi.Ticket[];
    total: number;
  }>('/operation/ticket/tickets', { params });
  const rows = result.items || result.list || [];
  return {
    ...result,
    items: rows,
    list: rows,
  };
}

/**
 * 获取我提交的工单
 */
export async function getMyTicketsApi(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  const result = await requestClient.get<{
    items?: TicketsApi.Ticket[];
    list?: TicketsApi.Ticket[];
    total: number;
  }>('/operation/ticket/tickets', {
    params: {
      ...params,
      scope: 'my_created',
    },
  });
  const rows = result.items || result.list || [];
  return {
    ...result,
    items: rows,
    list: rows,
  };
}

/**
 * 创建工单
 */
export async function createTicketApi(data: TicketsApi.TicketCreate) {
  return requestClient.post('/operation/ticket/tickets', data);
}

/**
 * 获取工单详情
 */
export async function getTicketDetailApi(id: string) {
  return requestClient.get<TicketsApi.Ticket>(
    `/operation/ticket/tickets/${id}`,
  );
}

/**
 * 获取工单闭环上下文
 */
export async function getTicketClosureContextApi(id: string) {
  return requestClient.get<TicketsApi.ClosureContext>(
    `/operation/ticket/tickets/${id}/context`,
  );
}

/**
 * 执行来源闭环动作
 */
export async function executeTicketSourceActionApi(
  ticketId: string,
  action: string,
  comment?: string,
  payload: Record<string, any> = {},
) {
  return requestClient.post<TicketsApi.SourceActionResult>(
    `/operation/ticket/tickets/${ticketId}/source-action`,
    {
      action,
      comment,
      payload,
    },
  );
}

/**
 * 添加工单评论
 */
export async function createCommentApi(
  ticketId: string,
  content: string,
  isInternal = false,
) {
  return requestClient.post(`/operation/ticket/tickets/${ticketId}/comments`, {
    content,
    is_internal: isInternal,
  });
}

/**
 * 上传工单附件
 */
export async function uploadAttachmentApi(ticketId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post(
    `/operation/ticket/tickets/${ticketId}/attachments`,
    formData,
  );
}

export async function downloadTicketAttachmentApi(
  ticketId: string,
  attachmentId: string,
) {
  return baseRequestClient.get(
    `/operation/ticket/tickets/${ticketId}/attachments/${attachmentId}/download`,
    { responseType: 'blob' },
  );
}

export async function deleteTicketAttachmentApi(
  ticketId: string,
  attachmentId: string,
) {
  return requestClient.delete(
    `/operation/ticket/tickets/${ticketId}/attachments/${attachmentId}`,
  );
}

/**
 * 分配工单
 */
export async function assignTicketApi(ticketId: string, assigneeId: string) {
  return requestClient.post(`/operation/ticket/assign/${ticketId}`, {
    assignee_id: assigneeId,
  });
}

/**
 * 更新工单状态
 */
export async function updateTicketStatusApi(ticketId: string, status: string) {
  return requestClient.post(`/operation/ticket/status/${ticketId}`, { status });
}

/**
 * 获取工单统计
 */
export async function getTicketStatsApi() {
  return requestClient.get<{
    my_completed: number;
    my_overdue: number;
    my_pending: number;
    my_processing: number;
    total_completed: number;
    total_tickets: number;
  }>('/operation/ticket/stats');
}

/**
 * 获取工单流程进度
 */
export async function getWorkflowProgressApi(ticketId: string) {
  return requestClient.get<TicketsApi.WorkflowProgress>(
    `/operation/workflow/progress/${ticketId}`,
  );
}
