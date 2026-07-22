<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { AlertManagementApi } from '#/api/assets/alert-management';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, Checkbox, message, Segmented, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  ensureAlertTicket,
  exportAlerts,
  getAlertList,
  getAlertStatistics,
} from '#/api/assets/alert-management';

import { useAlertManagementActions } from './data';
import AlertAssign from './modules/assign.vue';
import BatchHandle from './modules/batch-handle.vue';
import AlertClose from './modules/close.vue';
import AlertDetail from './modules/detail.vue';
import AlertHandle from './modules/handle.vue';

const actions = useAlertManagementActions();
const router = useRouter();

// 统计相关状态
const statistics = ref<{
  byIp: any[];
  bySeverity: Array<{ count: number; severity: string }>;
  bySource: Record<string, number>;
  byStatus: Array<{ count: number; status: string }>;
  byType: any[];
  eventSubscription: {
    active: number;
    eventAlarmDevices: number;
    lastVerified?: string;
    total: number;
  };
  total: number;
}>({
  total: 0,
  byIp: [],
  byType: [],
  bySeverity: [],
  bySource: {},
  byStatus: [],
  eventSubscription: {
    active: 0,
    eventAlarmDevices: 0,
    total: 0,
  },
});
const loading = ref(false);
const displayMode = ref<'detail' | 'merged'>('detail');
const displayModeOptions = [
  { label: '单条明细', value: 'detail' },
  { label: '合并展示', value: 'merged' },
];
const mergedMode = computed(() => displayMode.value === 'merged');

// 批量选择
const checkedIds = ref<string[]>([]);

function getRowAlertId(row: AlertManagementApi.Alert): string {
  return row.alert_id;
}

function getPageIds(): string[] {
  return (gridApi.grid?.getData() || []).map((row: any) => getRowAlertId(row));
}

function getCurrentPageCheckedIds(): string[] {
  const pageIdSet = new Set(getPageIds());
  return checkedIds.value.filter((id) => pageIdSet.has(id));
}

const isAllChecked = computed(() => {
  const pageIds = getPageIds();
  return (
    pageIds.length > 0 && pageIds.every((id) => checkedIds.value.includes(id))
  );
});

function toggleAllCheck() {
  const pageIds = getPageIds();
  if (isAllChecked.value) {
    checkedIds.value = checkedIds.value.filter((id) => !pageIds.includes(id));
  } else {
    const newIds = [...new Set([...checkedIds.value, ...pageIds])];
    checkedIds.value = newIds;
  }
}

function isRowChecked(row: AlertManagementApi.Alert): boolean {
  return checkedIds.value.includes(getRowAlertId(row));
}

function toggleRowCheck(row: AlertManagementApi.Alert) {
  const rowId = getRowAlertId(row);
  checkedIds.value = isRowChecked(row)
    ? checkedIds.value.filter((id) => id !== rowId)
    : [...new Set([rowId, ...checkedIds.value])];
}

function handleDisplayModeChange() {
  checkedIds.value = [];
  gridApi.reload();
}

// 简单的统计数据
const stats = ref({
  pending: 0,
  processing: 0,
  resolved: 0,
  closed: 0,
});

// 获取统计数据
async function fetchStatistics() {
  try {
    loading.value = true;
    const data = await getAlertStatistics();

    // requestClient配置了responseReturn: 'data'，所以直接返回的是data字段
    const {
      by_ip,
      by_severity,
      by_source,
      by_status,
      by_type,
      event_subscription,
    } = data;

    // 计算总数
    const total = Object.values(by_status || {}).reduce(
      (sum: number, count: unknown) => sum + (count as number),
      0,
    );

    // 转换按严重程度统计
    const severityMap: Record<string, string> = {
      critical: '严重',
      major: '重大',
      minor: '次要',
      warning: '警告',
      info: '信息',
    };

    const bySeverity = Object.entries(by_severity || {}).map(
      ([severity, count]) => ({
        severity: severityMap[severity] || severity,
        count: count as number,
      }),
    );

    // 转换按状态统计
    const statusMap: Record<string, string> = {
      closed: '已关闭',
      pending: '待处理',
      processing: '处理中',
      resolved: '已处理',
    };

    const byStatus = Object.entries(by_status || {}).map(([status, count]) => ({
      status: statusMap[status] || status,
      count: count as number,
    }));

    statistics.value = {
      total,
      byIp: by_ip || [],
      byType: by_type || [],
      bySeverity,
      bySource: by_source || {},
      byStatus,
      eventSubscription: {
        active: event_subscription?.active || 0,
        eventAlarmDevices: event_subscription?.event_alarm_devices || 0,
        lastVerified: event_subscription?.last_verified,
        total: event_subscription?.total || 0,
      },
    };

    stats.value = {
      pending: by_status?.pending || 0,
      processing: by_status?.processing || 0,
      resolved: by_status?.resolved || 0,
      closed: by_status?.closed || 0,
    };
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    // 使用默认值，确保页面能正常显示
    statistics.value = {
      total: 0,
      byIp: [],
      byType: [],
      bySeverity: [],
      bySource: {},
      byStatus: [],
      eventSubscription: {
        active: 0,
        eventAlarmDevices: 0,
        total: 0,
      },
    };

    stats.value = {
      pending: 0,
      processing: 0,
      resolved: 0,
      closed: 0,
    };
  } finally {
    loading.value = false;
  }
}

