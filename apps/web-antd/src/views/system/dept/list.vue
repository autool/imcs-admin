<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { nextTick, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDept, getDeptList } from '#/api/system/dept';
import { $t } from '#/locales';

import { useColumns } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'SystemDeptList' });

const [FormModal, formModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: Form,
  destroyOnClose: true,
});
const { hasAccessByCodes } = useAccess();
const canAddDept = hasAccessByCodes(['system_dept:add']);
const canDeleteDept = hasAccessByCodes(['system_dept:delete']);
const canEditDept = hasAccessByCodes(['system_dept:edit']);
const rootDeptRows = ref<SystemDeptApi.SystemDept[]>([]);

/**
 * 编辑部门
 * @param row
 */
function onEdit(row: SystemDeptApi.SystemDept) {
  if (!canEditDept) {
    message.warning('无权限编辑部门');
    return;
  }
  formModalApi.setData(row).open();
}

/**
 * 添加下级部门
 * @param row
 */
function onAppend(row: SystemDeptApi.SystemDept) {
  if (!canAddDept) {
    message.warning('无权限新增下级部门');
    return;
  }
  formModalApi.setData({ pid: row.id }).open();
}

/**
 * 创建新部门
 */
function onCreate() {
  if (!canAddDept) {
    message.warning('无权限创建部门');
    return;
  }
  formModalApi.setData(null).open();
}

/**
 * 删除部门
 * @param row
 */
function onDelete(row: SystemDeptApi.SystemDept) {
  if (!canDeleteDept) {
    message.warning('无权限删除部门');
    return;
  }
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteDept(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      refreshGrid();
    })
    .catch((error) => {
      hideLoading();
      console.error('删除部门失败:', error);
      message.error('删除失败，请稍后重试');
    });
}

/**
 * 表格操作按钮的回调函数
 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemDeptApi.SystemDept>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {},
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async (_params) => {
          const result = await getDeptList();
          rootDeptRows.value = result.list;
          return result;
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    stripe: false,
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      transform: false, // 不转换，直接使用树形数据
      childrenField: 'children', // 子节点字段
      expandAll: false, // 默认不展开全部
    },
  } as VxeTableGridOptions<SystemDeptApi.SystemDept>,
});

/**
 * 刷新表格
 */
async function refreshGrid() {
  await gridApi.query();
  await nextTick();
  await gridApi.grid?.setTreeExpand(rootDeptRows.value, true);
}

onMounted(() => {
  void refreshGrid();
});
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid table-title="部门列表">
      <template #toolbar-tools>
        <Button
          v-access:code="['system_dept:add']"
          type="primary"
          @click="onCreate"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.dept.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
