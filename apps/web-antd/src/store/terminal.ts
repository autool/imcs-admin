import type { TerminalAssetItem } from '#/api';

import { ref } from 'vue';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  createTerminalAssetApi,
  deleteTerminalAssetApi,
  getTerminalAssetDetailApi,
  getTerminalAssetListApi,
  updateTerminalAssetApi,
} from '#/api';

export const useTerminalAssetsStore = defineStore('terminalAssets', () => {
  const assets = ref<TerminalAssetItem[]>([]);
  const loading = ref(false);
  const total = ref(0);

  async function fetchAssets(params: {
    asset_person?: string;
    asset_type?: string;
    asset_user_id?: string;
    brand_id?: string;
    ip_address?: string;
    model_id?: string;
    page: number;
    pageSize: number;
    serial_number?: string;
    status?: string;
    tag_number?: string;
  }) {
    try {
      loading.value = true;
      const res = await getTerminalAssetListApi(params);

      // requestClient 自动提取 data 字段，所以 res 就是 {items: [], total: 0}
      if (res && res.items !== undefined) {
        assets.value = res.items;
        total.value = res.total;
        return { items: res.items, total: res.total };
      } else {
        // 如果没有数据，返回空数组
        assets.value = [];
        total.value = 0;
        return { items: [], total: 0 };
      }
    } catch (error: any) {
      console.error('Terminal Store fetchAssets error:', error);
      notification.error({
        message: '获取终端资产列表失败',
        description: error?.message || '未知错误',
      });
      // 返回空数据而不是 undefined
      return { items: [], total: 0 };
    } finally {
      loading.value = false;
    }
  }

  async function createAsset(
    data: Parameters<typeof createTerminalAssetApi>[0],
  ) {
    try {
      loading.value = true;
      const res = await createTerminalAssetApi(data);
      notification.success({
        message: '创建成功',
        description: '终端资产已成功创建',
      });
      return res;
    } catch (error: any) {
      notification.error({
        message: '创建失败',
        description: error?.message || '未知错误',
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function getAssetDetail(id: string) {
    try {
      loading.value = true;
      const res = await getTerminalAssetDetailApi(id);
      return res;
    } catch (error: any) {
      notification.error({
        message: '获取资产详情失败',
        description: error?.message || '未知错误',
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateAsset(
    id: string,
    data: Parameters<typeof updateTerminalAssetApi>[1],
  ) {
    try {
      loading.value = true;
      await updateTerminalAssetApi(id, data);
      notification.success({
        message: '更新成功',
        description: '资产信息已更新',
      });
    } catch (error: any) {
      notification.error({
        message: '更新失败',
        description: error?.message || '未知错误',
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAsset(id: string) {
    try {
      loading.value = true;
      await deleteTerminalAssetApi(id);
      notification.success({
        message: '删除成功',
        description: '资产已删除',
      });
    } catch (error: any) {
      notification.error({
        message: '删除失败',
        description: error?.message || '未知错误',
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    assets,
    loading,
    total,
    fetchAssets,
    createAsset,
    getAssetDetail,
    updateAsset,
    deleteAsset,
  };
});
