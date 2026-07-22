<script lang="ts" setup>
import type { TaskQueueApi } from '#/api/tasks/queue';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  Empty,
  message,
  Modal,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  closeStaleTaskExecutionApi,
  rerunTaskExecutionApi,
} from '#/api/tasks/execution';
import { getTaskQueueStatusApi } from '#/api/tasks/queue';

defineOptions({ name: 'TaskQueueStatusPanel' });

const loading = ref(false);
const status = ref<null | TaskQueueApi.QueueStatus>(null);
const silentRefreshing = ref(false);
const actionLoadingId = ref('');
let refreshTimer: number | undefined;
let autoRefreshTimer: number | undefined;
const { hasAccessByCodes } = useAccess();

const queueItems = computed(() => status.value?.queues ?? []);
const queueSources = computed(() => status.value?.sources ?? []);
const workers = computed(() => status.value?.workers ?? []);
const summary = computed(() => status.value?.summary);
const recentExecutions = computed(() => status.value?.recent_executions ?? []);
const canOperateExecution = computed(() =>
  hasAccessByCodes(['tasks_scheduled:edit']),
);
const runningTasks = computed(() =>
  workers.value.flatMap((worker) =>
    (worker.active_tasks || []).map((task) => ({
      ...task,
      source: worker.source,
      source_name: worker.source_name,
    })),
  ),
);
const waitingTasks = computed(() =>
  workers.value.flatMap((worker) => [
    ...(worker.reserved_tasks || []).map((task) => ({
      ...task,
      source: worker.source,
      source_name: worker.source_name,
    })),
    ...(worker.scheduled_tasks || []).map((task) => ({
      ...task,
      source: worker.source,
      source_name: worker.source_name,
    })),
  ]),
);
const inspectedAt = computed(() =>
  status.value?.inspected_at
    ? new Date(status.value.inspected_at).toLocaleString('zh-CN')
    : '-',
);

const overallLoad = computed(() => {
  const item = summary.value;
  return [
    { label: 'Worker', value: item?.worker_count ?? 0 },
    { label: '执行中', value: item?.active ?? 0 },
    { label: '已预取', value: item?.reserved ?? 0 },
    { label: '定时', value: item?.scheduled ?? 0 },
  ];
});

const statusText = computed(() => {
  if (status.value?.refreshing) return '刷新中';
  if (status.value?.online) return '运行中';
  return '未连接';
});

const sourceCards = computed(() =>
  queueSources.value.map((source) => ({
    ...source,
    queueNames: source.queues.map((item) => item.name).join('、') || '-',
  })),
);

function sourceBadgeColor(source: string) {
  const colorMap: Record<string, string> = {
    admin: 'blue',
    servers_agent: 'cyan',
  };
  return colorMap[source] ?? 'default';
}

function sourceClassName(source: string) {
  return `source-${source.replaceAll('_', '-')}`;
}

const queueGroups = computed(() =>
  queueSources.value
    .map((source) => ({
      key: source.key,
      name: source.name,
      online: source.online,
      queues: queueItems.value.filter((queue) => queue.source === source.key),
    }))
    .filter((source) => source.queues.length > 0),
);

function joinQueues(queues?: string[]) {
  const values = (queues || []).filter(Boolean);
  return values.length > 0 ? values.join('、') : '-';
}

function formatTaskName(name: string) {
  return name.split('.').slice(-1)[0] || name || '-';
}

