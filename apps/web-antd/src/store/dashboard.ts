import type { DashboardData } from '@vben/types';

import { shallowRef } from 'vue';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getDashboardDataApi } from '#/api';

export const useDashboardStore = defineStore('dashboard', () => {
  const dashboardData = shallowRef<DashboardData>({
    code: 0,
    data: [],
    error: '',
    message: '',
  });

  const loading = shallowRef(false);

  /**
   * 异步获取仪表盘数据
   */
  async function fetchDashboardData() {
    try {
      loading.value = true;
      const fetchedData = await getDashboardDataApi();
      if (Array.isArray(fetchedData)) {
        dashboardData.value = {
          ...dashboardData.value,
          data: fetchedData,
          error: '',
          message: '',
        };
      } else {
        const errorMessage = '数据格式不正确';
        notification.error({
          message: '获取数据失败',
          description: errorMessage,
        });
        dashboardData.value = {
          ...dashboardData.value,
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
      dashboardData.value = {
        ...dashboardData.value,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      loading.value = false;
    }
  }

  function $reset() {
    dashboardData.value = {
      code: 0,
      data: [],
      error: '',
      message: '',
    };
    loading.value = false;
  }

  return {
    $reset,
    fetchDashboardData,
    dashboardData,
    loading,
  };
});