const [HandleModal, handleModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: AlertHandle,
});

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: AlertDetail,
});

const [CloseModal, closeModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: AlertClose,
});

function handleDetailHandle(row: AlertManagementApi.Alert) {
  detailDrawerApi.close();
  handleProcess(row);
}

function handleDetailAssign(row: AlertManagementApi.Alert) {
  detailDrawerApi.close();
  handleAssign(row);
}

function handleDetailClose(row: AlertManagementApi.Alert) {
  // 关闭告警后，详情页也可以关闭
  handleClose(row);
  // detailDrawerApi.close(); // 移动到 handleClose 成功回调中或者让用户手动关？
  // 实际上 handleClose 现在打开的是 Modal，所以详情页可以先关掉，也可以留着。
  // 为了体验流畅，建议先关详情页，聚焦到关闭弹窗。
  detailDrawerApi.close();
}

function handleDetailTicket(row: AlertManagementApi.Alert) {
  detailDrawerApi.close();
  handleTicket(row);
}

const [AssignModal, assignModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: AlertAssign,
});

const [BatchHandleModal, batchHandleModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: BatchHandle,
});

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '硬件告警', value: 'hardware' },
          { label: '性能告警', value: 'performance' },
          { label: '安全告警', value: 'security' },
          { label: '网络告警', value: 'network' },
        ],
        placeholder: '请选择告警类型',
      },
      fieldName: 'alert_type',
      label: '告警类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '严重', value: 'critical' },
          { label: '重大', value: 'major' },
          { label: '次要', value: 'minor' },
          { label: '警告', value: 'warning' },
          { label: '信息', value: 'info' },
        ],
        placeholder: '请选择严重程度',
      },
      fieldName: 'severity',
      label: '严重程度',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '待处理', value: 'pending' },
          { label: '处理中', value: 'processing' },
          { label: '已处理', value: 'resolved' },
          { label: '已关闭', value: 'closed' },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Input',
      fieldName: 'assignee',
      label: '责任人',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '重大业务', value: 10 },
          { label: '重要业务', value: 30 },
          { label: '普通业务', value: 50 },
          { label: '测试备用', value: 80 },
        ],
        placeholder: '请选择优先级',
      },
      fieldName: 'group_priority',
      label: '优先级',
    },
    {
      component: 'Input',
      fieldName: 'handler',
      label: '处理人员',
    },
  ],
  showCollapseButton: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<AlertManagementApi.Alert> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    {
      type: 'seq',
      title: '序号',
      width: 70,
      fixed: 'left',
      slots: { default: 'checkbox_seq', header: 'checkbox_seq_header' },
    },
    { field: 'device_ip', title: '告警IP', width: 120 },
    {
      field: 'merged_count',
      title: '数量',
      width: 90,
      slots: { default: 'merged_count' },
    },
    { field: 'alert_code', title: '告警Code', width: 100 },
    {
      field: 'alert_name',
      title: '告警名称',
      width: 300,
      align: 'left',
      slots: { default: 'alert_name' },
    },
    {
      field: 'severity',
      title: '严重程度',
      width: 100,
      slots: { default: 'severity' },
    },
    {
      field: 'component',
      title: '告警组件',
      width: 100,
      slots: { default: 'component' },
    },
    {
      field: 'alert_type',
      title: '告警类型',
      width: 120,
      slots: { default: 'alert_type' },
    },
    {
      field: 'source',
      title: '采集方式',
      width: 100,
      slots: { default: 'source' },
    },
    { field: 'assignee', title: '责任人', width: 80 },
    {
      field: 'group_priority',
      title: '优先级',
      width: 100,
      slots: { default: 'group_priority' },
    },
    { field: 'asset_location', title: '资产位置', width: 200 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'handler', title: '处理人员', width: 80 },
    { field: 'alert_time', title: '告警时间', width: 180 },
    { field: 'handle_time', title: '处理时间', width: 180 },
    { field: 'description', title: '描述', width: 250 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 360,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const response = await getAlertList({
            page: page.currentPage,
            pageSize: page.pageSize,
            merged: mergedMode.value,
            ...formValues,
          });
          return response;
        } catch (error) {
          console.error('API 请求失败:', error);
          throw error;
        }
      },
    },
    response: {
      result: 'items',
      total: 'total',
      list: 'items',
    },
  },
  toolbarConfig: {
    custom: true,
    export: true,
    refresh: true,
    zoom: true,
  },
  rowConfig: {
    isHover: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  formOptions,
});

