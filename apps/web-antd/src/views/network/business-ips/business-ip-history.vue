<script lang="ts" setup>
import type { BusinessIPApi } from '#/api/network/business-ips';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Table, Tag } from 'ant-design-vue';

import { getBusinessIPHistory } from '#/api/network/business-ips';

const data = ref<Record<string, any>>({});
const historyData = ref<BusinessIPApi.BusinessIPHistory[]>([]);
const loading = ref(false);
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 130 },
  { title: 'IP类型', dataIndex: 'ip_type', key: 'ip_type', width: 90 },
  {
    title: '网段',
    dataIndex: 'network_segment',
    key: 'network_segment',
    width: 140,
  },
  { title: 'VLAN ID', dataIndex: 'vlan_id', key: 'vlan_id', width: 90 },
  { title: '网关', dataIndex: 'gateway', key: 'gateway', width: 130 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  {
    title: '变更类型',
    dataIndex: 'change_type',
    key: 'change_type',
    width: 100,
  },
  {
    title: '变更原因',
    dataIndex: 'change_reason',
    key: 'change_reason',
    width: 160,
  },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 110 },
  {
    title: '变更时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 170,
  },
];

async function loadHistory() {
  if (!data.value.id) {
    historyData.value = [];
    pagination.value.total = 0;
    return;
  }

  loading.value = true;
  try {
    const res: any = await getBusinessIPHistory(
      data.value.id,
      pagination.value.current,
      pagination.value.pageSize,
    );
    historyData.value = res?.items || [];
    pagination.value.total = res?.total || 0;
  } catch (error) {
    historyData.value = [];
    pagination.value.total = 0;
    console.error('加载业务地址历史失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadHistory();
}

const [Drawer, drawerApi] = useVbenDrawer({
  closable: true,
  cancelText: '关闭',
  showCancelButton: true,
  showConfirmButton: false,
  onCancel() {
    drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const drawerData = drawerApi.getData<Record<string, any>>();
      data.value = drawerData?.values || {};
      pagination.value.current = 1;
      loadHistory();
    } else {
      loading.value = false;
      historyData.value = [];
      data.value = {};
    }
  },
});
</script>

<template>
  <Drawer class="w-1/2" title="变更历史">
    <div class="p-4">
      <Table
        :columns="columns"
        :data-source="historyData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1230 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'change_type'">
            <Tag v-if="record.change_type === 'create'" color="success">
              新增
            </Tag>
            <Tag v-else-if="record.change_type === 'update'" color="processing">
              更新
            </Tag>
            <Tag v-else-if="record.change_type === 'delete'" color="error">
              删除
            </Tag>
            <Tag v-else>{{ record.change_type || '-' }}</Tag>
          </template>
        </template>
      </Table>
    </div>
  </Drawer>
</template>
