<script lang="ts" setup>
import { computed, h, ref, watch } from 'vue';

import { Descriptions, Modal, Popover, Table, Tag } from 'ant-design-vue';

import { getTaskExecutionDetailApi } from '#/api/tasks/execution';
import {
  formatDiagnosticArea,
  formatDiagnosticList,
  formatMissingField,
  formatModelReferenceCatalogIssue,
  formatQualityFlag,
} from '#/utils/collection-diagnostics';

import { getTaskExecutionDisplayName, getTaskTypeLabel } from './task-labels';

defineOptions({ name: 'TaskExecutionDetailModal' });

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

interface Props {
  visible: boolean;
  executionId: null | string;
}

const loading = ref(false);
const detailData = ref<any>(null);
const detailPage = ref(1);
const detailPageSize = ref(50);

const statusMap: Record<string, { color: string; text: string }> = {
  success: { color: 'success', text: '成功' },
  failed: { color: 'error', text: '失败' },
  partial: { color: 'warning', text: '部分成功' },
  running: { color: 'processing', text: '运行中' },
  submitted: { color: 'processing', text: '已投递' },
  agent_pending: { color: 'purple', text: '等待 Agent 拉取' },
  rerun_requested: { color: 'purple', text: '等待 Agent 执行' },
  skipped: { color: 'default', text: '已跳过' },
  warning: { color: 'warning', text: '警告' },
};

const activeStatuses = new Set([
  'agent_pending',
  'rerun_requested',
  'running',
  'submitted',
]);

function getDetailDiagnostics(record: any) {
  return record?.diagnostics || record?.device_id?.diagnostics || null;
}

function getDiagnosticsTag(diagnostics: any) {
  const flags = diagnostics?.quality_flags || [];
  const coverage = diagnostics?.required_field_coverage?.percent;
  if (flags.length > 0) {
    return { color: 'warning', text: `${coverage ?? '-'}%` };
  }
  if (typeof coverage === 'number') {
    let color = 'error';
    if (coverage >= 90) {
      color = 'success';
    } else if (coverage >= 70) {
      color = 'warning';
    }
    return {
      color,
      text: `${coverage}%`,
    };
  }
  return { color: 'default', text: '-' };
}

function getDiagnosticsModelReference(diagnostics: any) {
  const reference = diagnostics?.model_reference;
  return reference && typeof reference === 'object' ? reference : null;
}

function formatDiagnosticsModelReference(reference: any) {
  if (!reference) return '-';
  return reference.catalog_model || reference.model || '-';
}

