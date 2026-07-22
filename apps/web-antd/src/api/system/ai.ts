import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

export namespace AIModelApi {
  export interface AIModel {
    id?: string;
    name: string;
    provider: string;
    api_key: string;
    api_url: string;
    model_name: string;
    max_tokens?: number;
    temperature?: number;
    enabled: boolean;
    is_default: boolean;
    created_at?: string;
    updated_at?: string;
  }
}

// 获取AI模型列表
export async function getAIModelsApi() {
  return requestClient.get<AIModelApi.AIModel[]>('/system/ai/models');
}

// 创建AI模型
export async function createAIModelApi(data: Partial<AIModelApi.AIModel>) {
  return requestClient.post<AIModelApi.AIModel>('/system/ai/models', data);
}

// 更新AI模型
export async function updateAIModelApi(
  id: string,
  data: Partial<AIModelApi.AIModel>,
) {
  return requestClient.put<AIModelApi.AIModel>(`/system/ai/models/${id}`, data);
}

// 删除AI模型
export async function deleteAIModelApi(id: string) {
  return requestClient.delete(`/system/ai/models/${id}`);
}

// 测试AI模型
export async function testAIModelApi(id: string, message?: string) {
  return requestClient.post(`/system/ai/models/${id}/test`, {
    message: message || '你好，请介绍一下你自己',
    stream: false,
  });
}

// 测试AI模型（流式）
export async function testAIModelStreamApi(
  id: string,
  message: string,
  onChunk: (content: string) => void,
) {
  const baseURL = import.meta.env.VITE_GLOB_API_URL || '/api';
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const response = await fetch(`${baseURL}/system/ai/models/${id}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      message,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error('请求失败');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('无法读取响应');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const json = JSON.parse(data);
          if (json.error) {
            throw new Error(json.error);
          }
          if (json.content) {
            onChunk(json.content);
          }
          if (json.done) {
            return;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

// AI对话 - 使用默认模型
export async function chatWithAIApi(
  message: string,
  onChunk: (content: string) => void,
) {
  const baseURL = import.meta.env.VITE_GLOB_API_URL || '/api';
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const response = await fetch(`${baseURL}/system/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      message,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error('请求失败');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('无法读取响应');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const json = JSON.parse(data);
          if (json.error) {
            throw new Error(json.error);
          }
          if (json.content) {
            onChunk(json.content);
          }
          if (json.done) {
            return;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}
