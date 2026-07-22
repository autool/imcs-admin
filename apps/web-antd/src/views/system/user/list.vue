<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal, Tree } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeptList } from '#/api/system/dept';
import { deleteUser, getUserList, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'SystemUserList' });

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});
const { hasAccessByCodes } = useAccess();
const canAddUser = hasAccessByCodes(['system_user:add']);
const canDeleteUser = hasAccessByCodes(['system_user:delete']);
const canEditUser = hasAccessByCodes(['system_user:edit']);

// 部门树相关
const deptTree = ref<SystemDeptApi.SystemDept[]>([]);
const selectedDeptId = ref<string>();
const expandedKeys = ref<string[]>([]);
const deptTreeNodes = computed(() => deptTree.value as unknown as DataNode[]);

function getRootDeptKeys(nodes: SystemDeptApi.SystemDept[]) {
  return nodes.map(({ id }) => id);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['create_time', ['startTime', 'endTime']]],
    showCollapseButton: false,
    schema: useGridFormSchema(),
    submitOnChange: true,
    wrapperClass:
      'grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(3,minmax(320px,420px))] 2xl:justify-between',
  },
  gridOptions: {
    columns: useColumns(onActionClick, onStatusChange),
    height: 'auto',
    keepSource: true,
    scrollX: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserList({
            page: page.currentPage,
            pageSize: page.pageSize,
            department_id: selectedDeptId.value,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },

    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SystemUserApi.SystemUser>,
});

// 加载部门树
async function loadDeptTree() {
  try {
    const res = await getDeptList();
    deptTree.value = res.list;
    expandedKeys.value = getRootDeptKeys(res.list);
  } catch {
    message.error('加载部门树失败');
  }
}

// 选择部门
function onSelectDept(selectedKeys: unknown[]) {
  selectedDeptId.value = selectedKeys[0] ? String(selectedKeys[0]) : undefined;
  onRefresh();
}

function onExpandDept(keys: unknown[]) {
  expandedKeys.value = keys.map(String);
}

onMounted(() => {
  loadDeptTree();
});

function onActionClick(e: OnActionClickParams<SystemUserApi.SystemUser>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
  }
}

/**
 * 将Antd的Modal.confirm封装为promise，方便在异步函数中调用。
 * @param content 提示内容
 * @param title 提示标题
 */
function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(
  newStatus: boolean,
  row: SystemUserApi.SystemUser,
) {
  if (!canEditUser) {
    message.warning('无权限调整用户状态');
    return false;
  }
  const status: Recordable<string> = {
    false: '解锁',
    true: '锁定',
  };
  try {
    await confirm(
      `你要将${row.username}的状态切换为 【${status[newStatus.toString()]}】 吗？`,
      `切换状态`,
    );
    await updateUser(row.id, { is_locked: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onEdit(row: SystemUserApi.SystemUser) {
  if (!canEditUser) {
    message.warning('无权限编辑用户');
    return;
  }
  formDrawerApi.setData(row).open();
}

function onDelete(row: SystemUserApi.SystemUser) {
  if (!canDeleteUser) {
    message.warning('无权限删除用户');
    return;
  }
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.username]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteUser(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.username]),
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
      message.error('删除失败，请稍后重试');
    });
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  if (!canAddUser) {
    message.warning('无权限创建用户');
    return;
  }
  formDrawerApi.setData({}).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <div class="flex h-full gap-4">
      <!-- 左侧部门树 -->
      <div
        class="w-64 flex-shrink-0 rounded-lg border border-border bg-background p-4 dark:border-gray-700"
      >
        <div class="mb-4 text-lg font-semibold text-foreground">部门列表</div>
        <Tree
          v-if="deptTree.length > 0"
          :tree-data="deptTreeNodes"
          :field-names="{ key: 'id', title: 'name', children: 'children' }"
          :expanded-keys="expandedKeys"
          @select="onSelectDept"
          @expand="onExpandDept"
        />
        <div v-else class="text-center text-muted-foreground">暂无部门数据</div>
      </div>

      <!-- 右侧用户列表 -->
      <div class="min-w-0 flex-1">
        <Grid :table-title="$t('system.user.list')">
          <template #toolbar-tools>
            <Button
              v-access:code="['system_user:add']"
              type="primary"
              @click="onCreate"
            >
              <Plus class="size-5" />
              {{ $t('system.user.create') }}
            </Button>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
