<script lang="ts" setup>
import type { PriorityGroupApi } from '#/api/assets/priority-group';

import { onMounted, ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import {
  deletePriorityGroup,
  getPriorityGroups,
} from '#/api/assets/priority-group';

import PriorityGroupForm from './modules/form.vue';
import GroupMembersDrawer from './modules/members.vue';

const groups = ref<PriorityGroupApi.PriorityGroup[]>([]);
const loading = ref(false);

const [FormModal, formModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: PriorityGroupForm,
});

const [MembersDrawer, membersDrawerApi] = useVbenDrawer({
  connectedComponent: GroupMembersDrawer,
});

async function fetchGroups() {
  try {
    loading.value = true;
    const data = await getPriorityGroups();
    groups.value = data || [];
  } catch (error) {
    console.error('获取优先级分组列表失败:', error);
    message.error('获取优先级分组列表失败');
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  formModalApi.setState({ title: '新增分组' });
  formModalApi.setData(null);
  formModalApi.open();
}

function handleEdit(row: PriorityGroupApi.PriorityGroup) {
  formModalApi.setState({ title: '编辑分组' });
  formModalApi.setData(row);
  formModalApi.open();
}

function handleViewMembers(row: PriorityGroupApi.PriorityGroup) {
  membersDrawerApi.setData({
    groupId: row.id,
    groupName: row.name,
    priorityLevel: row.priority_level,
    priorityName: row.priority_name,
  });
  membersDrawerApi.open();
}

async function handleDelete(row: PriorityGroupApi.PriorityGroup) {
  try {
    await deletePriorityGroup(row.id);
    message.success('删除成功');
    fetchGroups();
  } catch (error) {
    console.error('删除分组失败:', error);
    message.error('删除失败');
  }
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

onMounted(() => {
  fetchGroups();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="fetchGroups()" />
    <MembersDrawer />

    <div class="p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">优先级分组管理</h2>
        <Button
          v-access:code="['property_priority_group:add']"
          type="primary"
          @click="handleAdd"
        >
          新增分组
        </Button>
      </div>

      <div
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="group in groups"
          :key="group.id"
          class="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-1 flex items-center gap-2">
                <span class="text-base font-bold text-gray-800 dark:text-white">
                  {{ group.name }}
                </span>
                <Tag
                  :color="getPriorityTagColor(group.priority_level)"
                  class="m-0 px-1.5"
                >
                  {{ group.priority_name }}
                </Tag>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ group.description || '暂无描述' }}
              </p>
            </div>
          </div>

          <div class="mb-3 flex items-center gap-4 text-xs text-gray-500">
            <span>
              成员:
              <b class="text-gray-700 dark:text-gray-200">
                {{ group.member_count }}
              </b>
              台
            </span>
            <span v-if="group.created_at">
              创建: {{ group.created_at.slice(0, 10) }}
            </span>
          </div>

          <div
            class="flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-700"
          >
            <Button
              v-access:code="['property_priority_group:view']"
              type="link"
              size="small"
              @click="handleViewMembers(group)"
            >
              查看成员
            </Button>
            <Button
              v-access:code="['property_priority_group:edit']"
              type="link"
              size="small"
              @click="handleEdit(group)"
            >
              编辑
            </Button>
            <Popconfirm
              :title="`确定删除分组「${group.name}」吗？该分组下的服务器将不再属于此分组。`"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(group)"
            >
              <Button
                v-access:code="['property_priority_group:delete']"
                type="link"
                size="small"
                danger
              >
                删除
              </Button>
            </Popconfirm>
          </div>
        </div>
      </div>

      <div
        v-if="groups.length === 0 && !loading"
        class="py-20 text-center text-gray-400"
      >
        暂无优先级分组，点击上方"新增分组"按钮创建
      </div>
    </div>
  </Page>
</template>
