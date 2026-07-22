import { requestClient } from '#/api/request';

export namespace NotificationPolicyApi {
  export interface Policy {
    id: string;
    name: string;
    event_type: string;
    severity: string;
    enabled: boolean;
    channel_ids: string[];
    recipient_user_ids: string[];
    recipient_emails: string[];
    description?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
  }

  export interface PolicyPayload {
    name: string;
    event_type: string;
    severity?: string;
    enabled?: boolean;
    channel_ids?: string[];
    recipient_user_ids?: string[];
    recipient_emails?: string[];
    description?: string;
  }

  export interface QueryParams {
    enabled?: boolean;
    event_type?: string;
    limit?: number;
    search?: string;
    skip?: number;
  }
}

export async function getNotificationPoliciesApi(
  params?: NotificationPolicyApi.QueryParams,
) {
  return requestClient.get<{
    list: NotificationPolicyApi.Policy[];
    total: number;
  }>('/system-config/notification-policies', { params });
}

export async function createNotificationPolicyApi(
  data: NotificationPolicyApi.PolicyPayload,
) {
  return requestClient.post<NotificationPolicyApi.Policy>(
    '/system-config/notification-policies',
    data,
  );
}

export async function updateNotificationPolicyApi(
  id: string,
  data: Partial<NotificationPolicyApi.PolicyPayload>,
) {
  return requestClient.put<NotificationPolicyApi.Policy>(
    `/system-config/notification-policies/${id}`,
    data,
  );
}

export async function deleteNotificationPolicyApi(id: string) {
  return requestClient.delete(`/system-config/notification-policies/${id}`);
}