function renderDiagnosticsContent(diagnostics: any) {
  const profile = diagnostics?.profile || {};
  const coverage = diagnostics?.required_field_coverage || {};
  const missingFields = diagnostics?.missing_fields || [];
  const qualityFlags = diagnostics?.quality_flags || [];
  const components = diagnostics?.components || {};
  const sourcePaths = diagnostics?.source_paths || {};
  const modelReference = getDiagnosticsModelReference(diagnostics);
  const modelCatalogIssue = formatModelReferenceCatalogIssue(modelReference);
  const componentRows = Object.entries(components).map(
    ([name, summary]: [string, any]) =>
      h('div', { class: 'diagnostics-row' }, [
        h('span', { class: 'diagnostics-key' }, formatDiagnosticArea(name)),
        h(
          'span',
          `${summary.with_identity ?? 0}/${summary.count ?? 0} (${summary.identity_coverage_percent ?? 0}%)`,
        ),
      ]),
  );
  const sourcePathRows = Object.entries(sourcePaths).map(
    ([name, summary]: [string, any]) =>
      h('div', { class: 'diagnostics-row' }, [
        h('span', { class: 'diagnostics-key' }, formatDiagnosticArea(name)),
        h('span', `${summary.hit_count ?? 0}/${summary.candidate_count ?? 0}`),
      ]),
  );

  return h('div', { class: 'diagnostics-popover' }, [
    h('div', { class: 'diagnostics-row' }, [
      h('span', { class: 'diagnostics-key' }, '适配器'),
      h('span', profile.adapter_key || '-'),
    ]),
    h('div', { class: 'diagnostics-row' }, [
      h('span', { class: 'diagnostics-key' }, 'BMC'),
      h('span', profile.bmc_name || '-'),
    ]),
    h('div', { class: 'diagnostics-row' }, [
      h('span', { class: 'diagnostics-key' }, '固件'),
      h('span', profile.firmware_version || '-'),
    ]),
    h('div', { class: 'diagnostics-row' }, [
      h('span', { class: 'diagnostics-key' }, '关键字段'),
      h(
        'span',
        `${coverage.present ?? 0}/${coverage.total ?? 0} (${coverage.percent ?? 0}%)`,
      ),
    ]),
    ...(modelReference
      ? [
          h('div', { class: 'diagnostics-row' }, [
            h('span', { class: 'diagnostics-key' }, '型号目录'),
            h('span', { class: 'diagnostics-value' }, [
              formatDiagnosticsModelReference(modelReference),
              h(
                Tag,
                {
                  class: 'diagnostics-inline-tag',
                  color: modelReference.matched ? 'success' : 'warning',
                },
                () => (modelReference.matched ? '已匹配' : '未匹配'),
              ),
            ]),
          ]),
          h('div', { class: 'diagnostics-row' }, [
            h('span', { class: 'diagnostics-key' }, '采集型号'),
            h(
              'span',
              [modelReference.manufacturer, modelReference.model]
                .filter(Boolean)
                .join(' ') || '-',
            ),
          ]),
          ...(modelCatalogIssue
            ? [
                h('div', { class: 'diagnostics-row' }, [
                  h('span', { class: 'diagnostics-key' }, '目录核验'),
                  h('span', { class: 'diagnostics-value' }, modelCatalogIssue),
                ]),
              ]
            : []),
        ]
      : []),
    h('div', { class: 'diagnostics-section' }, '组件身份覆盖'),
    ...componentRows,
    h('div', { class: 'diagnostics-section' }, '来源路径'),
    ...(sourcePathRows.length > 0
      ? sourcePathRows
      : [h('div', { class: 'diagnostics-empty' }, '-')]),
    h('div', { class: 'diagnostics-section' }, '缺失字段'),
    h('div', formatDiagnosticList(missingFields, formatMissingField)),
    h('div', { class: 'diagnostics-section' }, '质量标记'),
    h('div', formatDiagnosticList(qualityFlags, formatQualityFlag)),
  ]);
}

const detailColumns = [
  {
    title: '设备名称',
    dataIndex: 'device_name',
    key: 'device_name',
    width: 150,
  },
  {
    title: '设备ID',
    dataIndex: 'device_id',
    key: 'device_id',
    width: 200,
    customRender: ({ record }: any) => {
      // device_id是JSON对象，提取id字段
      if (record.device_id && typeof record.device_id === 'object') {
        return record.device_id.id || '-';
      }
      return record.device_id || '-';
    },
  },
  {
    title: '设备类型',
    dataIndex: 'device_type',
    key: 'device_type',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ record }: any) => {
      const status = statusMap[record.status] || {
        color: 'default',
        text: record.status,
      };
      return h(Tag, { color: status.color }, () => status.text);
    },
  },
  {
    title: '采集质量',
    dataIndex: 'diagnostics',
    key: 'diagnostics',
    width: 120,
    customRender: ({ record }: any) => {
      const diagnostics = getDetailDiagnostics(record);
      if (!diagnostics) return '-';
      const tag = getDiagnosticsTag(diagnostics);
      return h(
        Popover,
        { overlayClassName: 'task-diagnostics-popover', placement: 'left' },
        {
          content: () => renderDiagnosticsContent(diagnostics),
          default: () => h(Tag, { color: tag.color }, () => tag.text),
        },
      );
    },
  },
  {
    title: '执行时间(ms)',
    dataIndex: 'execution_time_ms',
    key: 'execution_time_ms',
    width: 120,
  },
  {
    title: '开始时间',
    dataIndex: 'start_time',
    key: 'start_time',
    width: 180,
    customRender: ({ text }: any) => {
      return text ? new Date(text).toLocaleString('zh-CN') : '-';
    },
  },
  {
    title: '结束时间',
    dataIndex: 'end_time',
    key: 'end_time',
    width: 180,
    customRender: ({ text }: any) => {
      return text ? new Date(text).toLocaleString('zh-CN') : '-';
    },
  },
  {
    title: '错误信息',
    dataIndex: 'error_message',
    key: 'error_message',
    ellipsis: true,
    customRender: ({ text }: any) => {
      return text || '-';
    },
  },
];

