import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace DefaultCredentialApi {
  export type DeviceType = 'device' | 'server' | 'switch';
  export type CredentialScope = 'global' | 'instance' | 'vendor';

  export interface DefaultCredential {
    id: string;
    name: string;
    device_type: DeviceType;
    protocol: string;
    credential_scope: CredentialScope;
    vendor_key: string;
    target_ip: string;
    target_device_id: string;
    username: string;
    password: string;
    is_enabled: boolean;
    is_default: boolean;
    description: string;
    created_at: string;
    updated_at: string;
  }

  export interface DefaultCredentialFormData {
    name: string;
    device_type: DeviceType;
    protocol: string;
    credential_scope?: CredentialScope;
    vendor_key?: string;
    target_ip?: string;
    target_device_id?: string;
    username: string;
    password?: string;
    is_enabled?: boolean;
    is_default?: boolean;
    description?: string;
  }

  export interface DefaultCredentialUsable {
    id: string;
    name: string;
    device_type: DeviceType;
    protocol: string;
    credential_scope: CredentialScope;
    vendor_key: string;
    target_ip: string;
    target_device_id: string;
    username: string;
    is_default: boolean;
    description: string;
  }
}

async function getDefaultCredentialList(params?: Recordable<any>) {
  return requestClient.get<{
    list: DefaultCredentialApi.DefaultCredential[];
    total: number;
  }>('/system/default-credentials/list', { params });
}

async function getUsableDefaultCredentials(params?: {
  device_type?: DefaultCredentialApi.DeviceType;
  protocol?: string;
  target_device_id?: string;
  target_ip?: string;
  vendor_key?: string;
}) {
  return requestClient.get<{
    items: DefaultCredentialApi.DefaultCredentialUsable[];
  }>('/system/default-credentials/usable', { params });
}

async function backfillDefaultCredentials() {
  return requestClient.post<{
    created_count: number;
    items: DefaultCredentialApi.DefaultCredential[];
  }>('/system/default-credentials/backfill-existing');
}

async function createDefaultCredential(
  data: DefaultCredentialApi.DefaultCredentialFormData,
) {
  return requestClient.post('/system/default-credentials', data);
}

async function updateDefaultCredential(
  id: string,
  data: DefaultCredentialApi.DefaultCredentialFormData,
) {
  return requestClient.put(`/system/default-credentials/${id}`, data);
}

async function deleteDefaultCredential(id: string) {
  return requestClient.delete(`/system/default-credentials/${id}`);
}

export {
  backfillDefaultCredentials,
  createDefaultCredential,
  deleteDefaultCredential,
  getDefaultCredentialList,
  getUsableDefaultCredentials,
  updateDefaultCredential,
};
