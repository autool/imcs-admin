import { requestClient } from '#/api/request';

// 获取通知列表
export async function getNotificationListApi(params?: {
  level?: string;
  limit?: number;
  skip?: number;
  type?: string;
  unread_only?: boolean;
}) {
  return requestClient.get('/system/notifications/list', { params });
}

export interface CreateNotificationParams {
  content: string;
  data?: Record<string, any>;
  expires_days?: number;
  level?: 'error' | 'info' | 'success' | 'warning';
  notification_type?: string;
  title: string;
  user_ids?: string[];
}

export async function createNotificationApi(data: CreateNotificationParams) {
  return requestClient.post('/system-config/notification/notifications', data);
}

// 标记通知为已读
export async function markNotificationReadApi(notificationId: string) {
  return requestClient.post(`/system/notifications/${notificationId}/read`);
}

// 获取未读通知数量
export async function getUnreadCountApi() {
  return requestClient.get('/system/notifications/unread-count');
}

// 标记所有通知为已读
export async function markAllReadApi() {
  return requestClient.post('/system/notifications/mark-all-read');
}

// 删除通知
export async function deleteNotificationApi(notificationId: string) {
  return requestClient.delete(`/system/notifications/${notificationId}`);
}
