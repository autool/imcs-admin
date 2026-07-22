/**
 * 反馈建议 API
 */
import { requestClient } from '#/api/request';

export namespace FeedbackApi {
  export interface FeedbackCreate {
    title: string;
    content: string;
    type?: string;
    category?: string;
    priority?: string;
  }

  export interface Feedback {
    id: string;
    title: string;
    content: string;
    status: string;
    type: string;
    created_at: string;
    ticket_id?: string;
  }
}

/**
 * 提交反馈（自动转为工单）
 */
export async function submitFeedbackApi(data: FeedbackApi.FeedbackCreate) {
  return requestClient.post('/operation/ticket/tickets', {
    title: data.title,
    type: 'request',
    description: data.content,
    category: data.category,
    priority: data.priority || 'low',
    source_type: 'feedback',
  });
}

/**
 * 获取我的反馈（工单列表过滤 source_type=feedback）
 */
export async function getMyFeedbackApi(params?: {
  page?: number;
  page_size?: number;
}) {
  return requestClient.get<{ items: FeedbackApi.Feedback[]; total: number }>(
    '/operation/ticket/tickets',
    {
      params: {
        ...params,
        scope: 'my_created',
        source_type: 'feedback',
      },
    },
  );
}
