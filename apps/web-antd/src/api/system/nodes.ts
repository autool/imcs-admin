/**
 * 节点管理 API
 */
import { requestClient } from '#/api/request';

export namespace NodesApi {
  /** 节点信息 */
  export interface Node {
    id: string;
    name: string;
    host: string;
    port: number;
    node_type: string;
    status: string;
    description?: string;
    last_heartbeat?: string;
    created_at: string;
    updated_at: string;
  }
}

/**
 * 获取节点列表
 */
export async function getNodesApi() {
  const response = await requestClient.get<{
    list: NodesApi.Node[];
    total: number;
  }>('/system/nodes/list', {
    params: { limit: 100 }, // 获取所有节点
  });
  return response.list;
}

/**
 * 获取节点列表（带分页）
 */
export async function getNodeListApi(params?: any) {
  return requestClient.get<{ list: NodesApi.Node[]; total: number }>(
    '/system/nodes/list',
    {
      params,
    },
  );
}

/**
 * 创建节点
 */
export async function createNodeApi(data: Partial<NodesApi.Node>) {
  return requestClient.post('/system/nodes', data);
}

/**
 * 更新节点
 */
export async function updateNodeApi(id: string, data: Partial<NodesApi.Node>) {
  return requestClient.put(`/system/nodes/${id}`, data);
}

/**
 * 删除节点
 */
export async function deleteNodeApi(id: string) {
  return requestClient.delete(`/system/nodes/${id}`);
}

/**
 * 获取节点健康历史
 */
export async function getNodeHealthHistoryApi(id: string, params?: any) {
  return requestClient.get(`/system/nodes/${id}/health-history`, { params });
}