const taskStatus = computed(() => {
  if (!detailData.value) return { color: 'default', text: '-' };
  if (detailData.value.system_closed) {
    return getFailureMeta(detailData.value);
  }
  if (detailData.value.stale && activeStatuses.has(detailData.value.status)) {
    return { color: 'warning', text: '疑似卡住' };
  }
  return (
    statusMap[detailData.value.status] || {
      color: 'default',
      text: detailData.value.status,
    }
  );
});

const taskDisplayName = computed(() =>
  detailData.value ? getTaskExecutionDisplayName(detailData.value) : '-',
);

const taskTypeLabel = computed(() =>
  getTaskTypeLabel(detailData.value?.task_type),
);

const failedCountMeta = computed(() => {
  if (detailData.value?.system_closed) {
    return {
      className: 'text-orange-600',
      label: '收口数',
    };
  }
  return {
    className: 'text-red-600',
    label: '失败数',
  };
});

const executionTime = computed(() => {
  if (!detailData.value?.start_time || !detailData.value?.end_time) return '-';
  const start = new Date(detailData.value.start_time).getTime();
  const end = new Date(detailData.value.end_time).getTime();
  const diff = end - start;
  if (diff < 1000) return `${diff}ms`;
  if (diff < 60_000) return `${(diff / 1000).toFixed(2)}s`;
  return `${(diff / 60_000).toFixed(2)}min`;
});

