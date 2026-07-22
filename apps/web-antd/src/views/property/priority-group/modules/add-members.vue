<script lang="ts" setup>
import type { Key } from 'ant-design-vue/es/table/interface';

import type { PriorityGroupApi } from '#/api/assets/priority-group';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Table, Tag } from 'ant-design-vue';

import {
  addGroupMembers,
  getAvailableServers,
} from '#/api/assets/priority-group';

const emit = defineEmits<{ success: [] }>();

const servers = ref<PriorityGroupApi.AvailableServer[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const keyword = ref('');
const selectedRowKeys = ref<Key[]>([]);
const currentGroupId = ref('');
const groupNameMap = ref<Record<string, string>>({});

const columns = [
  { title: '序号', dataIndex: 'index', width: 60 },
  { title: 'IP 地址', dataIndex: 'ip_address', width: 180 },
  {
    title: '当前分组',
    dataIndex: 'current_group_id',
    width: 150,
  },
];

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<any>();
      if (data?.groupId) {
        currentGroupId.value = data.groupId;
        groupNameMap.value = data.groupNameMap || {};
        selectedRowKeys.value = [];
        fetchServers();
      }
    }
  },
  async onConfirm() {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请选择要添加的服务器');
      return;
    }
    try {
      await addGroupMembers(
        currentGroupId.value,
        selectedRowKeys.value.map(String),
      );
      message.success('添加成功');
      modalApi.close();
      emit('success');
    } catch (error) {
      console.error('添加成员失败:', error);
      message.error('添加失败');
    }
  },
});

async function fetchServers() {
  try {
    loading.value = true;
    const res = await getAvailableServers(currentGroupId.value, {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
    });
    servers.value = res?.items || [];
    total.value = res?.total || 0;
  } catch (error) {
    console.error('获取可用服务器失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchServers();
}

function onSelectChange(keys: Key[]) {
  selectedRowKeys.value = keys;
}

function getGroupName(groupId: string) {
  return groupNameMap.value[groupId] || '-';
}

defineExpose({ modalApi });
</script>

<template>
  <Modal title="添加成员" class="w-[650px]">
    <div class="mb-3 flex gap-2">
      <Input
        v-model:value="keyword"
        placeholder="搜索 IP 或名称"
        class="flex-1"
        allow-clear
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">搜索</Button>
    </div>

    <div
      v-if="selectedRowKeys.length > 0"
      class="mb-2 text-sm text-gray-600 dark:text-gray-300"
    >
      已选择 <b>{{ selectedRowKeys.length }}</b> 台服务器
    </div>

    <Table
      :columns="columns"
      :data-source="servers"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 条`,
      }"
      row-key="id"
      :row-selection="{
        selectedRowKeys,
        onChange: onSelectChange,
      }"
      size="small"
      @change="
        ({ current, pageSize: ps }: any) => {
          if (current !== page) {
            page = current;
            fetchServers();
          }
          if (ps !== pageSize) {
            pageSize = ps;
            page = 1;
            fetchServers();
          }
        }
      "
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'index'">
          {{ (page - 1) * pageSize + index + 1 }}
        </template>
        <template v-if="column.dataIndex === 'current_group_id'">
          <Tag v-if="record.current_group_id" color="blue">
            {{ getGroupName(record.current_group_id) }}
          </Tag>
          <span v-else class="text-gray-400">未分组</span>
        </template>
      </template>
    </Table>
  </Modal>
</template>
