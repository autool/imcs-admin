import { defineStore } from 'pinia';

import { requestClient } from '#/api/request';

// 字典项
export interface DictItem {
  label: string;
  value: number | string;
  [key: string]: any;
}

interface DictState {
  cache: Record<string, DictItem[]>; // 字典数据缓存
  selectDataCache: Record<string, any[]>; // 下拉数据缓存
  pendingRequests: Map<string, Promise<DictItem[]>>; // 进行中的请求
}

const getByDictType = (params: { dictType: string }) => {
  return requestClient.post<DictItem[]>('/sys/dict/getByDictType', params);
};

export const useDictStore = defineStore('app-dict', {
  state: (): DictState => ({
    cache: {},
    selectDataCache: {},
    pendingRequests: new Map(),
  }),
  getters: {
    getDictData(state) {
      return (code: string): DictItem[] => {
        return state.cache[code] || [];
      };
    },
    getSelectData(state) {
      return (cacheKey: string, params: any): any[] => {
        const newCacheKey = cacheKey + JSON.stringify(params);
        return state.selectDataCache[newCacheKey] || [];
      };
    },
  },
  actions: {
    async requestData(code: string): Promise<DictItem[]> {
      if (!code) return [];

      // 已有缓存直接返回
      const cached = this.cache[code];
      if (cached && cached.length > 0) {
        return cached;
      }

      // 有进行中的请求，复用同一个 Promise
      if (this.pendingRequests.has(code)) {
        const pending = this.pendingRequests.get(code);
        if (pending) return pending;
      }

      // 创建新请求
      const promise = getByDictType({ dictType: code }).then((res) => {
        this.pendingRequests.delete(code);
        const rows = Array.isArray(res) ? res : [];
        if (rows.length > 0) {
          this.cache[code] = rows;
          return rows;
        }
        Reflect.deleteProperty(this.cache, code);
        return [];
      });

      this.pendingRequests.set(code, promise);
      return promise;
    },
    /**
     * 下拉数据缓存
     * @param api 请求接口对象
     * @param params 请求参数
     * @param cacheKey 缓存key
     */
    async select(
      api: (...arg: any) => Promise<any>,
      params: any,
      cacheKey: string,
    ) {
      const newCacheKey = cacheKey + JSON.stringify(params);
      const selectData = this.selectDataCache[newCacheKey];
      if (selectData && selectData.length > 0) {
        return selectData;
      }

      const res = await api(params);
      const rows = Array.isArray(res) ? res : [];
      if (rows.length > 0) {
        this.selectDataCache[newCacheKey] = rows;
      } else {
        Reflect.deleteProperty(this.selectDataCache, newCacheKey);
      }
      return rows;
    },
  },
});
