<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AuditLogApi } from '#/api/audit';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Card, Descriptions, Drawer, Empty, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAuditLogsApi } from '#/api/audit';

import {
  auditActionText,
  auditDisplayText,
  auditModuleText,
  auditResultColor,
  auditResultText,
  auditTargetTypeText,
  formatAuditJson,
  sanitizeAuditDisplayValue,
  useColumns,
  useFormSchema,
} from './data';

defineOptions({
  name: 'AuditLogs',
});

const detailOpen = ref(false);
const currentRecord = ref<AuditLogApi.AuditLog>();
const auditTotalExact = ref(true);

const detailActionText = computed(() =>
  auditActionText(
    currentRecord.value?.action,
    currentRecord.value?.target_type,
    currentRecord.value?.summary,
  ),
);

const detailModuleText = computed(() =>
  auditModuleText(currentRecord.value?.module),
);

const detailTargetTypeText = computed(() =>
  auditTargetTypeText(currentRecord.value?.target_type),
);

function parseAuditSnapshot(value?: any) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    try {
      return sanitizeAuditDisplayValue(JSON.parse(value));
    } catch {
      return sanitizeAuditDisplayValue(value);
    }
  }
  return sanitizeAuditDisplayValue(value);
}

function snapshotSummary(value?: any) {
  if (value === null || value === undefined || value === '') {
    return '无快照数据';
  }
  if (Array.isArray(value)) {
    return `列表数据，共 ${value.length} 项`;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return snapshotSummary(parsed);
    } catch {
      return `文本数据，长度 ${value.length}`;
    }
  }
  if (typeof value === 'object') {
    return `对象数据，共 ${Object.keys(value).length} 个字段`;
  }
  return '基础类型数据';
}

function compareSnapshotValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildObjectDiffSummary(beforeValue?: any, afterValue?: any) {
  const beforeData = parseAuditSnapshot(beforeValue);
  const afterData = parseAuditSnapshot(afterValue);

  if (
    !beforeData ||
    !afterData ||
    Array.isArray(beforeData) ||
    Array.isArray(afterData) ||
    typeof beforeData !== 'object' ||
    typeof afterData !== 'object'
  ) {
    return null;
  }

  const beforeRecord = beforeData as Record<string, unknown>;
  const afterRecord = afterData as Record<string, unknown>;
  const keySet = new Set([
    ...Object.keys(afterRecord),
    ...Object.keys(beforeRecord),
  ]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const key of keySet) {
    const hasBefore = Object.hasOwn(beforeRecord, key);
    const hasAfter = Object.hasOwn(afterRecord, key);
    if (!hasBefore && hasAfter) {
      added.push(key);
      continue;
    }
    if (hasBefore && !hasAfter) {
      removed.push(key);
      continue;
    }
    if (!compareSnapshotValue(beforeRecord[key], afterRecord[key])) {
      changed.push(key);
    }
  }

  return {
    added,
    changed,
    removed,
    total: added.length + changed.length + removed.length,
  };
}