function handleView(row: AlertManagementApi.Alert) {
  detailDrawerApi.setData(row);
  detailDrawerApi.open();
}

function handleProcess(row: AlertManagementApi.Alert) {
  handleModalApi.setState({ title: '处理告警' });
  handleModalApi.setData(row);
  handleModalApi.open();
}

function handleAssign(row: AlertManagementApi.Alert) {
  assignModalApi.setState({ title: '分配处理人员' });
  assignModalApi.setData(row);
  assignModalApi.open();
}

function handleClose(row: AlertManagementApi.Alert) {
  closeModalApi.setData(row);
  closeModalApi.open();
}

async function handleTicket(row: AlertManagementApi.Alert) {
  try {
    const result = await ensureAlertTicket(row.alert_id);
    const ticketId = result.ticket?.id;
    if (!ticketId) {
      message.error('未获取到关联工单');
      return;
    }
    message.success(result.created ? '告警工单已创建' : '已打开关联工单');
    router.push({ path: '/work-platform/tickets', query: { ticketId } });
  } catch (error: any) {
    message.error(error.message || '转工单失败');
  }
}

async function handleExport() {
  try {
    const response: any = await exportAlerts({});
    let blob: Blob;
    if (response instanceof Blob) {
      blob = response;
    } else if (response?.data instanceof Blob) {
      blob = response.data;
    } else {
      blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `服务器告警_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    message.success('导出成功');
  } catch (error: any) {
    console.error('导出失败:', error);
    message.error(error.message || '导出失败');
  }
}

function handleBatchProcess() {
  const currentPageCheckedIds = getCurrentPageCheckedIds();
  checkedIds.value = currentPageCheckedIds;

  if (currentPageCheckedIds.length === 0) {
    message.warning('请选择要处理的告警');
    return;
  }

  batchHandleModalApi.setData({
    alert_ids: currentPageCheckedIds,
    count: currentPageCheckedIds.length,
  });
  batchHandleModalApi.open();
}

function handleBatchSuccess() {
  checkedIds.value = [];
  fetchStatistics();
  gridApi.reload();
}

// 组件挂载时获取统计数据
onMounted(() => {
  fetchStatistics();
});
</script>

<template>
  <Page auto-content-height>
    <HandleModal @success="gridApi.reload()" />
    <DetailDrawer
      @handle="handleDetailHandle"
      @assign="handleDetailAssign"
      @close="handleDetailClose"
      @ticket="handleDetailTicket"
    />
    <AssignModal @success="gridApi.reload()" />
    <CloseModal @success="gridApi.reload()" />
    <BatchHandleModal @success="handleBatchSuccess" />

    <Grid table-title="告警管理">
      <template #toolbar-actions>
        <Tag color="blue" class="stat-tag">
          告警总数: {{ statistics.total || 0 }}
        </Tag>
        <Tag color="warning" class="stat-tag">
          待处理: {{ stats.pending || 0 }}
        </Tag>
        <Tag color="processing" class="stat-tag">
          处理中: {{ stats.processing || 0 }}
        </Tag>
        <Tag color="success" class="stat-tag">
          已处理: {{ (stats.resolved || 0) + (stats.closed || 0) }}
        </Tag>
        <Tag color="cyan" class="stat-tag">
          事件推送: {{ statistics.bySource.eventservice || 0 }}
        </Tag>
        <Tag color="geekblue" class="stat-tag">
          订阅: {{ statistics.eventSubscription.active || 0 }}/{{
            statistics.eventSubscription.total || 0
          }}
        </Tag>
        <Tag color="purple" class="stat-tag">
          推送设备: {{ statistics.eventSubscription.eventAlarmDevices || 0 }}
        </Tag>
      </template>
      <template #toolbar-tools>
        <Segmented
          v-model:value="displayMode"
          :options="displayModeOptions"
          class="mr-2"
          @change="handleDisplayModeChange"
        />
        <Button
          v-if="actions.canBatch"
          class="mr-2"
          @click="handleBatchProcess()"
        >
          批量处理
        </Button>
        <Button v-if="actions.canExport" class="mr-2" @click="handleExport()">
          导出
        </Button>
      </template>

      <template #checkbox_seq="{ row, rowIndex }">
        <span class="flex items-center justify-center">
          <Checkbox
            v-if="isRowChecked(row)"
            :checked="true"
            @change="toggleRowCheck(row)"
          />
          <span
            v-else
            class="cursor-pointer hover:text-blue-500"
            @click="toggleRowCheck(row)"
          >
            {{ rowIndex + 1 }}
          </span>
        </span>
      </template>
      <template #checkbox_seq_header>
        <span class="flex justify-center">
          <Checkbox :checked="isAllChecked" @change="toggleAllCheck" />
        </span>
      </template>

      <template #merged_count="{ row }">
        <Tag v-if="mergedMode && (row.merged_count || 1) > 1" color="blue">
          {{ row.merged_count }} 条
        </Tag>
        <span v-else>-</span>
      </template>

      <template #alert_name="{ row }">
        <div class="flex items-center gap-2">
          <span>{{ row.alert_name }}</span>
          <Tag v-if="mergedMode && (row.merged_count || 1) > 1" color="blue">
            合并 {{ row.merged_count }} 条
          </Tag>
        </div>
      </template>

      <template #alert_type="{ row }">
        <Tag v-if="row.alert_type === 'hardware'" color="purple">
          {{ row.alert_type_text || '硬件告警' }}
        </Tag>
        <Tag v-else-if="row.alert_type === 'performance'" color="green">
          {{ row.alert_type_text || '性能告警' }}
        </Tag>
        <Tag v-else-if="row.alert_type === 'security'" color="red">
          {{ row.alert_type_text || '安全告警' }}
        </Tag>
        <Tag v-else-if="row.alert_type === 'network'" color="orange">
          {{ row.alert_type_text || '网络告警' }}
        </Tag>
        <Tag v-else>{{ row.alert_type_text || row.alert_type }}</Tag>
      </template>
      <template #severity="{ row }">
        <Tag v-if="row.severity === 'critical'" color="error">严重</Tag>
        <Tag v-else-if="row.severity === 'major'" color="magenta">重大</Tag>
        <Tag v-else-if="row.severity === 'minor'" color="orange">次要</Tag>
        <Tag v-else-if="row.severity === 'warning'" color="cyan">警告</Tag>
        <Tag v-else-if="row.severity === 'info'" color="default">信息</Tag>
        <Tag v-else>{{ row.severity_text || row.severity }}</Tag>
      </template>
      <template #component="{ row }">
        <Tag>{{ row.component_text || row.component || '-' }}</Tag>
      </template>
      <template #source="{ row }">
        <Tag v-if="row.source === 'eventservice'" color="cyan">事件推送</Tag>
        <Tag v-else-if="row.source === 'polling'" color="geekblue">
          定时轮询
        </Tag>
        <Tag v-else>{{ row.source_text || row.source || '-' }}</Tag>
      </template>
      <template #status="{ row }">
        <Tag v-if="row.status === 'pending'" color="default">待处理</Tag>
        <Tag v-else-if="row.status === 'processing'" color="processing">
          处理中
        </Tag>
        <Tag v-else-if="row.status === 'resolved'" color="success">已处理</Tag>
        <Tag v-else-if="row.status === 'closed'" color="default">已关闭</Tag>
        <Tag v-else>{{ row.status }}</Tag>
      </template>
      <template #group_priority="{ row }">
        <Tag v-if="row.group_priority === 10" color="magenta">
          {{ row.group_priority_name || '重大业务' }}
        </Tag>
        <Tag v-else-if="row.group_priority === 30" color="volcano">
          {{ row.group_priority_name || '重要业务' }}
        </Tag>
        <Tag v-else-if="row.group_priority === 50" color="gold">
          {{ row.group_priority_name || '普通业务' }}
        </Tag>
        <Tag v-else-if="row.group_priority === 80" color="default">
          {{ row.group_priority_name || '测试备用' }}
        </Tag>
        <Tag v-else>-</Tag>
      </template>
      <template #action="{ row }">
        <Button v-if="actions.canView" type="link" @click="handleView(row)">
          查看
        </Button>
        <Button type="link" @click="handleTicket(row)"> 工单 </Button>
        <Button
          v-if="actions.canAssign"
          type="link"
          :disabled="row.status === 'resolved' || row.status === 'closed'"
          @click="handleAssign(row)"
        >
          分配
        </Button>
        <Button
          v-if="actions.canHandle"
          type="link"
          :disabled="row.status === 'resolved' || row.status === 'closed'"
          @click="handleProcess(row)"
        >
          处理
        </Button>
        <Button
          v-if="actions.canClose"
          type="link"
          danger
          :disabled="row.status === 'resolved' || row.status === 'closed'"
          @click="handleClose(row)"
        >
          关闭
        </Button>
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
.stat-tag {
  font-size: 13px;
}

.stat-tag:not(:first-child) {
  margin-left: 4px;
}
</style>
