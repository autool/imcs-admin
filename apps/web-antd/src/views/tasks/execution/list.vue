<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTaskExecutionSummaryApi } from '#/api/tasks/execution';

import { useColumns, useFormSchema } from './data';
import ExecutionListModal from './execution-list-modal.vue';
import { getTaskExecutionDisplayName } from './task-labels';

defineOptions({
  name: 'ExecutionRecords',
});

const executionListVisible = ref(false);
const currentTaskId = ref<null | string>(null);
const currentTaskName = ref<string>('');
const currentTaskType = ref<string>('');
const summaryTotalExact = ref(true);

function onActionClick(e: OnActionClickParams<any>) {
  switch (e.code) {
    case 'view': {
      onViewExecutions(e.row);
      break;
    }
  }
}

function onViewExecutions(row: any) {
  currentTaskId.value = row.task_scheduled_id;
  currentTaskName.value = getTaskExecutionDisplayName(row);
  currentTaskType.value = row.task_type || '';
  executionListVisible.value = true;
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params: any = {
            skip: (page.currentPage - 1) * page.pageSize,
            limit: page.pageSize,
          };

          if (formValues.search) params.search = formValues.search;
          if (formValues.task_type) params.task_type = formValues.task_type;

          const result = await getTaskExecutionSummaryApi(params);
          summaryTotalExact.value = result.total_exact !== false;
          return result;
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'task_scheduled_id',
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
    <Alert
      v-if="!summaryTotalExact"
      class="mb-3"
      message="任务执行汇总较多，当前总数为有限计数结果，继续筛选可查看更精确范围。"
      show-icon
      type="info"
    />
    <Grid />
    <ExecutionListModal
      v-model:visible="executionListVisible"
      :task-id="currentTaskId"
      :task-name="currentTaskName"
      :task-type="currentTaskType"
    />
  </Page>
</template>