function formatRuntime(timeStart?: number) {
  if (!timeStart) return '-';
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timeStart));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${minutes}m ${restSeconds}s`;
}

function taskStateLabel(state: string) {
  const labels: Record<string, string> = {
    active: '执行中',
    reserved: '已预取',
    scheduled: '定时待发',
  };
  return labels[state] || state;
}

function executionStatusColor(status: string) {
  const colors: Record<string, string> = {
    agent_pending: 'processing',
    failed: 'red',
    partial: 'orange',
    rerun_requested: 'processing',
    running: 'blue',
    submitted: 'processing',
    success: 'green',
  };
  return colors[status] || 'default';
}

function executionFailureMeta(item: TaskQueueApi.RecentExecution) {
  if (item.failure_category === 'manual_cleanup') {
    return { color: 'warning', label: '人工收口' };
  }
  if (item.failure_category === 'system_cleanup') {
    return { color: 'warning', label: '系统收口' };
  }
  return { color: 'error', label: '业务失败' };
}

function executionStatusMeta(item: TaskQueueApi.RecentExecution) {
  if (item.system_closed) {
    const meta = executionFailureMeta(item);
    return { color: meta.color, label: meta.label };
  }
  return {
    color: executionStatusColor(item.status),
    label: executionStatusLabel(item.status),
  };
}

function executionResultText(item: TaskQueueApi.RecentExecution) {
  const failedLabel = item.system_closed ? '收口' : '失败';
  return `总数 ${item.total} / 成功 ${item.collected} / ${failedLabel} ${item.failed}`;
}

function executionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    agent_pending: '等待Agent',
    failed: '失败',
    partial: '部分成功',
    rerun_requested: '等待重跑',
    running: '执行中',
    submitted: '已投递',
    success: '成功',
  };
  return labels[status] || status || '-';
}

function executionDiagnosisColor(reason: string) {
  const colors: Record<string, string> = {
    active_execution: 'orange',
    active_schedule_status: 'gold',
    normal: 'default',
    stale_execution: 'red',
    waiting_agent_or_worker: 'blue',
  };
  return colors[reason] || 'default';
}

function executionDiagnosisLabel(reason: string) {
  const labels: Record<string, string> = {
    active_execution: '已有活跃执行',
    active_schedule_status: '调度状态占用',
    normal: '正常',
    stale_execution: '心跳超时',
    waiting_agent_or_worker: '等待接管',
  };
  return labels[reason] || reason || '正常';
}

function executionDiagnosisDetail(item: TaskQueueApi.RecentExecution) {
  const details = [
    `执行ID：${item.id}`,
    `活跃执行数：${item.active_executions ?? 0}`,
    `任务定义状态：${item.last_run_status || '-'}`,
    `任务定义上次运行：${item.last_run_at || '-'}`,
    `任务定义下次运行：${item.next_run_at || '-'}`,
  ];
  if (item.failure_summary) {
    details.push(`结果说明：${item.failure_summary}`);
  }
  return details.join('\n');
}

function formatHeartbeat(seconds?: number) {
  const value = Math.max(0, Number(seconds || 0));
  if (value < 60) return `${value}s 前`;
  const minutes = Math.floor(value / 60);
  if (minutes < 60) return `${minutes}m 前`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes > 0 ? `${hours}h ${restMinutes}m 前` : `${hours}h 前`;
}

function confirmCloseStaleExecution(item: TaskQueueApi.RecentExecution) {
  Modal.confirm({
    title: '收口疑似卡死任务？',
    content: `任务「${item.task_name || item.task_type}」已超过心跳阈值，确认将该执行记录收口为失败吗？`,
    okText: '收口失败',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      actionLoadingId.value = item.id;
      try {
        await closeStaleTaskExecutionApi(item.id);
        message.success('已收口为失败');
        await loadStatus(true, true);
      } finally {
        actionLoadingId.value = '';
      }
    },
  });
}

async function rerunExecution(item: TaskQueueApi.RecentExecution) {
  actionLoadingId.value = item.id;
  try {
    await rerunTaskExecutionApi(item.id);
    message.success('任务已重新投递');
    await loadStatus(true, true);
  } catch (error: any) {
    message.error(error?.message || '重跑失败');
  } finally {
    actionLoadingId.value = '';
  }
}

async function loadStatus(forceRefresh = false, silent = false) {
  if (silent) {
    silentRefreshing.value = true;
  } else {
    loading.value = forceRefresh || !status.value;
  }
  try {
    status.value = await getTaskQueueStatusApi(forceRefresh);
    if (status.value.refreshing || status.value.stale) {
      scheduleRefreshPoll();
    }
  } finally {
    if (silent) {
      silentRefreshing.value = false;
    } else {
      loading.value = false;
    }
  }
}

function scheduleRefreshPoll() {
  if (refreshTimer) {
    window.clearTimeout(refreshTimer);
  }
  refreshTimer = window.setTimeout(() => {
    loadStatus(false);
  }, 1500);
}

function scheduleAutoRefresh() {
  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer);
  }
  autoRefreshTimer = window.setInterval(() => {
    loadStatus(true, true);
  }, 15_000);
}

onMounted(() => {
  loadStatus(false);
  scheduleAutoRefresh();
});
onBeforeUnmount(() => {
  if (refreshTimer) {
    window.clearTimeout(refreshTimer);
  }
  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer);
  }
});
</script>

<template>
  <Card class="queue-status-panel" :bordered="false" :loading="loading">
    <div class="queue-status-header">
      <div class="header-main">
        <div class="queue-status-title">
          任务队列
          <span
            class="status-pill"
            :class="{
              'is-online': status?.online,
              'is-refreshing': status?.refreshing,
            }"
          >
            {{ statusText }}
          </span>
        </div>
        <div class="queue-status-subtitle">
          {{ status?.broker_url || '等待队列连接信息' }} · {{ inspectedAt }}
        </div>
      </div>
      <div v-if="status" class="summary-strip">
        <div v-for="item in overallLoad" :key="item.label" class="summary-cell">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <Tooltip title="强制刷新队列状态">
        <Button
          class="refresh-button"
          size="small"
          :loading="silentRefreshing"
          @click="loadStatus(true)"
        >
          <IconifyIcon icon="lucide:refresh-cw" />
        </Button>
      </Tooltip>
    </div>

    <Alert
      v-if="status && !status.online"
      class="queue-status-alert"
      :message="status.error || '未发现在线 Worker'"
      show-icon
      :type="status.refreshing ? 'info' : 'warning'"
    />

    <div v-if="sourceCards.length > 0" class="source-grid">
      <div
        v-for="source in sourceCards"
        :key="source.key"
        class="source-card"
        :class="[sourceClassName(source.key), { 'is-offline': !source.online }]"
      >
        <div class="source-card-head">
          <div>
            <div class="source-name-row">
              <span class="source-dot"></span>
              <span>{{ source.name }}</span>
            </div>
            <div class="source-status">
              {{
                source.online ? 'Worker 在线' : source.error || '未发现 Worker'
              }}
            </div>
          </div>
          <strong>{{ source.summary.worker_count }}</strong>
        </div>
        <div class="source-metrics">
          <span>执行 {{ source.summary.active }}</span>
          <span>预取 {{ source.summary.reserved }}</span>
          <span>定时 {{ source.summary.scheduled }}</span>
        </div>
        <Tooltip :title="source.queueNames">
          <div class="source-queues">{{ source.queueNames }}</div>
        </Tooltip>
      </div>
    </div>

    <div v-if="workers.length > 0" class="queue-section">
      <div class="section-title">Worker 运行明细</div>
      <div class="worker-table">
        <div class="table-head table-row">
          <span>Worker</span>
          <span>来源</span>
          <span>执行队列</span>
          <span>并发</span>
          <span>当前负载</span>
        </div>
        <div v-for="worker in workers" :key="worker.name" class="table-row">
          <span class="worker-name">{{ worker.name }}</span>
          <span>
            <Tag class="source-tag" :color="sourceBadgeColor(worker.source)">
              {{ worker.source_name }}
            </Tag>
          </span>
          <span class="queue-list">{{ joinQueues(worker.queues) }}</span>
          <span>{{ worker.pool.max_concurrency ?? '-' }}</span>
          <span>
            执行 {{ worker.active }} / 预取 {{ worker.reserved }} / 定时
            {{ worker.scheduled }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="runningTasks.length > 0 || waitingTasks.length > 0"
      class="queue-section"
    >
      <div class="section-title">任务执行明细</div>
      <div class="task-lanes">
        <div class="task-lane">
          <div class="task-lane-head">
            <span>正在执行</span>
            <strong>{{ runningTasks.length }}</strong>
          </div>
          <div v-if="runningTasks.length > 0" class="task-list">
            <div
              v-for="task in runningTasks"
              :key="task.id || task.name"
              class="task-row"
            >
              <div class="task-main">
                <span class="task-name">{{ formatTaskName(task.name) }}</span>
                <Tag class="source-tag" :color="sourceBadgeColor(task.source)">
                  {{ task.source_name }}
                </Tag>
              </div>
              <div class="task-meta">
                <span>{{ task.queue || task.routing_key || '-' }}</span>
                <span>{{ formatRuntime(task.time_start) }}</span>
                <Tooltip :title="task.id">
                  <span class="task-id">{{ task.id || '-' }}</span>
                </Tooltip>
              </div>
            </div>
          </div>
          <Empty
            v-else
            class="task-empty"
            description="暂无执行中任务"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
        <div class="task-lane">
          <div class="task-lane-head">
            <span>等待执行</span>
            <strong>{{ waitingTasks.length }}</strong>
          </div>
          <div v-if="waitingTasks.length > 0" class="task-list">
            <div
              v-for="task in waitingTasks"
              :key="`${task.state}-${task.id || task.name}`"
              class="task-row"
            >
              <div class="task-main">
                <span class="task-name">{{ formatTaskName(task.name) }}</span>
                <Tag>{{ taskStateLabel(task.state) }}</Tag>
              </div>
              <div class="task-meta">
                <span>{{ task.queue || task.routing_key || '-' }}</span>
                <span>{{ task.eta || '-' }}</span>
                <Tooltip :title="task.worker">
                  <span class="task-id">{{ task.worker }}</span>
                </Tooltip>
              </div>
            </div>
          </div>
          <Empty
            v-else
            class="task-empty"
            description="暂无等待任务"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
      </div>
    </div>

    <div v-if="recentExecutions.length > 0" class="queue-section">
      <div class="section-title">最近执行记录</div>
      <div class="execution-table">
        <div class="execution-row execution-head">
          <span>任务</span>
          <span>来源</span>
          <span>状态</span>
          <span>结果</span>
          <span>开始时间</span>
          <span>诊断</span>
          <span>心跳</span>
          <span>操作</span>
        </div>
        <div
          v-for="item in recentExecutions"
          :key="item.id"
          class="execution-row"
          :class="{ 'is-stale': item.stale }"
        >
          <span class="execution-name">{{
            item.task_name || item.task_type
          }}</span>
          <span>
            <Tag class="source-tag" :color="sourceBadgeColor(item.source)">
              {{
                item.source === 'servers_agent' ? '服务器 Agent' : '平台任务'
              }}
            </Tag>
          </span>
          <span>
            <Tag :color="executionStatusMeta(item).color">
              {{ executionStatusMeta(item).label }}
            </Tag>
          </span>
          <span>
            <Tooltip
              v-if="item.system_closed && item.failure_summary"
              :title="item.failure_summary"
            >
              <span class="execution-result is-cleanup">{{
                executionResultText(item)
              }}</span>
            </Tooltip>
            <span v-else class="execution-result">{{
              executionResultText(item)
            }}</span>
          </span>
          <Tooltip :title="item.id">
            <span class="execution-time">{{
              item.start_time || item.updated_at
            }}</span>
          </Tooltip>
          <div class="execution-diagnosis">
            <div class="diagnosis-main">
              <Tooltip :title="executionDiagnosisDetail(item)">
                <Tag
                  :color="executionDiagnosisColor(item.diagnosis_reason)"
                  class="diagnosis-tag"
                >
                  {{ executionDiagnosisLabel(item.diagnosis_reason) }}
                </Tag>
              </Tooltip>
              <Tag v-if="item.stale" color="red">疑似卡死</Tag>
            </div>
          </div>
          <div class="execution-heartbeat">
            {{ formatHeartbeat(item.stale_seconds) }}
            <span v-if="item.active_executions > 0">
              · 活跃 {{ item.active_executions }}
            </span>
          </div>
          <div class="execution-actions">
            <template v-if="item.stale && canOperateExecution">
              <Button
                danger
                size="small"
                type="link"
                :loading="actionLoadingId === item.id"
                @click="confirmCloseStaleExecution(item)"
              >
                收口
              </Button>
              <Button
                size="small"
                type="link"
                :loading="actionLoadingId === item.id"
                @click="rerunExecution(item)"
              >
                重跑
              </Button>
            </template>
            <span v-else class="execution-action-empty">-</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="queueGroups.length > 0" class="queue-section">
      <div class="section-title">队列负载</div>
      <div class="queue-groups">
        <div v-for="group in queueGroups" :key="group.key" class="queue-group">
          <div class="queue-group-title">{{ group.name }}</div>
          <div class="queue-lines">
            <div
              v-for="queue in group.queues"
              :key="queue.name"
              class="queue-line"
            >
              <span class="queue-name">{{ queue.name }}</span>
              <span>执行 {{ queue.active }}</span>
              <span>预取 {{ queue.reserved }}</span>
              <span>定时 {{ queue.scheduled }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Empty
      v-if="!loading && !status"
      description="暂无队列状态"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
    />
  </Card>
</template>

<style scoped>
.queue-status-panel {
  margin-bottom: 12px;
}

.queue-status-header {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid hsl(var(--border));
}

.header-main {
  min-width: 260px;
}

.queue-status-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}

.queue-status-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.status-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--destructive));
  border: 1px solid hsl(var(--destructive) / 45%);
  border-radius: 999px;
}

.status-pill.is-online {
  color: hsl(142deg 65% 45%);
  border-color: hsl(142deg 65% 35% / 45%);
}

.status-pill.is-refreshing {
  color: hsl(212deg 85% 58%);
  border-color: hsl(212deg 85% 52% / 45%);
}

.summary-strip {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(4, minmax(76px, 1fr));
  max-width: 520px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.summary-cell {
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 7px 10px;
  border-left: 1px solid hsl(var(--border));
}

.summary-cell:first-child {
  border-left: 0;
}

.summary-cell span {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.summary-cell strong {
  font-size: 16px;
  line-height: 20px;
}

.refresh-button {
  flex: none;
}

.queue-status-alert {
  margin-top: 12px;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.source-card {
  min-width: 0;
  padding: 10px 12px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.source-card.is-offline {
  background: hsl(var(--muted) / 35%);
  opacity: 0.8;
}

.source-card.source-admin {
  box-shadow: inset 3px 0 0 hsl(212deg 85% 52% / 65%);
}

.source-card.source-servers-agent {
  box-shadow: inset 3px 0 0 hsl(182deg 70% 38% / 65%);
}

.source-card-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.source-name-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.source-dot {
  width: 7px;
  height: 7px;
  background: hsl(142deg 65% 45%);
  border-radius: 999px;
}

.source-card.is-offline .source-dot {
  background: hsl(var(--muted-foreground));
}

.source-card-head strong {
  font-size: 24px;
  line-height: 28px;
}

.source-status {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 400;
  color: hsl(var(--muted-foreground));
}

.source-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.source-queues {
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.queue-section {
  margin-top: 14px;
}

.section-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

.worker-table {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.table-row {
  display: grid;
  grid-template-columns:
    minmax(190px, 1.1fr) 120px minmax(320px, 1.7fr)
    70px 210px;
  gap: 12px;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  font-size: 12px;
  border-top: 1px solid hsl(var(--border));
}

.table-row:first-child {
  border-top: 0;
}

.table-head {
  min-height: 34px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 35%);
}

.worker-name,
.queue-list {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.worker-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
}

.source-tag {
  margin-inline-end: 0;
}

.task-lanes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.task-lane {
  min-width: 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.task-lane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 32%);
  border-bottom: 1px solid hsl(var(--border));
}

.task-list {
  display: grid;
}

.task-row {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 8px 10px;
  font-size: 12px;
  border-top: 1px solid hsl(var(--border));
}

.task-row:first-child {
  border-top: 0;
}

.task-main,
.task-meta {
  display: flex;
  align-items: center;
  min-width: 0;
}

.task-main {
  gap: 8px;
}

.task-meta {
  gap: 12px;
  color: hsl(var(--muted-foreground));
}

.task-name,
.task-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.task-id {
  max-width: 220px;
}

.task-empty {
  padding: 16px 0;
}

.execution-table {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.execution-row {
  display: grid;
  grid-template-columns:
    minmax(190px, 1.2fr) 112px 96px minmax(160px, 0.85fr)
    155px minmax(150px, 0.78fr) minmax(118px, 0.62fr) 92px;
  gap: 12px;
  align-items: start;
  min-height: 38px;
  padding: 7px 10px;
  font-size: 12px;
  border-top: 1px solid hsl(var(--border));
}

.execution-row.is-stale {
  background: hsl(var(--destructive) / 6%);
}

.execution-row:first-child {
  border-top: 0;
}

.execution-head {
  min-height: 32px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 35%);
}

.execution-name,
.execution-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.execution-name {
  font-weight: 600;
}

.execution-result {
  color: hsl(var(--foreground));
}

.execution-result.is-cleanup {
  font-weight: 600;
  color: hsl(38deg 92% 42%);
}

.execution-time {
  color: hsl(var(--muted-foreground));
}

.execution-diagnosis {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-width: 0;
}

.diagnosis-main,
.execution-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-width: 0;
}

.execution-actions {
  justify-content: flex-start;
}

.execution-action-empty {
  color: hsl(var(--muted-foreground));
}

.diagnosis-tag {
  margin-inline-end: 0;
}

.execution-heartbeat {
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.queue-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}

.queue-group {
  min-width: 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.queue-group-title {
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 32%);
  border-bottom: 1px solid hsl(var(--border));
}

.queue-lines {
  display: grid;
}

.queue-line {
  display: grid;
  grid-template-columns: minmax(90px, 1fr) repeat(3, 54px);
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 6px 10px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  border-top: 1px solid hsl(var(--border));
}

.queue-line:first-child {
  border-top: 0;
}

.queue-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

@media (max-width: 900px) {
  .queue-status-header {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-strip,
  .source-grid,
  .task-lanes,
  .queue-groups {
    grid-template-columns: 1fr;
    max-width: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .execution-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .table-head {
    display: none;
  }

  .execution-head {
    display: none;
  }
}
</style>
