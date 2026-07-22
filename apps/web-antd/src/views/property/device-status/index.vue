<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { DeviceStatusApi } from '#/api/assets/device-status';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Progress, Space, Tag, Tooltip } from 'ant-design-vue';
import { RefreshCw } from 'lucide-vue-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeviceStatusOverview } from '#/api/assets/device-status';
import { MetricChartCard } from '#/components/metric-chart-card';

const overview = ref<DeviceStatusApi.DeviceStatusOverview>({
  total: 0,
  online_subscribed: 0,
  online_subscription_stale: 0,
  online_polling: 0,
  offline: 0,
  auth_failed: 0,
  not_supported: 0,
  other_errors: 0,
  event_alarm_devices: 0,
  event_alarm_total: 0,
  unresolved_alarm_total: 0,
  devices: [],
});
const route = useRoute();
const loading = ref(false);

async function fetchData() {
  try {
    loading.value = true;
    const res = await getDeviceStatusOverview();
    overview.value = res as DeviceStatusApi.DeviceStatusOverview;
  } catch (error) {
    console.error('获取设备连接状态失败:', error);
  } finally {
    loading.value = false;
  }
}

const formOptions: VbenFormProps = {
  actionLayout: 'inline',
  actionPosition: 'right',
  actionWrapperClass: 'min-w-[150px]',
  collapsed: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  schema: [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入设备 IP',
      },
      fieldName: 'ip_address',
      label: '设备 IP',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'EventService 推送', value: 'eventservice' },
          { label: 'EventService 待复核', value: 'eventservice_stale' },
          { label: '定时轮询', value: 'polling' },
          { label: '无活动', value: 'none' },
        ],
        placeholder: '请选择连接模式',
      },
      fieldName: 'connection_mode',
      label: '连接模式',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '管理口在线(订阅)', value: 'online_subscribed' },
          {
            label: '管理口在线(订阅待复核)',
            value: 'online_subscription_stale',
          },
          { label: '管理口在线(轮询)', value: 'online_polling' },
          { label: '管理口离线', value: 'offline' },
          { label: '认证失败', value: 'auth_failed' },
          { label: '不受支持', value: 'not_supported' },
          { label: '其他错误', value: 'other_errors' },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'status_category',
      label: '状态分类',
    },
  ],
  showCollapseButton: false,
  submitOnEnter: true,
  submitOnChange: true,
};

const subscribedRatio = computed(() => {
  if (!overview.value.total) return 0;
  return Math.round(
    (overview.value.online_subscribed / overview.value.total) * 100,
  );
});

const connectionErrorCount = computed(
  () =>
    overview.value.auth_failed +
    overview.value.not_supported +
    overview.value.other_errors,
);

const healthyCount = computed(
  () =>
    overview.value.online_subscribed +
    overview.value.online_subscription_stale +
    overview.value.online_polling,
);

const healthRatio = computed(() => {
  if (!overview.value.total) return 0;
  return Math.round((healthyCount.value / overview.value.total) * 100);
});

const statusChartData = computed(() => [
  { label: '管理口在线(订阅)', value: overview.value.online_subscribed },
  {
    label: '管理口在线(订阅待复核)',
    value: overview.value.online_subscription_stale,
  },
  { label: '管理口在线(轮询)', value: overview.value.online_polling },
  { label: '管理口离线', value: overview.value.offline },
  { label: '认证失败', value: overview.value.auth_failed },
  { label: '不受支持', value: overview.value.not_supported },
  { label: '其他错误', value: overview.value.other_errors },
]);

const metricCards = computed(() => [
  {
    chartData: statusChartData.value,
    chartType: 'donut' as const,
    description: `健康率 ${healthRatio.value}%`,
    icon: 'lucide:server',
    label: '设备总数',
    tone: 'info' as const,
    value: overview.value.total,
  },
  {
    chartData: statusChartData.value,
    chartType: 'line' as const,
    description: `近期验证覆盖率 ${subscribedRatio.value}%`,
    icon: 'lucide:bell-ring',
    label: 'EventService 正常',
    tone: 'success' as const,
    value: overview.value.online_subscribed,
  },
  {
    chartData: statusChartData.value,
    chartType: 'bar' as const,
    description: '保留有效订阅，等待再次校验',
    icon: 'lucide:clock-3',
    label: '订阅待复核',
    tone: 'info' as const,
    value: overview.value.online_subscription_stale,
  },
  {
    chartData: statusChartData.value,
    chartType: 'bar' as const,
    description: '管理口在线但未使用事件推送',
    icon: 'lucide:calendar-clock',
    label: '定时轮询',
    tone: 'warning' as const,
    value: overview.value.online_polling,
  },
  {
    chartData: statusChartData.value,
    chartType: 'bar' as const,
    description: '管理口当前不可达',
    icon: 'lucide:circle-alert',
    label: '管理口离线',
    tone:
      overview.value.offline > 0 ? ('danger' as const) : ('success' as const),
    value: overview.value.offline,
  },
  {
    chartData: statusChartData.value,
    chartType: 'bar' as const,
    description: '认证失败、不支持或其他错误',
    icon: 'lucide:triangle-alert',
    label: '连接异常',
    tone:
      connectionErrorCount.value > 0
        ? ('danger' as const)
        : ('success' as const),
    value: connectionErrorCount.value,
  },
]);

