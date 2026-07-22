<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TicketsApi } from '#/api/operation/tickets';
import type { WorkflowApi } from '#/api/operation/workflow';

import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  CheckOutlined,
  CloseOutlined,
  RightOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  message,
  Modal,
  Select,
  Tabs,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTicketsApi, getTicketStatsApi } from '#/api/operation/tickets';
import { completeNodeApi, getMyTodosApi } from '#/api/operation/workflow';
import { MetricChartCard } from '#/components/metric-chart-card';

import {
  approveOpinionPresets,
  rejectOpinionPresets,
  statusText,
} from './detail-meta';

defineOptions({ name: 'WorkPlatformMyTickets' });

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const actionLoading = ref(false);
const actionModalVisible = ref(false);
const actionType = ref<'approve' | 'reject'>('approve');
const actionComment = ref('');
const currentTodo = ref<null | WorkflowApi.TodoItem>(null);
const activeScope = ref<'completed' | 'pending'>('pending');
const stats = ref<WorkflowApi.Stats>({
  my_completed: 0,
  my_overdue: 0,
  my_pending: 0,
  my_processing: 0,
  total_completed: 0,
  total_tickets: 0,
});

const sourceText: Record<string, string> = {
  alarm: '告警',
  feedback: '反馈',
  manual: '手动',
  node_timeout: '节点超时',
  task_failure: '任务失败',
};

const sourceColor: Record<string, string> = {
  alarm: 'red',
  feedback: 'blue',
  manual: 'default',
  node_timeout: 'purple',
  task_failure: 'orange',
};

const priorityText: Record<string, string> = {
  high: '高',
  low: '低',
  medium: '中',
  urgent: '紧急',
};

const priorityColor: Record<string, string> = {
  high: 'orange',
  low: 'default',
  medium: 'blue',
  urgent: 'red',
};

const canHandleTodos = computed(() =>
  hasAccessByCodes(['wp_my_tickets:handle']),
);

const scopeTabs = computed(() => [
  { key: 'pending', label: `待处理 ${stats.value.my_pending}` },
  { key: 'completed', label: `已处理 ${stats.value.my_completed}` },
]);

const opinionOptions = computed(() => {
  const presets =
    actionType.value === 'approve'
      ? approveOpinionPresets
      : rejectOpinionPresets;
  return presets.map((item) => ({ label: item, value: item }));
});

const statusChartData = computed(() => [
  { label: '待办', value: stats.value.my_pending },
  { label: '处理中', value: stats.value.my_processing },
  { label: '逾期', value: stats.value.my_overdue },
  { label: '已完成', value: stats.value.my_completed },
]);

const statCards = computed(() => [
  {
    chartData: statusChartData.value,
    chartType: 'line' as const,
    description: '当前需要我处理的流程节点',
    icon: 'lucide:list-todo',
    label: '我的待办',
    tone: 'info' as const,
    value: stats.value.my_pending,
  },
  {
    chartData: statusChartData.value,
    chartType: 'bar' as const,
    description: '已进入处理中状态的节点',
    icon: 'lucide:loader-circle',
    label: '我处理中',
    tone: 'warning' as const,
    value: stats.value.my_processing,
  },
  {
    chartData: statusChartData.value,
    chartType: 'donut' as const,
    description: '超过处理时限的待办',
    icon: 'lucide:clock-alert',
    label: '逾期',
    tone:
      stats.value.my_overdue > 0 ? ('danger' as const) : ('success' as const),
    value: stats.value.my_overdue,
  },
  {
    chartData: statusChartData.value,
    chartType: 'line' as const,
    description: '我已完成处理的节点',
    icon: 'lucide:check-circle-2',
    label: '我已完成',
    tone: 'success' as const,
    value: stats.value.my_completed,
  },
]);

function useColumns(): VxeTableGridOptions<WorkflowApi.TodoItem>['columns'] {
  return [
    {
      align: 'center',
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 70,
    },
    {
      field: 'title',
      minWidth: 220,
      showOverflow: 'tooltip',
      title: '工单事项',
    },
    {
      align: 'center',
      field: 'source_type',
      slots: {
        default: ({ row }) =>
          h(
            Tag,
            { color: sourceColor[row.source_type] || 'default' },
            () =>
              sourceText[row.source_type || 'manual'] ||
              row.source_type ||
              '手动',
          ),
      },
      title: '来源',
      width: 110,
    },
    {
      align: 'center',
      field: 'priority',
      title: '优先级',
      width: 100,
      slots: {
        default: ({ row }) => {
          const priority = row.priority || '';
          return priority
            ? h(
                Tag,
                { color: priorityColor[priority] || 'default' },
                () => priorityText[priority] || priority,
              )
            : '-';
        },
      },
    },
    {
      field: 'current_node_name',
      minWidth: 130,
      formatter: ({ row }) => row.current_node_name || row.node_type || '-',
      title: '当前节点',
    },
    {
      align: 'center',
      field: 'created_at',
      title: '进入时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 180,
    },
  ];
}

function openAction(
  record: WorkflowApi.TodoItem,
  action: 'approve' | 'reject',
) {
  currentTodo.value = record;
  actionType.value = action;
  actionComment.value = '';
  actionModalVisible.value = true;
}

