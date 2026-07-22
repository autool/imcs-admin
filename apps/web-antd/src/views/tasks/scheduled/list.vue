<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { Button, message, Modal, Segmented, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteScheduledTaskApi,
  disableScheduledTaskApi,
  enableScheduledTaskApi,
  getScheduledTasksApi,
  runScheduledTaskNowApi,
  scanDueScheduledTasksApi,
} from '#/api/tasks/scheduled';

import CreateModal from './create-modal.vue';
import {
  loadNodes,
  loadTaskTypes,
  useColumns,
  useGridFormSchema,
} from './data';
import DetailModal from './detail-modal.vue';
import EditModal from './edit-modal.vue';

defineOptions({
  name: 'ScheduledTasks',
});

const detailVisible = ref(false);
const editVisible = ref(false);
const createVisible = ref(false);
const currentTask = ref<any>(null);
const activeScope = ref<'active' | 'archived'>('active');
const { hasAccessByCodes } = useAccess();
const scopeOptions = [
  { label: '定时任务', value: 'active' },
  { label: '归档', value: 'archived' },
];
const canAddTask = computed(() => hasAccessByCodes(['tasks_scheduled:add']));
const canDeleteTask = computed(() =>
  hasAccessByCodes(['tasks_scheduled:delete']),
);
const canDisableTask = computed(() =>
  hasAccessByCodes(['tasks_scheduled:disable']),
);
const canEditTask = computed(() => hasAccessByCodes(['tasks_scheduled:edit']));
const canEnableTask = computed(() =>
  hasAccessByCodes(['tasks_scheduled:enable']),
);

// 加载节点列表
onMounted(async () => {
  try {
    await Promise.all([loadNodes(), loadTaskTypes()]);
  } catch (error) {
    console.error('加载筛选数据失败:', error);
  }
});

function onActionClick(e: OnActionClickParams<any>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'disable': {
      onDisable(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
    case 'enable': {
      onEnable(e.row);
      break;
    }
    case 'run': {
      onRun(e.row);
      break;
    }
    case 'view': {
      onView(e.row);
      break;
    }
  }
}

function onView(_row: any) {
  currentTask.value = _row;
  detailVisible.value = true;
}

function onEdit(row: any) {
  if (!canEditTask.value) {
    message.warning('无权限编辑定时任务');
    return;
  }
  currentTask.value = row;
  editVisible.value = true;
}

function onEnable(_row: any) {
  if (!canEnableTask.value) {
    message.warning('无权限启用定时任务');
    return;
  }
  Modal.confirm({
    title: '确认启用',
    content: `确定要启用任务"${_row.task_name}"吗？`,
    async onOk() {
      try {
        await enableScheduledTaskApi(_row.id);
        message.success('启用成功');
        onRefresh();
      } catch (error: any) {
        message.error(error.message || '启用失败');
      }
    },
  });
}

function onDisable(row: any) {
  if (!canDisableTask.value) {
    message.warning('无权限禁用定时任务');
    return;
  }
  Modal.confirm({
    title: '确认禁用',
    content: `确定要禁用任务"${row.task_name}"吗？`,
    async onOk() {
      try {
        await disableScheduledTaskApi(row.id);
        message.success('禁用成功');
        onRefresh();
      } catch (error: any) {
        message.error(error.message || '禁用失败');
      }
    },
  });
}

function onDelete(row: any) {
  if (!canDeleteTask.value) {
    message.warning('无权限删除定时任务');
    return;
  }
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除任务"${row.task_name}"吗？删除后无法恢复。`,
    async onOk() {
      try {
        await deleteScheduledTaskApi(row.id);
        message.success('删除成功');
        onRefresh();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}

function onCreate() {
  if (!canAddTask.value) {
    message.warning('无权限创建定时任务');
    return;
  }
  createVisible.value = true;
}

function onRun(row: any) {
  if (!canEditTask.value) {
    message.warning('无权限立即执行定时任务');
    return;
  }
  Modal.confirm({
    title: '确认立即执行',
    content: `确定要立即投递任务"${row.task_name}"吗？`,
    async onOk() {
      try {
        const result = await runScheduledTaskNowApi(row.id);
        message.success(
          result.dispatch_mode === 'scheduled'
            ? '任务已标记为立即调度，等待所属 Agent 执行'
            : result.message || '任务已投递',
        );
        onRefresh();
      } catch (error: any) {
        message.error(error.message || '投递失败');
      }
    },
  });
}

function onRefresh() {
  gridApi.query();
}

function onScopeChange() {
  gridApi.query();
}

async function onScanDue() {
  if (!canEditTask.value) {
    message.warning('无权限扫描到期任务');
    return;
  }
  try {
    const result = await scanDueScheduledTasksApi();
    message.success(
      `扫描完成，已投递 ${result.submitted ?? 0} 个，失败 ${result.failed ?? 0} 个`,
    );
    onRefresh();
  } catch (error: any) {
    message.error(error.message || '扫描失败');
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, {
      archived: () => activeScope.value === 'archived',
    }),
    editConfig: {
      enabled: false, // 禁用编辑
    },
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getScheduledTasksApi({
            skip: (page.currentPage - 1) * page.pageSize,
            limit: page.pageSize,
            archive_scope: activeScope.value,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    stripe: true,
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Segmented
      v-model:value="activeScope"
      :options="scopeOptions"
      class="task-scope-switch"
      @change="onScopeChange"
    />

    <Grid>
      <template #toolbar-tools>
        <Space v-if="activeScope === 'active'" :size="12">
          <Button v-if="canEditTask" @click="onScanDue">扫描到期任务</Button>
          <Button
            v-access:code="['tasks_scheduled:add']"
            type="primary"
            @click="onCreate"
          >
            创建任务
          </Button>
        </Space>
      </template>
    </Grid>

    <CreateModal v-model:visible="createVisible" @refresh="onRefresh" />
    <DetailModal v-model:visible="detailVisible" :task-data="currentTask" />
    <EditModal
      v-model:visible="editVisible"
      :task-data="currentTask"
      @refresh="onRefresh"
    />
  </Page>
</template>

<style scoped>
.task-scope-switch {
  margin-bottom: 8px;
}
</style>
