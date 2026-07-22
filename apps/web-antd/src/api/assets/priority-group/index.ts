import { requestClient } from '#/api/request';

export namespace PriorityGroupApi {
  export interface PriorityGroup {
    id: string;
    name: string;
    description: string;
    priority_level: number; // 10/30/50/80
    priority_name: string;
    sort_order: number;
    member_count: number;
    color?: string;
    enabled?: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface GroupMember {
    id: string;
    server_id: string;
    ip_address: string;
    info: string;
    group_id: string;
    created_at: string;
  }

  export interface GroupDetail {
    id: string;
    name: string;
    priority_level: number;
    priority_name: string;
  }

  export interface GroupMembersResponse {
    items: GroupMember[];
    total: number;
    group: GroupDetail;
  }

  export interface AvailableServer {
    id: string;
    ip_address: string;
    info: string;
    region_id: string;
    current_group_id: string;
  }

  export interface AvailableServersResponse {
    items: AvailableServer[];
    total: number;
  }
}

/**
 * 获取所有优先级分组列表
 */
export async function getPriorityGroups() {
  return requestClient.get<PriorityGroupApi.PriorityGroup[]>(
    '/assets/priority-groups/groups',
  );
}

/**
 * 创建优先级分组
 */
export async function createPriorityGroup(data: {
  description?: string;
  name: string;
  priority_level: number;
  sort_order?: number;
}) {
  return requestClient.post('/assets/priority-groups/groups', data);
}

/**
 * 更新优先级分组
 */
export async function updatePriorityGroup(
  id: string,
  data: {
    description?: string;
    name?: string;
    priority_level?: number;
    sort_order?: number;
  },
) {
  return requestClient.put(`/assets/priority-groups/groups/${id}`, data);
}

/**
 * 删除优先级分组
 */
export async function deletePriorityGroup(id: string) {
  return requestClient.delete(`/assets/priority-groups/groups/${id}`);
}

/**
 * 获取分组成员列表
 */
export async function getGroupMembers(
  groupId: string,
  params: { page: number; pageSize: number },
) {
  return requestClient.get<PriorityGroupApi.GroupMembersResponse>(
    `/assets/priority-groups/groups/${groupId}/members`,
    { params },
  );
}

/**
 * 添加分组成员（批量）
 */
export async function addGroupMembers(groupId: string, serverIds: string[]) {
  return requestClient.post(
    `/assets/priority-groups/groups/${groupId}/members`,
    {
      server_ids: serverIds,
    },
  );
}

/**
 * 移除单个分组成员
 */
export async function removeGroupMember(groupId: string, memberId: string) {
  return requestClient.delete(
    `/assets/priority-groups/groups/${groupId}/members/${memberId}`,
  );
}

/**
 * 批量移除分组成员
 */
export async function batchRemoveGroupMembers(
  groupId: string,
  serverIds: string[],
) {
  return requestClient.post(
    `/assets/priority-groups/groups/${groupId}/members/batch-remove`,
    {
      server_ids: serverIds,
    },
  );
}

/**
 * 获取可分配到指定分组的服务器列表（排除已在当前组的）
 */
export async function getAvailableServers(
  groupId: string,
  params: { keyword?: string; page: number; pageSize: number },
) {
  return requestClient.get<PriorityGroupApi.AvailableServersResponse>(
    '/assets/priority-groups/servers/available',
    { params: { group_id: groupId, ...params } },
  );
}