function applyOpinion(value: string) {
  actionComment.value = value;
}

function ticketToTodo(ticket: TicketsApi.Ticket): WorkflowApi.TodoItem {
  return {
    assignee_id: ticket.assignee_id,
    created_at:
      ticket.workflow_completed_at || ticket.updated_at || ticket.created_at,
    current_node_name: statusText[ticket.status] || '已处理',
    due_date: ticket.due_date,
    id: `completed-${ticket.id}`,
    priority: ticket.priority,
    source_data: ticket.source_data,
    source_type: ticket.source_type || 'manual',
    status: ticket.status,
    ticket_id: ticket.id,
    title: ticket.title,
  };
}

function handleScopeChange(key: number | string) {
  activeScope.value = key === 'completed' ? 'completed' : 'pending';
  gridApi.reload();
}

async function submitAction() {
  if (!currentTodo.value) return;
  if (!canHandleTodos.value) {
    message.warning('无权限处理待办');
    return;
  }
  if (actionType.value === 'reject' && !actionComment.value.trim()) {
    message.warning('驳回必须填写处理意见');
    return;
  }

  actionLoading.value = true;
  try {
    await completeNodeApi(
      currentTodo.value.ticket_id,
      actionType.value,
      actionComment.value,
    );
    message.success(
      actionType.value === 'approve' ? '节点已通过' : '节点已驳回',
    );
    actionModalVisible.value = false;
    gridApi.query();
  } catch (error: any) {
    message.error(error.message || '处理待办失败');
  } finally {
    actionLoading.value = false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const [statsRes, listRes] = await Promise.all([
            getTicketStatsApi(),
            activeScope.value === 'completed'
              ? getTicketsApi({
                  page: page.currentPage,
                  page_size: page.pageSize,
                  scope: 'my_completed',
                })
              : getMyTodosApi({
                  page: page.currentPage,
                  page_size: page.pageSize,
                }),
          ]);
          stats.value = statsRes;
          const rows =
            activeScope.value === 'completed'
              ? (listRes.items || []).map((item) =>
                  ticketToTodo(item as TicketsApi.Ticket),
                )
              : ((listRes.items || []) as WorkflowApi.TodoItem[]);
          return {
            items: rows,
            list: rows,
            total: listRes.total || 0,
          };
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
      zoom: true,
    },
  } as VxeTableGridOptions<WorkflowApi.TodoItem>,
});
</script>

<template>
  <Page auto-content-height>
    <div class="my-ticket-stat-grid">
      <MetricChartCard
        v-for="item in statCards"
        :key="item.label"
        :chart-data="item.chartData"
        :chart-type="item.chartType"
        :description="item.description"
        :icon="item.icon"
        :label="item.label"
        :tone="item.tone"
        :value="item.value"
      />
    </div>

    <Grid>
      <template #toolbar-tools>
        <Tabs
          :active-key="activeScope"
          class="my-ticket-scope-tabs"
          size="small"
          @change="handleScopeChange"
        >
          <Tabs.TabPane
            v-for="item in scopeTabs"
            :key="item.key"
            :tab="item.label"
          />
        </Tabs>
        <Button
          v-access:code="['wp_intake:create']"
          type="primary"
          @click="router.push('/work-platform/intake')"
        >
          新建工单
        </Button>
      </template>
      <template #action="{ row }">
        <Button
          size="small"
          type="link"
          @click="
            router.push({
              path: '/work-platform/tickets',
              query: { ticketId: row.ticket_id },
            })
          "
        >
          <RightOutlined />
          详情
        </Button>
        <Button
          v-if="canHandleTodos && activeScope === 'pending'"
          size="small"
          type="link"
          @click="openAction(row, 'approve')"
        >
          <CheckOutlined />
          通过
        </Button>
        <Button
          v-if="canHandleTodos && activeScope === 'pending'"
          danger
          size="small"
          type="link"
          @click="openAction(row, 'reject')"
        >
          <CloseOutlined />
          驳回
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="actionModalVisible"
      :confirm-loading="actionLoading"
      :title="actionType === 'approve' ? '通过当前节点' : '驳回当前节点'"
      @ok="submitAction"
    >
      <div class="space-y-4 py-2">
        <div>
          <div class="mb-2 text-sm text-muted-foreground">待办事项</div>
          <div class="rounded-md bg-muted/40 px-3 py-2 text-sm">
            {{ currentTodo?.title || '-' }}
          </div>
        </div>
        <div>
          <div class="mb-2 text-sm text-muted-foreground">意见预设</div>
          <Select
            class="w-full"
            :options="opinionOptions"
            placeholder="选择常用处理意见"
            @change="(value) => applyOpinion(String(value))"
          />
        </div>
        <div>
          <div class="mb-2 text-sm text-muted-foreground">
            处理意见
            <span v-if="actionType === 'reject'" class="text-red-500">*</span>
          </div>
          <Textarea
            v-model:value="actionComment"
            :rows="4"
            placeholder="填写本次处理、审批结论或驳回原因"
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style lang="scss" scoped>
.my-ticket-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.my-ticket-scope-tabs {
  min-width: 240px;
  margin-right: 12px;

  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }
}

@media (max-width: 1200px) {
  .my-ticket-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .my-ticket-stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
