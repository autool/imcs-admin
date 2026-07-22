import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    [key: string]: any;
    id: string;
    username: string;
    email: string;
    full_name: string;
    department: string;
    department_id: string;
    region_id?: string;
    region_name?: string;
    position: string;
    phone: string;
    mobile_phone?: string;
    auth_type?: string;
    ldap_disabled?: boolean | null;
    directory_status?: string;
    status: 0 | 1;
    is_admin: boolean;
    admin_type?: 0 | 1 | 2;
    roles: string[];
    role_names?: string[];
    last_login?: string;
    created_at: string;
  }
}

/**
 * 获取用户列表数据
 */
async function getUserList(params?: Recordable<any>) {
  return requestClient.get<{
    list: Array<SystemUserApi.SystemUser>;
    total: number;
  }>('/system/user/list', { params });
}

/**
 * 获取全量用户列表（自动翻页）
 */
async function getAllUsers(params?: Recordable<any>) {
  const pageSize = Math.max(Number(params?.pageSize ?? 1000) || 1000, 1);
  const mergedParams = { ...params };
  delete mergedParams.page;
  delete mergedParams.pageSize;

  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  const list: SystemUserApi.SystemUser[] = [];

  while (list.length < total) {
    const response = await getUserList({
      ...mergedParams,
      page,
      pageSize,
    });
    const pageList = response.list || [];
    total = Number(response.total || 0);
    list.push(...pageList);
    if (pageList.length < pageSize) {
      break;
    }
    page += 1;
  }

  return {
    list,
    total: total === Number.POSITIVE_INFINITY ? list.length : total,
  };
}

/**
 * 创建用户
 * @param data 用户数据
 */
async function createUser(
  data: Omit<
    SystemUserApi.SystemUser,
    'created_at' | 'department' | 'id' | 'last_login'
  >,
) {
  return requestClient.post('/system/user', data);
}

/**
 * 更新用户
 *
 * @param id 用户 ID
 * @param data 用户数据
 */
async function updateUser(
  id: string,
  data: Omit<
    SystemUserApi.SystemUser,
    'created_at' | 'department' | 'id' | 'last_login'
  >,
) {
  return requestClient.put(`/system/user/${id}`, data);
}

/**
 * 删除用户
 * @param id 用户 ID
 */
async function deleteUser(id: string) {
  return requestClient.delete(`/system/user/${id}`);
}

export { createUser, deleteUser, getAllUsers, getUserList, updateUser };

// ==================== 个人中心 API ====================

/**
 * 获取当前用户个人信息
 */
async function getMyProfile() {
  return requestClient.get<SystemUserApi.SystemUser>('/system/user/me');
}

/**
 * 更新当前用户个人信息
 */
async function updateMyProfile(data: {
  email?: string;
  full_name?: string;
  mobile_phone?: string;
}) {
  return requestClient.put<SystemUserApi.SystemUser>('/system/user/me', data);
}

/**
 * 修改当前用户密码
 */
async function changePassword(data: {
  new_password: string;
  old_password: string;
}) {
  return requestClient.put('/system/user/me/password', data);
}

export { changePassword, getMyProfile, updateMyProfile };

/**
 * 通知偏好设置接口
 */
export interface NotificationPreferences {
  system_message: boolean;
  alert_notification: boolean;
  task_notification: boolean;
  email_system: boolean;
  email_alert: boolean;
  email_task: boolean;
  sound_enabled: boolean;
  desktop_enabled: boolean;
  quiet_mode: boolean;
  quiet_start: string;
  quiet_end: string;
}

/**
 * 获取当前用户的通知偏好设置
 */
async function getNotificationPreferences() {
  return requestClient.get<NotificationPreferences>(
    '/system/user/me/notification-preferences',
  );
}

/**
 * 更新当前用户的通知偏好设置
 */
async function updateNotificationPreferences(
  data: Partial<NotificationPreferences>,
) {
  return requestClient.put<NotificationPreferences>(
    '/system/user/me/notification-preferences',
    data,
  );
}

export { getNotificationPreferences, updateNotificationPreferences };

// ==================== 安全设置 API ====================

/**
 * 发送手机验证码
 */
async function sendPhoneCode(phone: string) {
  return requestClient.post<{ expires_in: number }>(
    '/system/user/me/security/send-phone-code',
    { phone },
  );
}

/**
 * 验证并绑定手机
 */
async function verifyPhone(phone: string, code: string) {
  return requestClient.post('/system/user/me/security/verify-phone', {
    phone,
    code,
  });
}

/**
 * 解绑手机
 */
async function unbindPhone() {
  return requestClient.post('/system/user/me/security/unbind-phone');
}

/**
 * 发送邮件验证码
 */
async function sendEmailCode(email: string) {
  return requestClient.post<{ expires_in: number }>(
    '/system/user/me/security/send-email-code',
    { email },
  );
}

/**
 * 验证并绑定邮箱
 */
async function verifyEmail(email: string, code: string) {
  return requestClient.post('/system/user/me/security/verify-email', {
    email,
    code,
  });
}

/**
 * 解绑邮箱
 */
async function unbindEmail() {
  return requestClient.post('/system/user/me/security/unbind-email');
}

/**
 * 获取 MFA 绑定信息
 */
async function getMfaSetup() {
  return requestClient.post<{
    enabled: boolean;
    qr_code_url?: string;
    secret?: string;
  }>('/system/user/me/mfa/setup');
}

/**
 * 启用 MFA
 */
async function enableMfa(code: string) {
  return requestClient.post<{ backup_codes: string[] }>(
    '/system/user/me/mfa/enable',
    { code },
  );
}

/**
 * 禁用 MFA
 */
async function disableMfa(code: string) {
  return requestClient.post('/system/user/me/mfa/disable', { code });
}

/**
 * 查询 MFA 状态
 */
async function getMfaStatus() {
  return requestClient.get<{
    backup_remaining: number;
    enabled: boolean;
  }>('/system/user/me/mfa/status');
}

/**
 * 获取安全状态汇总
 */
async function getSecurityStatus() {
  return requestClient.get<{
    auth_type: string;
    email_bound: boolean;
    mfa_enabled: boolean;
    phone_bound: boolean;
  }>('/system/user/me/security/status');
}

export {
  disableMfa,
  enableMfa,
  getMfaSetup,
  getMfaStatus,
  getSecurityStatus,
  sendEmailCode,
  sendPhoneCode,
  unbindEmail,
  unbindPhone,
  verifyEmail,
  verifyPhone,
};
