/**
 * 通知配置API
 */
import { requestClient } from '#/api/request';

export namespace NotificationConfigApi {
  /** 通知配置类型 */
  export type ConfigType = 'email' | 'webhook' | 'wecom';

  /** 邮箱配置 */
  export interface EmailConfig {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    from_email: string;
    from_name?: string;
    use_tls?: boolean;
    use_ssl?: boolean;
  }

  /** 企业微信配置 */
  export interface WeComConfig {
    corp_id: string;
    agent_id: string;
    secret: string;
    to_user?: string;
    to_party?: string;
    to_tag?: string;
  }

  /** Webhook配置 */
  export interface WebhookConfig {
    webhook_type: 'custom' | 'dingtalk' | 'feishu' | 'wecom';
    webhook_url: string;
    secret?: string;
    headers?: Record<string, string>;
    method?: string;
    content_type?: string;
    support_markdown?: boolean;
  }

  /** 通知配置 */
  export interface NotificationConfig {
    id: string;
    name: string;
    config_type: ConfigType;
    config_data: EmailConfig | WebhookConfig | WeComConfig;
    is_enabled: boolean;
    is_default: boolean;
    description?: string;
    create_time: string;
    update_time: string;
  }

  /** 创建通知配置请求 */
  export interface CreateConfigRequest {
    name: string;
    config_type: ConfigType;
    config_data: EmailConfig | WebhookConfig | WeComConfig;
    is_enabled?: boolean;
    is_default?: boolean;
    description?: string;
  }

  /** 更新通知配置请求 */
  export interface UpdateConfigRequest {
    name?: string;
    config_data?: EmailConfig | WebhookConfig | WeComConfig;
    is_enabled?: boolean;
    is_default?: boolean;
    description?: string;
  }

  /** 测试通知请求 */
  export interface TestNotificationRequest {
    config_id: string;
    test_content?: string;
    test_email?: string;
  }

  /** 查询参数 */
  export interface QueryParams {
    config_type?: ConfigType;
    is_enabled?: boolean;
    skip?: number;
    limit?: number;
  }
}

/**
 * 获取通知配置列表
 */
export async function getNotificationConfigsApi(
  params?: NotificationConfigApi.QueryParams,
) {
  return requestClient.get<{
    list: NotificationConfigApi.NotificationConfig[];
    total: number;
  }>('/system-config/notification-configs/', { params });
}

/**
 * 获取通知配置详情
 */
export async function getNotificationConfigApi(id: string) {
  return requestClient.get<NotificationConfigApi.NotificationConfig>(
    `/system-config/notification-configs/${id}`,
  );
}

/**
 * 创建通知配置
 */
export async function createNotificationConfigApi(
  data: NotificationConfigApi.CreateConfigRequest,
) {
  return requestClient.post<NotificationConfigApi.NotificationConfig>(
    '/system-config/notification-configs/',
    data,
  );
}

/**
 * 更新通知配置
 */
export async function updateNotificationConfigApi(
  id: string,
  data: NotificationConfigApi.UpdateConfigRequest,
) {
  return requestClient.put<NotificationConfigApi.NotificationConfig>(
    `/system-config/notification-configs/${id}`,
    data,
  );
}

/**
 * 删除通知配置
 */
export async function deleteNotificationConfigApi(id: string) {
  return requestClient.delete(`/system-config/notification-configs/${id}`);
}

/**
 * 测试通知配置
 */
export async function testNotificationConfigApi(
  data: NotificationConfigApi.TestNotificationRequest,
) {
  return requestClient.post('/system-config/notification-configs/test', data);
}
