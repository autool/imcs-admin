import { requestClient } from '#/api/request';

export namespace SystemDeptApi {
  export interface SystemDept {
    [key: string]: any;
    children?: SystemDept[];
    code?: string;
    createTime?: string;
    id: string;
    name: string;
    parent_name?: string;
    pid?: null | string;
    remark?: string;
    sort?: number;
    source_label?: string;
    source_type?: string;
    status: 0 | 1;
    updateTime?: string;
  }
}

/**
 * 获取部门列表数据
 */
async function getDeptList() {
  return requestClient.get<{
    list: Array<SystemDeptApi.SystemDept>;
    total: number;
  }>('/system/dept/list');
}

/**
 * 创建部门
 * @param data 部门数据
 */
async function createDept(
  data: Omit<SystemDeptApi.SystemDept, 'children' | 'id'>,
) {
  return requestClient.post('/system/dept', normalizeDeptPayload(data));
}

/**
 * 更新部门
 *
 * @param id 部门 ID
 * @param data 部门数据
 */
async function updateDept(
  id: string,
  data: Omit<SystemDeptApi.SystemDept, 'children' | 'id'>,
) {
  return requestClient.put(`/system/dept/${id}`, normalizeDeptPayload(data));
}

/**
 * 删除部门
 * @param id 部门 ID
 */
async function deleteDept(id: string) {
  return requestClient.delete(`/system/dept/${id}`);
}

function normalizeDeptPayload(
  data: Omit<SystemDeptApi.SystemDept, 'children' | 'id'>,
) {
  const { pid, ...rest } = data;
  return {
    ...rest,
    parent_id: pid ?? null,
  };
}

export { createDept, deleteDept, getDeptList, updateDept };
