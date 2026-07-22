<script lang="ts" setup>
import type { Key } from 'ant-design-vue/es/table/interface';

import type { PriorityGroupApi } from '#/api/assets/priority-group';

import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Table, Tag } from 'ant-design-vue';

import {
  batchRemoveGroupMembers,
  getGroupMembers,
  removeGroupMember,
} from '#/api/assets/priority-group';

import AddMembersModal from './add-members.vue';

const members = ref<PriorityGroupApi.GroupMember[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const groupInfo = ref<null | PriorityGroupApi.GroupDetail>(null);
const selectedRowKeys = ref<Key[]>([]);

const [AddModal, addModalApi] = useVbenModal({
  connectedComponent: AddMembersModal,
  fullscreenButton: false,
});

const columns = [
  { title: '序号', dataIndex: 'index', width: 60 },
  { title: 'IP 地址', dataIndex: 'ip_address', width: 200 },
  { title: '加入时间', dataIndex: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<any>();
      if (data) {
        groupInfo.value = {
          id: data.groupId,
          name: data.groupName,
          priority_level: data.priorityLevel,
          priority_name: data.priorityName,
        };
        selectedRowKeys.value = [];
        fetchMembers();
      }
    }
  },
});

async function fetchMembers() {
  if (!groupInfo.value) return;
  try {
    loading.value = true;
    const res = await getGroupMembers(groupInfo.value.id, {
      page: page.value,
      pageSize: pageSize.value,
    });
    members.value = res?.items || [];
    total.value = res?.total || 0;
    // 附加序号
    members.value.forEach((m, i) => {
      (m as any).index = (page.value - 1) * pageSize.value + i + 1;
    });
  } catch (error) {
    console.error('获取成员列表失败:', error);
    message.error('获取成员列表失败');
  } finally {
    loading.value = false;
  }
}

function handleAddMembers() {
  if (!groupInfo.value) return;
  addModalApi.setData({
    groupId: groupInfo.value.id,
    groupNameMap: {
      a1111111111111111111111111111111: '重大业务',
      a2222222222222222222222222222222: '重要业务',
      a3333333333333333333333333333333: '普通业务',
      a4444444444444444444444444444444: '测试备用',
    },
  });
  addModalApi.open();
}

async function handleRemove(row: PriorityGroupApi.GroupMember) {
  if (!groupInfo.value) return;
  try {
    await removeGroupMember(groupInfo.value.id, row.id);
    message.success('移除成功');
    fetchMembers();
  } catch (error) {
    console.error('移除成员失败:', error);
    message.error('移除失败');
  }
}

async function handleBatchRemove() {
  if (!groupInfo.value || selectedRowKeys.value.length === 0) return;
  try {
    const selectedIds = new Set(selectedRowKeys.value.map(String));
    const toRemove = members.value
      .filter((m) => selectedIds.has(m.id))
      .map((m) => m.server_id);
    await batchRemoveGroupMembers(groupInfo.value.id, toRemove);
    message.success('移除成功');
    selectedRowKeys.value = [];
    fetchMembers();
  } catch (error) {
    console.error('批量移除失败:', error);
    message.error('批量移除失败');
  }
}

function onSelectChange(keys: Key[]) {
  selectedRowKeys.value = keys;
}

function getPriorityTagColor(level: number) {
  const colors: Record<number, string> = {
    10: 'red',
    30: 'orange',
    50: 'blue',
    80: 'default',
  };
  return colors[level] || 'default';
}

defineExpose({ drawerApi });

const fmtTime = (t?: string) => (t ? t.replace('T', ' ').slice(0, 19) : '-');
</script>

<template>
  <Drawer class="w-[700px]" :title="`分组成员 - ${groupInfo?.name || ''}`">
    <AddModal @success="fetchMembers()" />

    <div v-if="groupInfo" class="mb-3 flex items-center gap-2">
      <Tag
        :color="getPriorityTagColor(groupInfo.priority_level)"
        class="m-0 px-2"
      >
        {{ groupInfo.priority_name }}
      </Tag>
    </div>

    <div class="mb-3 flex gap-2">
      <Button type="primary" size="small" @click="handleAddMembers">
        添加成员
      </Button>
      <Popconfirm
        v-if="selectedRowKeys.length > 0"
        :title="`确定移除选中的 ${selectedRowKeys.length} 台服务器吗？`"
        ok-text="确定"
        cancel-text="取消"
        @confirm="handleBatchRemove"
      >
        <Button danger size="small">
          批量移除 ({{ selectedRowKeys.length }})
        </Button>
      </Popconfirm>
    </div>

    <Table
      :columns="columns"
      :data-source="members"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 条`,
        pageSizeOptions: ['10', '20', '50'],
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
            fetchMembers();
          }
          if (ps !== pageSize) {
            pageSize = ps;
            page = 1;
            fetchMembers();
          }
        }
      "
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'created_at'">
          {{ fmtTime(record.created_at) }}
        </template>
        <template v-if="column.key === 'action'">
          <Popconfirm
            title="确定移除此服务器吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleRemove(record as PriorityGroupApi.GroupMember)"
          >
            <Button type="link" size="small" danger>移除</Button>
          </Popconfirm>
        </template>
      </template>
    </Table>
  </Drawer>
</template>
