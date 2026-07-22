import type { Recordable } from '@vben/types';

import type { SystemUserApi } from '#/api/system/user';

import { getAllUsers } from '#/api/system/user';

export interface SystemUserOption {
  department?: string;
  label: string;
  username?: string;
  value: string;
}

function buildUserLabel(user: SystemUserApi.SystemUser) {
  const fullName = String(user.full_name || '').trim();
  const username = String(user.username || '').trim();
  if (fullName && username && fullName !== username) {
    return `${fullName} (${username})`;
  }
  return fullName || username;
}

export async function loadSystemUserOptions(params?: Recordable<any>) {
  const response = await getAllUsers({
    include_disabled: true,
    pageSize: 1000,
    ...params,
  });
  const options: SystemUserOption[] = (response.list || [])
    .filter((user) => user.id)
    .map((user) => ({
      department: user.department,
      label: buildUserLabel(user),
      username: user.username,
      value: user.id,
    }))
    .toSorted((left, right) => left.label.localeCompare(right.label, 'zh-CN'));

  const byId = new Map(options.map((option) => [option.value, option]));
  return { byId, options };
}
