import { requestClient } from '#/api/request';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  title_template: string;
  content_template: string;
  variables: Record<string, string>;
  notification_channels: string[];
  use_external: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplateListResponse {
  total: number;
  list: NotificationTemplate[];
}

export interface UpdateTemplateParams {
  title_template?: string;
  content_template?: string;
  notification_channels?: string[];
  use_external?: boolean;
}

export interface CreateTemplateParams {
  name: string;
  type: string;
  title_template: string;
  content_template: string;
  variables?: Record<string, string>;
  notification_channels?: string[];
  use_external?: boolean;
}

export async function getNotificationTemplateListApi() {
  return requestClient.get<NotificationTemplateListResponse>(
    '/system/notification-templates/list',
  );
}

export async function getNotificationTemplateDetailApi(id: string) {
  return requestClient.get<NotificationTemplate>(
    `/system/notification-templates/${id}`,
  );
}

export async function updateNotificationTemplateApi(
  id: string,
  data: UpdateTemplateParams,
) {
  return requestClient.put(`/system/notification-templates/${id}`, data);
}

export async function createNotificationTemplateApi(
  data: CreateTemplateParams,
) {
  return requestClient.post('/system/notification-templates', data);
}

export async function deleteNotificationTemplateApi(id: string) {
  return requestClient.delete(`/system/notification-templates/${id}`);
}
