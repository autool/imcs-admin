<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';

import { Alert, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  closeStaleTaskExecutionApi,
  ensureTaskExecutionTicketApi,
  getTaskExecutionListApi,
  rerunTaskExecutionApi,
} from '#/api/tasks/execution';

import DetailModal from './detail-modal.vue';
import { useExecutionListColumns } from './execution-list-data';

interface Props {
  taskId: null | string;
  taskName: string;
  taskType?: string;
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [boolean];
}>();

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const detailVisible = ref(false);
const currentExecutionId = ref<null | string>(null);
const executionTotalExact = ref(true);

const modalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

function onViewDetail(row: any) {
  currentExecutionId.value = row.id;
  detailVisible.value = true;
}

async function onCreateTicket(row: any) {
  if (!hasAccessByCodes(['tasks_execution:view'])) {
    message.warning('无权限转工单');
    return;
  }
  try {
    const result = await ensureTaskExecutionTicketApi(row.id);
    const ticketId = result.ticket?.id;
    if (!ticketId) {
      message.error('未获取到关联工单');
      return;
    }
    message.success('任务失败工单已创建');
    modalVisible.value = false;
    router.push({ path: '/work-platform/tickets', query: { ticketId } });
  } catch (error: any) {
    message.error(error.message || '转工单失败');
  }
}

async function onRerun(row: any) {
  if (!hasAccessByCodes(['tasks_scheduled:edit'])) {
    message.warning('无权限重跑任务');
    return;
  }
  try {
    const result = await rerunTaskExecutionApi(row.id);
    message.success(
      result.dispatch_mode === 'scheduled'
        ? '任务已标记为立即调度，等待所属 Agent 执行'
        : `任务已重新投递：${result.execution_id}`,
    );
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '重跑失败');
  }
}

async function onCloseStale(row: any) {
  if (!hasAccessByCodes(['tasks_scheduled:edit'])) {
    message.warning('无权限收口任务');
    return;
  }
  Modal.confirm({
    title: '确认收口疑似卡住的任务？',
    content:
      '该操作会将当前执行记录标记为失败并释放调度状态，后续可重新调度执行。',
    okText: '确认收口',
    cancelText: '取消',
    async onOk() {
      try {
        await closeStaleTaskExecutionApi(row.id);
        message.success('任务已收口');
        gridApi.reload();
      } catch (error: any) {
        message.error(error.message || '收口失败');
      }
    },
  });
}

const formSchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '成功', value: 'success' },
        { label: '失败', value: 'failed' },
        { label: '部分成功', value: 'partial' },
        { label: '运行中', value: 'running' },
        { label: '已投递', value: 'submitted' },
        { label: '等待Agent拉取', value: 'agent_pending' },
        { label: '等待Agent执行', value: 'rerun_requested' },
        { label: '已跳过', value: 'skipped' },
        { label: '警告', value: 'warning' },
      ],
      placeholder: '全部状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema,
    submitOnChange: true,
  },
  gridOptions: {
    columns: useExecutionListColumns(
      onViewDetail,
      onCreateTicket,
      onRerun,
      onCloseStale,
    ),
    height: 600,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (!props.taskId && !props.taskName) {
            return { list: [], total: 0 };
          }

          const params: any = {
            skip: (page.currentPage - 1) * page.pageSize,
            limit: page.pageSize,
          };

          if (props.taskName) {
            params.task_name = props.taskName;
            if (props.taskType) {
              params.task_type = props.taskType;
            }
          } else if (props.taskId) {
            params.task_scheduled_id = props.taskId;
          }

          if (formValues.status) params.status = formValues.status;

          const result = await getTaskExecutionListApi(params);
          executionTotalExact.value = result.total_exact !== false;
          return result;
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    stripe: true,
    toolbarConfig: {
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

// 监听 visible 变化，刷新数据
watch(
  () => props.visible,
  async (val) => {
    if (val && (props.taskId || props.taskName)) {
      // 等待下一个 tick，确保 grid 已挂载
      await nextTick();
      gridApi.reload();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="modalVisible"
    :title="`${taskName} - 执行记录`"
    width="1000px"
    :footer="null"
  >
    <Alert
      v-if="!executionTotalExact"
      class="mb-3"
      message="当前执行记录总数为有限计数结果，建议结合状态筛选缩小范围后排障。"
      show-icon
      type="info"
    />
    <Grid />
    <DetailModal
      v-model:visible="detailVisible"
      :execution-id="currentExecutionId"
    />
  </Modal>
</template>