function formatInlineValue(value: unknown) {
  if (value === undefined) {
    return '未设置';
  }
  if (value === null) {
    return '空';
  }
  if (typeof value === 'string') {
    return value || '空字符串';
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const detailDiffSummary = computed(() =>
  buildObjectDiffSummary(
    currentRecord.value?.before_data,
    currentRecord.value?.after_data,
  ),
);

const detailDiffItems = computed(() => {
  const beforeData = parseAuditSnapshot(currentRecord.value?.before_data);
  const afterData = parseAuditSnapshot(currentRecord.value?.after_data);

  if (
    !beforeData ||
    !afterData ||
    Array.isArray(beforeData) ||
    Array.isArray(afterData) ||
    typeof beforeData !== 'object' ||
    typeof afterData !== 'object'
  ) {
    return [];
  }

  const beforeRecord = beforeData as Record<string, unknown>;
  const afterRecord = afterData as Record<string, unknown>;
  const keySet = new Set([
    ...Object.keys(afterRecord),
    ...Object.keys(beforeRecord),
  ]);

  return [...keySet]
    .filter((key) => !compareSnapshotValue(beforeRecord[key], afterRecord[key]))
    .map((key) => {
      const hasBefore = Object.hasOwn(beforeRecord, key);
      const hasAfter = Object.hasOwn(afterRecord, key);
      let changeType = '修改';
      if (!hasBefore && hasAfter) {
        changeType = '新增';
      } else if (hasBefore && !hasAfter) {
        changeType = '移除';
      }
      return {
        afterText: formatInlineValue(afterRecord[key]),
        beforeText: formatInlineValue(beforeRecord[key]),
        changeType,
        key,
      };
    });
});

function formatDiffNames(items: string[], emptyText: string) {
  if (items.length === 0) {
    return emptyText;
  }
  if (items.length <= 8) {
    return items.join('、');
  }
  return `${items.slice(0, 8).join('、')} 等 ${items.length} 项`;
}

function onActionClick(e: OnActionClickParams<AuditLogApi.AuditLog>) {
  if (e.code === 'detail') {
    currentRecord.value = e.row;
    detailOpen.value = true;
  }
}

function normalizeDateRange(value?: unknown) {
  if (!Array.isArray(value) || value.length < 2) {
    return {};
  }
  const [start, end] = value;
  return {
    end_time: end ? `${String(end)} 23:59:59` : undefined,
    start_time: start ? `${String(start)} 00:00:00` : undefined,
  };
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
          const dateRange = normalizeDateRange(formValues.date_range);
          const result = await getAuditLogsApi({
            action: formValues.action || undefined,
            ...dateRange,
            limit: page.pageSize,
            module: formValues.module || undefined,
            operator_name: formValues.operator_name || undefined,
            result: formValues.result || undefined,
            search: formValues.search || undefined,
            skip: (page.currentPage - 1) * page.pageSize,
            target_type: formValues.target_type || undefined,
          });
          auditTotalExact.value = result.total_exact !== false;
          return result;
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    scrollX: {
      enabled: true,
    },
    stripe: true,
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<AuditLogApi.AuditLog>,
});
</script>

<template>
  <Page auto-content-height>
    <Alert
      v-if="!auditTotalExact"
      class="mb-3"
      message="审计日志较多，当前总数为有限计数结果；请结合时间、模块或操作人筛选查看精确范围。"
      show-icon
      type="info"
    />
    <Grid table-title="操作审计" />

    <Drawer
      v-model:open="detailOpen"
      destroy-on-close
      placement="right"
      title="审计详情"
      width="720"
    >
      <template v-if="currentRecord">
        <Card class="audit-detail-card" :bordered="false">
          <div class="audit-headline">
            <div class="audit-headline-main">
              <Tag :color="auditResultColor(currentRecord.result)">
                {{ auditResultText(currentRecord.result) }}
              </Tag>
              <span class="audit-headline-text">
                {{ detailModuleText }} / {{ detailActionText }}
              </span>
            </div>
            <div class="audit-headline-time">
              {{ currentRecord.created_at || '-' }}
            </div>
          </div>

          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="审计ID">
              {{ currentRecord.id || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="业务模块">
              {{ detailModuleText }}
            </Descriptions.Item>
            <Descriptions.Item label="操作动作">
              {{ detailActionText }}
            </Descriptions.Item>
            <Descriptions.Item label="目标类型">
              {{ detailTargetTypeText }}
            </Descriptions.Item>
            <Descriptions.Item label="目标ID">
              {{ auditDisplayText(currentRecord.target_id) }}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {{ auditDisplayText(currentRecord.operator_name) }}
            </Descriptions.Item>
            <Descriptions.Item label="操作人ID">
              {{ auditDisplayText(currentRecord.operator_id) }}
            </Descriptions.Item>
            <Descriptions.Item label="来源IP">
              {{ auditDisplayText(currentRecord.ip_address) }}
            </Descriptions.Item>
            <Descriptions.Item label="客户端信息" :span="2">
              <div class="audit-wrap-text">
                {{ auditDisplayText(currentRecord.user_agent) }}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="摘要" :span="2">
              <div class="audit-wrap-text">
                {{ auditDisplayText(currentRecord.summary) }}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="原始模块标识">
              {{ currentRecord.module || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="原始动作标识">
              {{ currentRecord.action || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="原始目标标识" :span="2">
              <div class="audit-wrap-text">
                {{ currentRecord.target_type || '-' }}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          v-if="detailDiffSummary"
          class="audit-detail-card"
          :bordered="false"
          title="变更概览"
        >
          <Descriptions bordered :column="1" size="small">
            <Descriptions.Item label="变更字段总数">
              {{ detailDiffSummary.total }}
            </Descriptions.Item>
            <Descriptions.Item label="新增字段">
              {{ formatDiffNames(detailDiffSummary.added, '无') }}
            </Descriptions.Item>
            <Descriptions.Item label="修改字段">
              {{ formatDiffNames(detailDiffSummary.changed, '无') }}
            </Descriptions.Item>
            <Descriptions.Item label="移除字段">
              {{ formatDiffNames(detailDiffSummary.removed, '无') }}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          v-if="detailDiffItems.length > 0"
          class="audit-detail-card"
          :bordered="false"
          title="字段差异明细"
        >
          <div class="audit-diff-list">
            <div
              v-for="item in detailDiffItems"
              :key="item.key"
              class="audit-diff-item"
            >
              <div class="audit-diff-header">
                <span class="audit-diff-key">{{ item.key }}</span>
                <Tag
                  :color="
                    item.changeType === '新增'
                      ? 'success'
                      : item.changeType === '移除'
                        ? 'error'
                        : 'processing'
                  "
                >
                  {{ item.changeType }}
                </Tag>
              </div>
              <div class="audit-diff-values">
                <div class="audit-diff-panel">
                  <div class="audit-diff-label">变更前</div>
                  <pre class="audit-diff-content">{{ item.beforeText }}</pre>
                </div>
                <div class="audit-diff-panel">
                  <div class="audit-diff-label">变更后</div>
                  <pre class="audit-diff-content">{{ item.afterText }}</pre>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          v-if="currentRecord.error_message"
          class="audit-detail-card audit-error-card"
          :bordered="false"
          title="错误信息"
        >
          <pre class="audit-error">{{
            auditDisplayText(currentRecord.error_message)
          }}</pre>
        </Card>

        <div class="audit-json-grid">
          <Card class="audit-detail-card" title="变更前" :bordered="false">
            <template #extra>
              <span class="audit-card-extra">
                {{ snapshotSummary(currentRecord.before_data) }}
              </span>
            </template>
            <pre
              v-if="formatAuditJson(currentRecord.before_data)"
              class="audit-json"
              v-text="formatAuditJson(currentRecord.before_data)"
            ></pre>
            <Empty v-else description="无变更前快照" />
          </Card>
          <Card class="audit-detail-card" title="变更后" :bordered="false">
            <template #extra>
              <span class="audit-card-extra">
                {{ snapshotSummary(currentRecord.after_data) }}
              </span>
            </template>
            <pre
              v-if="formatAuditJson(currentRecord.after_data)"
              class="audit-json"
              v-text="formatAuditJson(currentRecord.after_data)"
            ></pre>
            <Empty v-else description="无变更后快照" />
          </Card>
        </div>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.audit-detail-card {
  margin-bottom: 12px;
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
}

.audit-headline {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.audit-headline-main {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.audit-headline-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--ant-color-text);
}

.audit-headline-time,
.audit-card-extra {
  font-size: 12px;
  color: var(--ant-color-text-secondary);
}

.audit-wrap-text {
  color: var(--ant-color-text);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.audit-json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.audit-diff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audit-diff-item {
  padding: 12px;
  background: var(--ant-color-fill-quaternary);
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: var(--ant-border-radius);
}

.audit-diff-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.audit-diff-key {
  font-weight: 600;
  color: var(--ant-color-text);
  overflow-wrap: anywhere;
}

.audit-diff-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.audit-diff-panel {
  min-width: 0;
}

.audit-diff-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--ant-color-text-secondary);
}

.audit-diff-content {
  min-height: 44px;
  max-height: 240px;
  padding: 10px;
  margin: 0;
  overflow: auto;
  color: var(--ant-color-text);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  background: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
}

.audit-json,
.audit-error {
  max-height: 420px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ant-color-text);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  background: var(--ant-color-fill-quaternary);
  border: 1px solid var(--ant-color-border-secondary);
  border-radius: var(--ant-border-radius);
}

.audit-error-card :deep(.ant-card-head-title) {
  color: var(--ant-color-error);
}

:deep(.ant-descriptions-bordered .ant-descriptions-item-label) {
  background: var(--ant-color-fill-quaternary);
}

:deep(.ant-descriptions-bordered .ant-descriptions-item-content) {
  color: var(--ant-color-text);
  background: var(--ant-color-bg-container);
}

@media (max-width: 900px) {
  .audit-headline {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 900px) {
  .audit-json-grid {
    grid-template-columns: 1fr;
  }

  .audit-diff-values {
    grid-template-columns: 1fr;
  }
}
</style>