const healthItems = computed(() => [
  {
    color: 'success',
    label: 'EventService',
    text: `正常 ${overview.value.online_subscribed} 台，待复核 ${overview.value.online_subscription_stale} 台；${overview.value.event_alarm_devices} 台产生过推送。`,
  },
  {
    color: 'warning',
    label: '轮询兜底',
    text: `${overview.value.online_polling} 台设备在线但未使用事件订阅，依赖定时轮询发现告警。`,
  },
  {
    color: 'error',
    label: '优先排障',
    text: `离线 ${overview.value.offline} 台，认证失败 ${overview.value.auth_failed} 台，不支持 ${overview.value.not_supported} 台，其他错误 ${overview.value.other_errors} 台。`,
  },
]);

function formatTime(value?: null | string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

function handleRefresh() {
  gridApi.query();
}

const gridOptions: VxeGridProps<DeviceStatusApi.DeviceStatusItem> = {
  checkboxConfig: { highlight: true },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    { field: 'ip_address', title: '设备 IP', width: 140, fixed: 'left' },
    {
      field: 'brand_name',
      title: '品牌/型号',
      minWidth: 180,
      slots: { default: 'brand_model' },
    },
    {
      field: 'status_category',
      title: '连接状态',
      width: 180,
      slots: { default: 'status_category' },
    },
    {
      field: 'connection_mode',
      title: '连接模式',
      width: 150,
      slots: { default: 'connection_mode' },
    },
    {
      field: 'subscription_last_verified',
      title: '订阅校验',
      minWidth: 170,
      slots: { default: 'subscription_last_verified' },
    },
    {
      field: 'last_event_at',
      title: '最近推送',
      minWidth: 150,
      slots: { default: 'last_event_at' },
    },
    {
      field: 'event_alarm_count',
      title: '推送告警',
      width: 110,
      slots: { default: 'event_alarm_count' },
    },
    {
      field: 'power_state',
      title: '电源状态',
      width: 100,
      slots: { default: 'power_state' },
    },
    {
      field: 'last_error',
      title: '最后错误',
      minWidth: 220,
      slots: { default: 'last_error' },
    },
  ],
  keepSource: true,
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        await fetchData();
        let filtered = overview.value.devices;
        const ipAddress = String(formValues?.ip_address || '').trim();
        if (ipAddress) {
          filtered = filtered.filter((d) =>
            String(d.ip_address || '').includes(ipAddress),
          );
        }
        if (formValues?.connection_mode) {
          filtered = filtered.filter(
            (d) => d.connection_mode === formValues.connection_mode,
          );
        }
        if (formValues?.status_category) {
          filtered = filtered.filter(
            (d) => d.status_category === formValues.status_category,
          );
        }
        const total = filtered.length;
        const start = (page.currentPage - 1) * page.pageSize;
        const items = filtered.slice(start, start + page.pageSize);
        return { items, total };
      },
    },
    response: { result: 'items', total: 'total', list: 'items' },
  },
  toolbarConfig: { refresh: true, zoom: true },
  rowConfig: { isHover: true },
  scrollX: { enabled: true },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

onMounted(async () => {
  const routeIp = String(route.query.ip || '').trim();
  if (routeIp) {
    await gridApi.formApi.setValues({ ip_address: routeIp });
  }
  await gridApi.query();
});
</script>

