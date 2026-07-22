import type { ServerDetailResponse, ServersData } from '@vben/types';

import { shallowRef } from 'vue';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  addServerApi,
  getBrandOptionsApi,
  getModelOptionsApi,
  getServerDetailsApi,
  getServersListApi,
} from '#/api';

export const useServerStore = defineStore('server', () => {
  const serverData = shallowRef<ServersData>({
    code: 0,
    data: '',
    error: '',
    message: '',
  });

  const loading = shallowRef(false);

  /**
   * 异步获取服务器数据
   * Asynchronously fetch the server data
   */
  async function fetchServerData(params: any) {
    try {
      loading.value = true;
      const fetchedData = await getServersListApi(params);
      if (fetchedData.code === 1) {
        serverData.value = {
          ...serverData.value,
          data: fetchedData.data,
          error: '',
          message: '',
        };
      } else {
        const errorMessage = fetchedData.message || '数据获取失败';
        notification.error({
          message: '获取数据失败',
          description: errorMessage,
        });
        serverData.value = {
          ...serverData.value,
          error: errorMessage,
          message: errorMessage,
        };
      }
    } catch {
      const errorMessage = '数据获取失败';
      notification.error({
        message: '获取数据失败',
        description: errorMessage,
      });
      serverData.value = {
        ...serverData.value,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * 异步添加服务器
   * Asynchronously add a server
   */
  async function addServer(params: any) {
    try {
      loading.value = true;
      serverData.value = {
        ...serverData.value,
        code: 0,
        error: '',
        message: '',
      };
      const response = await addServerApi(params);

      switch (response?.code) {
        case 200: {
          notification.success({
            message: '添加成功',
            description: response.message || '服务器已成功添加',
          });
          serverData.value = {
            ...serverData.value,
            code: response?.code,
            message: response?.message || '',
          };
          break;
        }
        case 400: {
          const errorMessage = response.message || '添加失败';
          notification.error({
            message: '添加失败',
            description: errorMessage,
          });
          serverData.value = {
            ...serverData.value,
            code: response?.code,
            error: errorMessage,
            message: errorMessage,
          };
          break;
        }
        case 401: {
          notification.error({
            message: '添加失败',
            description: response.message || '账号或者密码错误',
          });
          serverData.value = {
            ...serverData.value,
            code: response?.code,
            error: response?.message || '账号或者密码错误',
            message: response?.message || '账号或者密码错误',
          };
          break;
        }
        default: {
          notification.error({
            message: '添加失败',
            description: response.message || '未知错误',
          });
          serverData.value = {
            ...serverData.value,
            code: response?.code,
            error: response?.message || '未知错误',
            message: response?.message || '未知错误',
          };
          break;
        }
      }
      return response;
    } finally {
      loading.value = false;
    }
  }
  // 获取品牌选项
  async function getBrandOptions() {
    try {
      loading.value = true;
      const response = await getBrandOptionsApi();
      return response.items.map((item: { label: any; value: any }) => ({
        label: item.label,
        value: item.value,
      }));
    } catch (error) {
      console.error('Error fetching brand options:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function getModelOptions(params: any) {
    try {
      loading.value = true;
      const response = await getModelOptionsApi(params);
      return response.items.map((item: { label: any; value: any }) => ({
        label: item.label,
        value: item.value,
      }));
    } catch (error) {
      console.error('Error fetching brand options:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function getServerDetails(
    serverId: string,
  ): Promise<ServerDetailResponse> {
    try {
      loading.value = true;
      const response = await getServerDetailsApi(serverId);
      return response;
    } catch {
      const errorMessage = '数据获取失败';
      notification.error({
        message: '获取数据失败',
        description: errorMessage,
      });
      serverData.value = {
        ...serverData.value,
        error: errorMessage,
        message: errorMessage,
      };
      throw new Error(errorMessage);
    } finally {
      loading.value = false;
    }
  }

  function $reset() {
    serverData.value = {
      code: 0,
      data: '',
      error: '',
      message: '',
    };
    loading.value = false;
  }

  return {
    $reset,
    fetchServerData,
    getBrandOptions,
    getModelOptions,
    getServerDetails,
    addServer,
    serverData,
    loading,
  };
});
