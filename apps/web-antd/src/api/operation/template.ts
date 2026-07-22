/**
 * 工作流模板 API
 */
import { requestClient } from '#/api/request';

export namespace TemplateApi {
  export interface Node {
    id: string;
    template_id: string;
    node_name: string;
    node_type: string;
    sort_order: number;
    assignee_type: string;
    assignee_value?: Record<string, any>;
    actions?: string[];
    timeout_minutes?: number;
    timeout_action?: string;
    required: boolean;
  }

  export interface Template {
    id: string;
    name: string;
    code: string;
    description?: string;
    enabled: boolean;
    source_types?: string[];
    created_at?: string;
    updated_at?: string;
    nodes?: Node[];
  }

  export interface TemplateCreate {
    name: string;
    code: string;
    description?: string;
    enabled?: boolean;
    source_types?: string[];
    nodes?: Omit<Node, 'id' | 'template_id'>[];
  }

  export interface TemplateUpdate {
    name?: string;
    description?: string;
    enabled?: boolean;
    source_types?: string[];
  }
}

/**
 * 获取模板列表
 */
export async function getTemplatesApi(params?: {
  enabled?: boolean;
  page?: number;
  page_size?: number;
}) {
  return requestClient.get<{ items: TemplateApi.Template[]; total: number }>(
    '/operation/workflow-template',
    { params },
  );
}

/**
 * 获取模板详情
 */
export async function getTemplateDetailApi(id: string) {
  return requestClient.get<TemplateApi.Template>(
    `/operation/workflow-template/${id}`,
  );
}

/**
 * 创建模板
 */
export async function createTemplateApi(data: TemplateApi.TemplateCreate) {
  return requestClient.post('/operation/workflow-template', data);
}

/**
 * 更新模板
 */
export async function updateTemplateApi(
  id: string,
  data: TemplateApi.TemplateUpdate,
) {
  return requestClient.put(`/operation/workflow-template/${id}`, data);
}

/**
 * 删除模板
 */
export async function deleteTemplateApi(id: string) {
  return requestClient.delete(`/operation/workflow-template/${id}`);
}

/**
 * 添加节点
 */
export async function addNodeApi(
  templateId: string,
  data: Omit<TemplateApi.Node, 'id' | 'template_id'>,
) {
  return requestClient.post(
    `/operation/workflow-template/${templateId}/nodes`,
    data,
  );
}

/**
 * 更新节点
 */
export async function updateNodeApi(
  nodeId: string,
  data: Partial<TemplateApi.Node>,
) {
  return requestClient.put(
    `/operation/workflow-template/nodes/${nodeId}`,
    data,
  );
}

/**
 * 删除节点
 */
export async function deleteNodeApi(nodeId: string) {
  return requestClient.delete(`/operation/workflow-template/nodes/${nodeId}`);
}