<template>
  <Page auto-content-height>
    <div class="device-status-page">
      <div class="page-header">
        <div>
          <h2>设备连接状态</h2>
          <p>统一查看服务器在线、EventService 订阅、轮询兜底和连接异常。</p>
        </div>
        <Space>
          <Button :loading="loading" @click="handleRefresh">
            <RefreshCw class="button-icon" />
            刷新
          </Button>
        </Space>
      </div>

      <div class="metric-grid">
        <MetricChartCard
          v-for="item in metricCards"
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

      <div class="status-summary">
        <div class="summary-main">
          <div class="summary-label">连接健康率</div>
          <div class="summary-value">{{ healthRatio }}%</div>
          <Progress
            class="summary-progress"
            :percent="healthRatio"
            :show-info="false"
            size="small"
            status="active"
          />
        </div>
        <div v-for="item in healthItems" :key="item.label" class="summary-item">
          <Tag :color="item.color">{{ item.label }}</Tag>
          <span>{{ item.text }}</span>
        </div>
      </div>

      <Grid table-title="设备连接状态总览" :loading="loading">
        <template #brand_model="{ row }">
          <div class="device-title">{{ row.brand_name || '-' }}</div>
          <div class="device-subtitle">{{ row.model_name || '-' }}</div>
        </template>
        <template #status_category="{ row }">
          <div class="status-cell">
            <Tag
              v-if="row.status_category === 'online_subscribed'"
              color="success"
            >
              在线 · EventService
            </Tag>
            <Tag
              v-else-if="row.status_category === 'online_subscription_stale'"
              color="processing"
            >
              在线 · 订阅待复核
            </Tag>
            <Tag
              v-else-if="row.status_category === 'online_polling'"
              color="orange"
            >
              在线 · 定时轮询
            </Tag>
            <Tag v-else-if="row.status_category === 'offline'" color="default">
              管理口离线
            </Tag>
            <Tag
              v-else-if="row.status_category === 'auth_failed'"
              color="error"
            >
              认证失败
            </Tag>
            <Tag
              v-else-if="row.status_category === 'not_supported'"
              color="default"
            >
              不受支持
            </Tag>
            <Tag
              v-else-if="row.status_category === 'other_errors'"
              color="warning"
            >
              其他错误
            </Tag>
            <Tag v-else>{{ row.status_category }}</Tag>
          </div>
        </template>
        <template #connection_mode="{ row }">
          <Tag v-if="row.connection_mode === 'eventservice'" color="cyan">
            EventService 推送
          </Tag>
          <Tag
            v-else-if="row.connection_mode === 'eventservice_stale'"
            color="processing"
          >
            EventService 待复核
          </Tag>
          <Tag v-else-if="row.connection_mode === 'polling'" color="orange">
            定时轮询
          </Tag>
          <Tag v-else color="default">无活动</Tag>
        </template>
        <template #subscription_last_verified="{ row }">
          <Tooltip
            v-if="row.subscription_destination"
            :title="row.subscription_destination"
          >
            <div class="verify-time">
              {{ formatTime(row.subscription_last_verified) }}
            </div>
            <div class="verify-id">{{ row.subscription_id || '-' }}</div>
          </Tooltip>
          <span v-else class="muted">-</span>
        </template>
        <template #last_event_at="{ row }">
          <span>{{ formatTime(row.last_event_at) }}</span>
        </template>
        <template #event_alarm_count="{ row }">
          <Space size="small">
            <Tag color="cyan">{{ row.event_alarm_count || 0 }}</Tag>
            <Tag v-if="row.unresolved_alarm_count > 0" color="warning">
              未关 {{ row.unresolved_alarm_count }}
            </Tag>
          </Space>
        </template>
        <template #power_state="{ row }">
          <Tag v-if="row.power_state === 'on'" color="success">上电</Tag>
          <Tag v-else-if="row.power_state === 'off'" color="default">下电</Tag>
          <Tag v-else color="default">{{ row.power_state }}</Tag>
        </template>
        <template #last_error="{ row }">
          <Tooltip v-if="row.last_error" :title="row.last_error">
            <span class="error-text">{{ row.last_error }}</span>
          </Tooltip>
          <span v-else class="muted">无</span>
        </template>
      </Grid>
    </div>
  </Page>
</template>

<style scoped>
.device-status-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.page-header p,
.muted {
  margin: 4px 0 0;
  color: hsl(var(--muted-foreground));
}

.button-icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
  vertical-align: -2px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.status-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.summary-main,
.summary-item {
  min-height: 46px;
  padding: 6px 10px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.summary-main {
  display: grid;
  grid-template-columns: auto auto minmax(72px, 1fr);
  gap: 10px;
  align-items: center;
}

.summary-label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.summary-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.summary-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
  white-space: nowrap;
}

.summary-progress {
  min-width: 72px;
}

.status-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
}

.device-title,
.verify-time {
  font-weight: 500;
}

.device-subtitle,
.verify-id {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.error-text {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  color: hsl(var(--destructive));
  white-space: nowrap;
}

@media (max-width: 1280px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .status-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .metric-grid,
  .status-summary {
    grid-template-columns: 1fr;
  }
}
</style>
