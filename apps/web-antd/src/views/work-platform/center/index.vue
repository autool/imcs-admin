<script lang="ts" setup>
import type { TicketsApi } from '#/api/operation/tickets';
import type { WorkflowApi } from '#/api/operation/workflow';

import { computed, h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ReloadOutlined, RightOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Empty,
  message,
  Progress,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { getTicketsApi } from '#/api/operation/tickets';
import {
  checkWorkflowTimeoutsApi,
  getMyTodosApi,
  getWorkflowStatsApi,
  getWorkflowTopologyApi,
} from '#/api/operation/workflow';
import { MetricChartCard } from '#/components/metric-chart-card';

defineOptions({ name: 'WorkPlatformCenter' });

const router = useRouter();
const loading = ref(false);
const timeoutChecking = ref(false);
const stats = ref<WorkflowApi.Stats>({
  my_pending: 0,
  my_processing: 0,
  my_overdue: 0,
  my_completed: 0,
  total_completed: 0,
  total_tickets: 0,
});
const topology = ref<WorkflowApi.Topology>({
  sources: [],
  pool_count: 0,
  status_distribution: {},
});
const myTodos = ref<WorkflowApi.TodoItem[]>([]);

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

const statusText: Record<string, string> = {
  closed: '已关闭',
  in_progress: '处理中',
  open: '待处理',
  pending: '挂起',
  resolved: '已归档',
};

const statItems = computed(() => [
  {
    chartData: statusChartData.value,
    chartType: 'donut' as const,
    description: '待处理节点和未分派工单需要优先进入处置',
    icon: 'lucide:inbox',
    key: 'my_pending',
    label: '我的待办',
    tone: 'info' as const,
    value: stats.value.my_pending,
    query: { scope: 'my_pending' },
  },
  {
    chartData: statusChartData.value,
    chartType: 'donut' as const,
    description: '处理中数量反映当前个人处置负载',
    icon: 'lucide:clock-3',
    key: 'my_processing',
    label: '我处理中',
    tone: 'warning' as const,
    value: stats.value.my_processing,
    query: { scope: 'my_assigned' },
  },
  {
    chartData: slaChartData.value,
    chartType: 'bar' as const,
    description: '逾期项会影响 SLA，应先清理或升级',
    icon: 'lucide:circle-alert',
    key: 'my_overdue',
    label: '逾期',
    tone:
      stats.value.my_overdue > 0 ? ('danger' as const) : ('success' as const),
    value: stats.value.my_overdue,
    query: { scope: 'overdue' },
  },
  {
    chartData: statusChartData.value,
    chartType: 'line' as const,
    description: '我已完成处理的流程记录，可进入归档查看',
    icon: 'lucide:check-circle-2',
    key: 'my_completed',
    label: '我已处理',
    tone: 'success' as const,
    value: stats.value.my_completed,
    query: { scope: 'my_completed' },
  },
  {
    chartData: statusChartData.value,
    chartType: 'line' as const,
    description: '当前仍需跟进的活跃工单总量',
    icon: 'lucide:activity',
    key: 'total_tickets',
    label: '活跃工单',
    tone: 'info' as const,
    value: stats.value.total_tickets,
    query: {},
  },
]);

const sourceTotal = computed(() =>
  topology.value.sources.reduce((sum, item) => sum + item.count, 0),
);

const statusItems = computed(() =>
  Object.entries(topology.value.status_distribution).map(([status, count]) => ({
    count,
    status,
  })),
);

const statusChartData = computed(() =>
  Object.entries(topology.value.status_distribution).map(([status, value]) => ({
    label: statusText[status] || status,
    value,
  })),
);

const slaChartData = computed(() => [
  { label: '待办', value: stats.value.my_pending },
  { label: '处理中', value: stats.value.my_processing },
  { label: '逾期', value: stats.value.my_overdue },
]);

const healthItems = computed(() => [
  {
    label: '工单池',
    value: topology.value.pool_count,
    query: { scope: 'unassigned' },
  },
  {
    label: '已处理总量',
    value: stats.value.total_completed,
    query: { scope: 'closed' },
  },
  { label: '活跃工单', value: stats.value.total_tickets, query: {} },
]);

const todoColumns = [
  {
    align: 'center' as const,
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'sequence',
    title: '序号',
    width: 64,
  },
  {
    dataIndex: 'title',
    ellipsis: true,
    title: '工单',
  },
  {
    dataIndex: 'source_type',
    title: '来源',
    width: 96,
    customRender: ({ record }: { record: WorkflowApi.TodoItem }) =>
      h(
        Tag,
        { color: sourceColor[record.source_type] || 'default' },
        () => sourceText[record.source_type] || record.source_type,
      ),
  },
  {
    dataIndex: 'priority',
    title: '优先级',
    width: 96,
    customRender: ({ record }: { record: WorkflowApi.TodoItem }) => {
      const priority = record.priority || '';
      return priority
        ? h(
            Tag,
            { color: priorityColor[priority] || 'default' },
            () => priorityText[priority] || priority,
          )
        : '-';
    },
  },
  {
    dataIndex: 'current_node_name',
    title: '当前节点',
    width: 140,
  },
  {
    dataIndex: 'created_at',
    title: '创建时间',
    width: 180,
  },
  {
    key: 'action',
    title: '操作',
    width: 110,
    customRender: ({ record }: { record: WorkflowApi.TodoItem }) =>
      h(
        Button,
        {
          size: 'small',
          type: 'link',
          onClick: () =>
            router.push({
              path: '/work-platform/tickets',
              query: { ticketId: record.ticket_id },
            }),
        },
        () => [
          h(RightOutlined),
          ['closed', 'resolved'].includes(record.status) ? '详情' : '处理',
        ],
      ),
  },
];

function ticketToTodo(ticket: TicketsApi.Ticket): WorkflowApi.TodoItem {
  return {
    id: `ticket-${ticket.id}`,
    ticket_id: ticket.id,
    title: ticket.title,
    source_type: ticket.source_type || 'manual',
    priority: ticket.priority,
    status: ticket.status,
    current_node_name: statusText[ticket.status] || '工单处理',
    assignee_id: ticket.assignee_id,
    created_at:
      ticket.workflow_completed_at || ticket.updated_at || ticket.created_at,
    due_date: ticket.due_date,
    source_data: ticket.source_data,
  };
}

function mergeTodos(
  records: WorkflowApi.TodoItem[],
  tickets: TicketsApi.Ticket[],
) {
  const seen = new Set(records.map((item) => item.ticket_id));
  const assigned = tickets
    .filter((ticket) => !seen.has(ticket.id))
    .map((ticket) => ticketToTodo(ticket));
  return [...records, ...assigned].slice(0, 8);
}

async function loadData() {
  loading.value = true;
  try {
    const [
      statsRes,
      topologyRes,
      todosRes,
      assignedRes,
      poolRes,
      completedRes,
    ] = await Promise.all([
      getWorkflowStatsApi(),
      getWorkflowTopologyApi(),
      getMyTodosApi({ page: 1, page_size: 8 }),
      getTicketsApi({ page: 1, page_size: 8, scope: 'my_assigned' }),
      getTicketsApi({ page: 1, page_size: 8, scope: 'unassigned' }),
      getTicketsApi({ page: 1, page_size: 8, scope: 'my_completed' }),
    ]);
    stats.value = statsRes;
    topology.value = topologyRes;
    myTodos.value = mergeTodos(todosRes.items || [], [
      ...(assignedRes.items || []),
      ...(poolRes.items || []),
      ...(completedRes.items || []),
    ]);
  } catch (error: any) {
    message.error(error.message || '加载工作台数据失败');
  } finally {
    loading.value = false;
  }
}

async function handleCheckTimeouts() {
  timeoutChecking.value = true;
  try {
    const result = await checkWorkflowTimeoutsApi();
    message.success(
      `已扫描 ${result.timeout_count} 个超时节点，创建 ${result.created_ticket_count} 个超时工单`,
    );
    await loadData();
  } catch (error: any) {
    message.error(error.message || '扫描超时节点失败');
  } finally {
    timeoutChecking.value = false;
  }
}

function goTickets(query: Record<string, any> = {}) {
  router.push({ path: '/work-platform/tickets', query });
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-lg font-semibold">工作中心</h2>
          <div class="mt-1 text-sm text-muted-foreground">
            从来源进入、派发处理、流程推进到结果反写的统一入口
          </div>
        </div>
        <Space>
          <Button @click="goTickets({ scope: 'unassigned' })">工单池</Button>
          <Button @click="router.push('/work-platform/intake')">
            工单入口
          </Button>
          <Button
            v-access:code="['wp_workbench:timeout_scan']"
            :loading="timeoutChecking"
            @click="handleCheckTimeouts"
          >
            扫描超时
          </Button>
          <Button type="primary" :loading="loading" @click="loadData">
            <ReloadOutlined />
            刷新
          </Button>
        </Space>
      </div>

      <div class="grid grid-cols-2 gap-2 xl:grid-cols-5">
        <MetricChartCard
          v-for="item in statItems"
          :key="item.key"
          :chart-data="item.chartData"
          :chart-type="item.chartType"
          :description="item.description"
          :icon="item.icon"
          :label="item.label"
          :tone="item.tone"
          :value="item.value"
          class="cursor-pointer transition hover:border-primary"
          @click="goTickets(item.query)"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div
          v-for="item in healthItems"
          :key="item.label"
          class="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition hover:border-primary"
          @click="goTickets(item.query)"
        >
          <span class="text-sm text-muted-foreground">{{ item.label }}</span>
          <span class="text-xl font-semibold">{{
            item.value.toLocaleString()
          }}</span>
        </div>
      </div>

      <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-3">
        <Card class="xl:col-span-2" :body-style="{ padding: 0 }">
          <template #title>
            <div class="flex items-center justify-between">
              <span>近期工单动态</span>
              <Button
                size="small"
                type="link"
                @click="goTickets({ scope: 'my_completed' })"
              >
                查看已处理
              </Button>
            </div>
          </template>
          <Table
            :columns="todoColumns"
            :custom-row="
              (record) => ({
                onDblclick: () => goTickets({ ticketId: record.ticket_id }),
              })
            "
            :data-source="myTodos"
            :loading="loading"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #emptyText>
              <Empty description="暂无工单动态" />
            </template>
          </Table>
        </Card>

        <div class="flex flex-col gap-4">
          <Card>
            <template #title>来源分布</template>
            <div v-if="topology.sources.length > 0" class="space-y-3">
              <div
                v-for="item in topology.sources"
                :key="item.source_type"
                class="cursor-pointer rounded-md p-2 transition hover:bg-muted/50"
                @click="goTickets({ source_type: item.source_type })"
              >
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span>{{
                    sourceText[item.source_type] || item.source_type
                  }}</span>
                  <span class="font-medium">{{ item.count }}</span>
                </div>
                <Progress
                  :percent="
                    sourceTotal
                      ? Math.round((item.count / sourceTotal) * 100)
                      : 0
                  "
                  :show-info="false"
                  size="small"
                />
              </div>
            </div>
            <Empty v-else description="暂无来源数据" />
          </Card>

          <Card>
            <template #title>状态分布</template>
            <div v-if="statusItems.length > 0" class="space-y-2">
              <div
                v-for="item in statusItems"
                :key="item.status"
                class="flex cursor-pointer items-center justify-between rounded-md bg-muted/40 px-3 py-2 transition hover:bg-muted"
                @click="goTickets({ status: item.status })"
              >
                <span class="text-sm">{{
                  statusText[item.status] || item.status
                }}</span>
                <span class="font-medium">{{ item.count }}</span>
              </div>
            </div>
            <Empty v-else description="暂无状态数据" />
          </Card>
        </div>
      </div>
    </div>
  </Page>
</template>