const taskParamsText = computed(() => formatJson(detailData.value?.params));
const failedDevicesText = computed(() =>
  formatJson(detailData.value?.failed_devices),
);
const discoveredDevices = computed(() => {
  const failedDevices = detailData.value?.failed_devices;
  if (!failedDevices || typeof failedDevices !== 'object') return [];
  return Array.isArray(failedDevices.discovered_devices)
    ? failedDevices.discovered_devices
    : [];
});
const detailPagination = computed(() => ({
  current: detailPage.value,
  pageSize: detailPageSize.value,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条明细`,
  size: 'small' as const,
  total:
    detailData.value?.details_total ?? detailData.value?.details?.length ?? 0,
}));

function getFailureMeta(record: any) {
  if (record?.failure_category === 'manual_cleanup') {
    return { color: 'warning', text: '人工收口' };
  }
  if (record?.failure_category === 'system_cleanup') {
    return { color: 'warning', text: '系统收口' };
  }
  return { color: 'error', text: '业务失败' };
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.executionId) {
      detailPage.value = 1;
      await loadDetail(1, detailPageSize.value);
    }
  },
);

async function loadDetail(
  page = detailPage.value,
  pageSize = detailPageSize.value,
) {
  if (!props.executionId) return;

  loading.value = true;
  try {
    const response = await getTaskExecutionDetailApi(props.executionId, {
      detail_limit: pageSize,
      detail_skip: (page - 1) * pageSize,
    });
    detailData.value = response;
    detailPage.value = page;
    detailPageSize.value = pageSize;
  } catch (error: any) {
    console.error('加载详情失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:visible', false);
  detailData.value = null;
  detailPage.value = 1;
}

function formatJson(value: any) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

async function handleDetailTableChange(pagination: any) {
  await loadDetail(pagination.current || 1, pagination.pageSize || 50);
}
</script>

<template>
  <Modal
    :open="visible"
    title="执行记录详情"
    width="1200px"
    :footer="null"
    :loading="loading"
    @cancel="handleClose"
  >
    <div v-if="detailData">
      <Descriptions :column="2" bordered size="small" class="mb-4">
        <Descriptions.Item label="任务名称" :span="2">
          {{ taskDisplayName }}
        </Descriptions.Item>
        <Descriptions.Item label="任务类型">
          {{ taskTypeLabel }}
        </Descriptions.Item>
        <Descriptions.Item label="执行状态">
          <Tag :color="taskStatus.color">{{ taskStatus.text }}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="总数">
          {{ detailData.total }}
        </Descriptions.Item>
        <Descriptions.Item label="成功数">
          <span class="text-green-600">{{ detailData.collected }}</span>
        </Descriptions.Item>
        <Descriptions.Item :label="failedCountMeta.label">
          <span :class="failedCountMeta.className">{{
            detailData.failed
          }}</span>
        </Descriptions.Item>
        <Descriptions.Item
          v-if="detailData.failure_summary"
          label="结果说明"
          :span="2"
        >
          {{ detailData.failure_summary }}
        </Descriptions.Item>
        <Descriptions.Item label="执行时长">
          {{ executionTime }}
        </Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {{
            detailData.start_time
              ? new Date(detailData.start_time).toLocaleString('zh-CN')
              : '-'
          }}
        </Descriptions.Item>
        <Descriptions.Item label="结束时间">
          {{
            detailData.end_time
              ? new Date(detailData.end_time).toLocaleString('zh-CN')
              : '-'
          }}
        </Descriptions.Item>
        <Descriptions.Item v-if="taskParamsText" label="任务参数" :span="2">
          <pre class="json-block">{{ taskParamsText }}</pre>
        </Descriptions.Item>
      </Descriptions>

      <div v-if="discoveredDevices.length > 0" class="mb-4">
        <div class="mb-2 text-base font-medium">发现待补录设备</div>
        <Table
          :columns="[
            { title: 'IP', dataIndex: 'ip', width: 150 },
            { title: 'MAC', dataIndex: 'mac', width: 170 },
            { title: '厂商', dataIndex: 'vendor', width: 140 },
            { title: '型号', dataIndex: 'model', width: 160 },
            { title: '发现时间', dataIndex: 'discovered_at', width: 190 },
          ]"
          :data-source="discoveredDevices"
          :pagination="{ pageSize: 8, size: 'small' }"
          size="small"
          row-key="ip"
        />
      </div>

      <div v-if="failedDevicesText" class="mb-4">
        <div class="mb-2 text-base font-medium">执行扩展信息</div>
        <pre class="json-block">{{ failedDevicesText }}</pre>
      </div>

      <div v-if="detailData.details && detailData.details.length > 0">
        <div class="mb-2 text-base font-medium">执行详情</div>
        <Table
          :columns="detailColumns"
          :data-source="detailData.details"
          :pagination="detailPagination"
          :scroll="{ x: 1000, y: 400 }"
          size="small"
          row-key="id"
          @change="handleDetailTableChange"
        />
      </div>

      <div
        v-else
        class="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500"
      >
        暂无执行详情
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.json-block {
  max-height: 220px;
  padding: 8px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  background: hsl(var(--muted) / 50%);
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

:global(.task-diagnostics-popover) {
  max-width: 420px;
}

:global(.task-diagnostics-popover .diagnostics-popover) {
  min-width: 280px;
  max-width: 380px;
  font-size: 12px;
  line-height: 1.6;
}

:global(.task-diagnostics-popover .diagnostics-row) {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

:global(.task-diagnostics-popover .diagnostics-key) {
  flex: 0 0 76px;
  color: hsl(var(--muted-foreground));
}

:global(.task-diagnostics-popover .diagnostics-value) {
  display: inline-flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

:global(.task-diagnostics-popover .diagnostics-inline-tag) {
  margin-inline-end: 0;
}

:global(.task-diagnostics-popover .diagnostics-section) {
  margin-top: 8px;
  font-weight: 500;
}
</style>
