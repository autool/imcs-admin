import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SmsGatewayApi {
  export interface SmsGateway {
    id: string;
    name: string;
    provider: string;
    provider_label: string;
    access_key: string;
    sign_name: string;
    template_code: string;
    endpoint: string;
    region: string;
    is_enabled: boolean;
    is_default: boolean;
    description: string;
    rate_limit: number;
    daily_limit: number;
    created_at: string;
    updated_at: string;
  }

  export interface SmsGatewayFormData {
    name: string;
    provider: string;
    access_key: string;
    secret_key: string;
    sign_name?: string;
    template_code?: string;
    endpoint?: string;
    region?: string;
    is_enabled?: boolean;
    is_default?: boolean;
    description?: string;
    rate_limit?: number;
    daily_limit?: number;
  }
}

/**
 * 获取短信网关列表
 */
async function getSmsGatewayList(params?: Recordable<any>) {
  return requestClient.get<{
    list: Array<SmsGatewayApi.SmsGateway>;
    total: number;
  }>('/system/sms-gateway/list', { params });
}

/**
 * 创建短信网关配置
 */
async function createSmsGateway(data: SmsGatewayApi.SmsGatewayFormData) {
  return requestClient.post('/system/sms-gateway', data);
}

/**
 * 更新短信网关配置
 */
async function updateSmsGateway(
  id: string,
  data: SmsGatewayApi.SmsGatewayFormData,
) {
  return requestClient.put(`/system/sms-gateway/${id}`, data);
}

/**
 * 删除短信网关配置
 */
async function deleteSmsGateway(id: string) {
  return requestClient.delete(`/system/sms-gateway/${id}`);
}

/**
 * 获取支持的短信网关提供商
 */
async function getSmsProviders() {
  return requestClient.get<Record<string, string>>(
    '/system/sms-gateway/providers',
  );
}

/**
 * 测试短信发送
 */
async function testSmsGateway(configId: string, phone: string) {
  return requestClient.post('/system/sms-gateway/test', {
    config_id: configId,
    phone,
  });
}

export {
  createSmsGateway,
  deleteSmsGateway,
  getSmsGatewayList,
  getSmsProviders,
  testSmsGateway,
  updateSmsGateway,
};
