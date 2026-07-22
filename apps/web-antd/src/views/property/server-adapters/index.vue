<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  HardwareAdapterAuditLog,
  HardwareAdapterCollectRecord,
  HardwareAdapterCollectResult,
  HardwareAdapterCoverageResult,
  HardwareAdapterItem,
  HardwareAdapterQualityResult,
} from '#/api';

import { computed, h, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Alert,
  Badge,
  Button,
  Descriptions,
  Drawer,
  Input,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  collectHardwareAdapterTestApi,
  getHardwareAdapterAuditLogsApi,
  getHardwareAdapterCandidatesApi,
  getHardwareAdapterCollectRecordsApi,
  getHardwareAdapterCoverageApi,
  getHardwareAdapterImpactApi,
  getHardwareAdapterQualityApi,
  getHardwareAdaptersApi,
  syncHardwareAdaptersApi,
  updateHardwareAdapterEnabledApi,
} from '#/api';

const { hasAccessByCodes } = useAccess();
const canCollectAdapter = computed(() =>
  hasAccessByCodes(['property_server_adapters:collect']),
);
const canToggleAdapter = computed(() =>
  hasAccessByCodes(['property_server_adapters:toggle']),
);

const adapters = ref<HardwareAdapterItem[]>([]);
const selectedAdapter = ref<HardwareAdapterItem>();
const detailDrawerOpen = ref(false);
const detailTab = ref('overview');
const collectLoading = ref(false);
const candidateLoading = ref(false);
const auditLoading = ref(false);
const collectRecordLoading = ref(false);
const coverageLoading = ref(false);
const qualityLoading = ref(false);
const collectResult = ref<HardwareAdapterCollectResult>();
const collectRecords = ref<HardwareAdapterCollectRecord[]>([]);
const auditLogs = ref<HardwareAdapterAuditLog[]>([]);
const coverageResult = ref<HardwareAdapterCoverageResult>();
const qualityResult = ref<HardwareAdapterQualityResult>();
const syncLoading = ref(false);
const filterMode = ref<'all' | 'disabled' | 'enabled'>('all');
const deviceIp = ref('');
const keyword = ref('');
const filteredTotal = ref(0);
const serverOptions = ref<
  Array<{
    brandName: string;
    firmwareVersion: string;
    label: string;
    matchedRule: string;
    modelName: string;
    status: string;
    value: string;
  }>
>([]);
const overviewDescription =
  '按品牌、型号、固件版本控制采集适配器，生产采集和验证采集共同反馈规则命中与数据质量。';

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

const adapterStats = computed(() => {
  const enabled = adapters.value.filter((item) => item.enabled).length;
  const total = adapters.value.length;
  const fullRules = adapters.value.reduce(
    (sum, item) =>
      sum +
      (item.rules || []).filter((rule) => rule.support_level === 'full').length,
    0,
  );
  const rules = adapters.value.reduce(
    (sum, item) => sum + (item.rule_count || 0),
    0,
  );
  return {
    disabled: total - enabled,
    enabled,
    enabledRate: total ? Math.round((enabled / total) * 100) : 0,
    fullRules,
    rules,
    total,
  };
});

const overviewMetrics = computed(() => [
  { label: '适配器', value: adapterStats.value.total },
  { label: '已启用', value: adapterStats.value.enabled },
  { label: '禁用', value: adapterStats.value.disabled },
  { label: '规则', value: adapterStats.value.rules },
  { label: '全支持', value: adapterStats.value.fullRules },
]);

const selectedCapabilities = computed(
  () => selectedAdapter.value?.capability_labels || [],
);

const collectCounts = computed(
  () => collectResult.value?.summary?.counts || {},
);

const collectObjects = computed(
  () => collectResult.value?.summary?.objects || {},
);

const collectIssueCount = computed(() => {
  const summary = collectResult.value?.summary;
  return (
    (summary?.quality_flags || []).length +
    (summary?.missing_fields || []).length
  );
});

const collectIssueRows = computed(() => {
  const summary = collectResult.value?.summary;
  const qualityFlags = (summary?.quality_flags || []).map((key) => ({
    key,
    rowKey: `quality:${key}`,
    source: '质量标记',
    text: qualityIssueText(key),
  }));
  const missingFields = (summary?.missing_fields || []).map((key) => ({
    key,
    rowKey: `missing:${key}`,
    source: '缺失字段',
    text: qualityIssueText(key),
  }));
  return [...qualityFlags, ...missingFields];
});

const collectHealth = computed(() => {
  if (!collectResult.value) {
    return {
      description: '请选择命中当前规则的服务器后执行验证采集。',
      label: '未验证',
      type: 'info' as const,
    };
  }
  if (collectResult.value.quality_rating) {
    const rating = collectResult.value.quality_rating;
    return {
      description: rating.reason,
      label: rating.label,
      type: alertTypeFromLevel(rating.level),
    };
  }
  if (collectResult.value.status !== 'success') {
    return {
      description: collectResult.value.message || '设备连接或采集过程失败。',
      label: '验证失败',
      type: 'error' as const,
    };
  }
  if (collectIssueCount.value > 0) {
    return {
      description:
        '采集接口可用，但存在部件未采集或关键字段缺失，需要继续检查规则覆盖和 Redfish 数据质量。',
      label: '采集完成，存在质量问题',
      type: 'warning' as const,
    };
  }
  return {
    description: '采集完成，核心部件数量和关键字段覆盖正常。',
    label: '采集完整',
    type: 'success' as const,
  };
});

const collectSummaryItems = computed(() => [
  {
    label: '命中规则',
    value:
      (collectResult.value?.summary?.adapter_variant as any)?.key ||
      selectedPredictedRule.value?.key ||
      '-',
  },
  {
    label: '质量问题',
    value: collectIssueCount.value,
  },
  {
    label: '采集对象',
    value: collectCountRows.value.length,
  },
  {
    label: '设备固件',
    value:
      collectResult.value?.summary?.profile?.firmware_version ||
      selectedServer.value?.firmwareVersion ||
      '-',
  },
]);

const qualitySummaryItems = computed(() => {
  const summary = qualityResult.value?.summary;
  return [
    { label: '30天采集', value: summary?.total ?? 0 },
    {
      label: '成功率',
      value:
        summary?.success_rate === null || summary?.success_rate === undefined
          ? '-'
          : `${summary.success_rate}%`,
    },
    { label: '失败', value: summary?.failed ?? 0 },
    { label: '质量问题', value: summary?.with_issues ?? 0 },
  ];
});

const matchedServerOptions = computed(() => {
  return serverOptions.value;
});

const selectedServer = computed(() =>
  serverOptions.value.find((server) => server.value === deviceIp.value),
);

const selectedPredictedRule = computed(() => {
  const adapter = selectedAdapter.value;
  const server = selectedServer.value;
  if (!adapter || !server) {
    return undefined;
  }
  if (server.matchedRule) {
    const matched = adapter.rules?.find(
      (rule) => rule.key === server.matchedRule,
    );
    if (matched) {
      return matched;
    }
  }
  return findMatchedRule(adapter, server);
});

const collectCountColumns = [
  { title: '采集对象', dataIndex: 'label' },
  { title: '数量', dataIndex: 'value', width: 100 },
  { title: '状态', dataIndex: 'status', width: 110 },
  { title: '返回数据', dataIndex: 'data_state', width: 120 },
];

const collectCountRows = computed(() =>
  Object.entries(collectCounts.value).map(([key, value]) => ({
    items: collectObjects.value[key] || [],
    key,
    label: collectCountLabel(key),
    rowKey: key,
    status: value > 0 ? '已采集' : '未采集',
    value,
  })),
);

const collectIssueColumns = [
  { title: '类型', dataIndex: 'source', width: 100 },
  { title: '问题说明', dataIndex: 'text' },
];

const collectRecordColumns = [
  { title: '时间', dataIndex: 'created_at', width: 150 },
  { title: '设备', dataIndex: 'device_ip', width: 120 },
  { title: '状态', dataIndex: 'status', width: 82 },
  { title: '命中规则', dataIndex: 'rule_key', width: 150 },
  { title: '质量', dataIndex: 'issue_count', width: 76 },
  { title: '型号 / 固件', dataIndex: 'profile' },
];

const auditColumns = [
  { title: '时间', dataIndex: 'created_at', width: 150 },
  { title: '动作', dataIndex: 'action_label', width: 120 },
  { title: '操作人', dataIndex: 'operator_name', width: 120 },
  { title: '详情', dataIndex: 'detail' },
];

const qualityIssueColumns = [
  { title: '问题', dataIndex: 'label' },
  { title: '次数', dataIndex: 'count', width: 86 },
];

const qualityComponentColumns = [
  { title: '部件', dataIndex: 'label', width: 120 },
  { title: '采集数量', dataIndex: 'count', width: 100 },
  { title: '平均数量', dataIndex: 'average_count', width: 100 },
  { title: '唯一标识覆盖', dataIndex: 'identity_coverage_rate', width: 130 },
  { title: '缺失标识', dataIndex: 'missing_identity', width: 100 },
];

const qualityProblemColumns = [
  { title: '时间', dataIndex: 'created_at', width: 150 },
  { title: '设备', dataIndex: 'device_ip', width: 120 },
  { title: '状态', dataIndex: 'status', width: 82 },
  { title: '问题', dataIndex: 'issue_count', width: 76 },
  { title: '规则', dataIndex: 'rule_key', width: 150 },
  { title: '说明', dataIndex: 'message' },
];

const coverageColumns = [
  { title: '管理口', dataIndex: 'ip_address', width: 124 },
  { title: '品牌', dataIndex: 'brand_name', width: 110 },
  { title: '型号', dataIndex: 'model', width: 180 },
  { title: '固件', dataIndex: 'firmware_version', width: 120 },
  { title: '覆盖状态', dataIndex: 'status', width: 120 },
  { title: '命中规则', dataIndex: 'matched_rule', width: 150 },
  { title: '说明', dataIndex: 'reason' },
];

const ruleColumns = [
  { title: '匹配条件', dataIndex: 'match_condition', width: 300 },
  { title: '支持结果', dataIndex: 'support_result', width: 170 },
  { title: '采集能力', dataIndex: 'capability_labels', width: 220 },
  { title: '规则说明', dataIndex: 'description' },
];

const gridOptions: VxeGridProps<HardwareAdapterItem> = {
  columns: [
    { title: '序号', type: 'seq', width: 56, fixed: 'left' },
    {
      field: 'vendor_name',
      fixed: 'left',
      slots: { default: 'vendor_name' },
      title: '适配器',
      width: 220,
    },
    {
      field: 'brand_names',
      slots: { default: 'brand_names' },
      title: '适配对象',
      width: 280,
    },
    {
      field: 'enabled',
      slots: { default: 'enabled' },
      title: '治理状态',
      width: 120,
    },
    {
      field: 'health',
      slots: { default: 'health' },
      title: '健康状态',
      width: 150,
    },
    {
      field: 'support_label',
      slots: { default: 'support_label' },
      title: '支持范围',
      width: 120,
    },
    {
      field: 'rule_count',
      slots: { default: 'rule_count' },
      title: '规则覆盖',
      width: 130,
    },
    {
      field: 'capability_labels',
      slots: { default: 'capability_labels' },
      title: '核心能力',
      minWidth: 420,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }) => cellValue || '-',
      title: '更新时间',
      width: 170,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 230,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    pageSize: 20,
    pageSizes: [20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async () => {
        const response = await getHardwareAdaptersApi();
        const items = response?.items || [];
        adapters.value = items;

        const queryText = keyword.value.trim().toLowerCase();
        const filtered = items.filter((item) => {
          if (filterMode.value === 'enabled' && !item.enabled) return false;
          if (filterMode.value === 'disabled' && item.enabled) return false;
          if (!queryText) return true;
          const text = [
            item.adapter_key,
            item.vendor_name,
            item.bmc_name,
            ...(item.brand_names || []),
            ...(item.capability_labels || []),
          ]
            .join(' ')
            .toLowerCase();
          return text.includes(queryText);
        });
        filteredTotal.value = filtered.length;

        const [firstAdapter] = filtered;
        if (!selectedAdapter.value && firstAdapter) {
          setSelectedAdapter(firstAdapter);
        } else if (selectedAdapter.value) {
          const refreshed = items.find(
            (item) => item.adapter_key === selectedAdapter.value?.adapter_key,
          );
          if (refreshed) {
            selectedAdapter.value = refreshed;
          }
        }

        return { items: filtered, total: filtered.length };
      },
    },
    response: {
      list: 'items',
      result: 'items',
      total: 'total',
    },
  },
  rowConfig: {
    isHover: true,
  },
  stripe: true,
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});

function supportColor(level?: string) {
  return level === 'full' ? 'green' : 'orange';
}

function listText(items?: string[], fallback = '通用') {
  return items && items.length > 0 ? items.join(' / ') : fallback;
}

function collectCountLabel(key: string) {
  const labels: Record<string, string> = {
    cpu: 'CPU',
    fan: '风扇',
    memory: '内存',
    network: '网卡',
    power: '电源',
    raid: 'RAID 控制器',
    storage: '硬盘',
  };
  return labels[key] || key;
}

function qualityIssueText(key: string) {
  const labels: Record<string, string> = {
    cpu_missing_identity: 'CPU 缺少唯一标识，可能影响硬件变更追踪',
    no_drive_backplane_collected: '未采集到硬盘背板信息',
    no_fan_collected: '未采集到风扇信息',
    no_network_boards_path_hit: '未命中网卡板卡采集路径',
    no_riser_collected: '未采集到 Riser/PCIe 转接板信息',
  };
  return labels[key] || key.replaceAll('_', ' ');
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    capacity_bytes: '容量',
    capacity_gb: '容量(GB)',
    capacity_mb: '容量(MB)',
    firmware_version: '固件版本',
    id: 'ID',
    location: '位置',
    mac_address: 'MAC',
    manufacturer: '厂商',
    media_type: '介质',
    model: '型号',
    name: '名称',
    part_number: '部件号',
    serial_number: '序列号',
    speed_mhz: '频率(MHz)',
    status: '状态',
    type: '类型',
  };
  return labels[key] || key;
}

function previewEntries(item: Record<string, any>) {
  return Object.entries(item)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .slice(0, 12)
    .map(([key, value]) => ({
      key,
      label: fieldLabel(key),
      value:
        Array.isArray(value) || typeof value === 'object'
          ? JSON.stringify(value)
          : String(value),
    }));
}

function normalizeText(value?: null | string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, '');
}

function textMatches(source?: null | string, target?: null | string) {
  const sourceText = normalizeText(source);
  const targetText = normalizeText(target);
  return (
    !!sourceText &&
    !!targetText &&
    (sourceText.includes(targetText) || targetText.includes(sourceText))
  );
}

function matchesAdapterBrand(
  adapter: HardwareAdapterItem,
  server: (typeof serverOptions.value)[number],
) {
  if (adapter.adapter_key === 'redfish' || adapter.brand_names.length === 0) {
    return true;
  }
  return adapter.brand_names.some((brand) =>
    textMatches(server.brandName, brand),
  );
}

function findMatchedRule(
  adapter: HardwareAdapterItem,
  server: (typeof serverOptions.value)[number],
) {
  if (!matchesAdapterBrand(adapter, server)) {
    return undefined;
  }
  if (!adapter.rules?.length) {
    return undefined;
  }
  return adapter.rules.find((rule) => {
    const modelMatched =
      rule.model_aliases.length === 0 ||
      rule.model_aliases.some((alias) => textMatches(server.modelName, alias));
    const firmwareMatched =
      rule.firmware_prefixes.length === 0 ||
      rule.firmware_prefixes.some((prefix) =>
        normalizeText(server.firmwareVersion).startsWith(normalizeText(prefix)),
      );
    return modelMatched && firmwareMatched;
  });
}

function rulePagination(rules?: HardwareAdapterItem['rules']) {
  const total = rules?.length || 0;
  return total > 8 ? { pageSize: 8, size: 'small' as const } : false;
}

function fullRuleCount(record: HardwareAdapterItem) {
  return (record.rules || []).filter((rule) => rule.support_level === 'full')
    .length;
}

function coverageRate(record: HardwareAdapterItem) {
  if (!record.rule_count) {
    return 0;
  }
  return Math.round((fullRuleCount(record) / record.rule_count) * 100);
}

function coverageClass(record: HardwareAdapterItem) {
  const rate = coverageRate(record);
  if (record.rule_count === 0) {
    return 'is-empty';
  }
  if (rate >= 90) {
    return 'is-good';
  }
  if (rate >= 60) {
    return 'is-warn';
  }
  return 'is-risk';
}

function adapterStatus(record: HardwareAdapterItem) {
  if (record.locked) {
    return { label: '兜底启用', status: 'processing' as const };
  }
  return record.enabled
    ? { label: '已启用', status: 'success' as const }
    : { label: '已禁用', status: 'default' as const };
}

function statusColor(status?: string) {
  return status === 'success' ? 'green' : 'red';
}

function levelColor(level?: string) {
  const colors: Record<string, string> = {
    default: 'default',
    error: 'red',
    processing: 'blue',
    success: 'green',
    warning: 'orange',
  };
  return colors[level || 'default'] || 'default';
}

function alertTypeFromLevel(level?: string) {
  if (level === 'error') {
    return 'error' as const;
  }
  if (level === 'warning') {
    return 'warning' as const;
  }
  if (level === 'success') {
    return 'success' as const;
  }
  return 'info' as const;
}

function setSelectedAdapter(row: HardwareAdapterItem) {
  if (selectedAdapter.value?.adapter_key !== row.adapter_key) {
    collectResult.value = undefined;
    collectRecords.value = [];
    auditLogs.value = [];
    coverageResult.value = undefined;
    qualityResult.value = undefined;
    deviceIp.value = '';
  }
  selectedAdapter.value = row;
  loadAdapterCandidates(row.adapter_key);
}

function openDetail(row: HardwareAdapterItem) {
  setSelectedAdapter(row);
  detailTab.value = 'overview';
  detailDrawerOpen.value = true;
}

function openCollect(row: HardwareAdapterItem) {
  setSelectedAdapter(row);
  detailTab.value = 'collect';
  detailDrawerOpen.value = true;
  loadCollectRecords(row.adapter_key);
}

function handleDetailTabChange(activeKey: string) {
  switch (activeKey) {
    case 'audit': {
      loadAuditLogs();
      break;
    }
    case 'collect': {
      loadCollectRecords();
      break;
    }
    case 'coverage': {
      loadCoverage();
      break;
    }
    case 'quality': {
      loadQuality();
      break;
    }
  }
}

async function loadCoverage(adapterKey?: string) {
  const targetKey = adapterKey || selectedAdapter.value?.adapter_key;
  if (!targetKey) {
    coverageResult.value = undefined;
    return;
  }
  coverageLoading.value = true;
  try {
    coverageResult.value = await getHardwareAdapterCoverageApi(targetKey);
  } catch (error) {
    console.error('Load adapter coverage error:', error);
    coverageResult.value = undefined;
    message.error('加载设备覆盖分析失败');
  } finally {
    coverageLoading.value = false;
  }
}

async function loadCollectRecords(adapterKey?: string) {
  const targetKey = adapterKey || selectedAdapter.value?.adapter_key;
  if (!targetKey) {
    collectRecords.value = [];
    return;
  }
  collectRecordLoading.value = true;
  try {
    const response = await getHardwareAdapterCollectRecordsApi(targetKey, {
      limit: 8,
    });
    collectRecords.value = response?.items || [];
  } catch (error) {
    console.error('Load adapter collect records error:', error);
    collectRecords.value = [];
  } finally {
    collectRecordLoading.value = false;
  }
}

async function loadAuditLogs(adapterKey?: string) {
  const targetKey = adapterKey || selectedAdapter.value?.adapter_key;
  if (!targetKey) {
    auditLogs.value = [];
    return;
  }
  auditLoading.value = true;
  try {
    const response = await getHardwareAdapterAuditLogsApi(targetKey, {
      limit: 20,
    });
    auditLogs.value = response?.items || [];
  } catch (error) {
    console.error('Load adapter audit logs error:', error);
    auditLogs.value = [];
  } finally {
    auditLoading.value = false;
  }
}

async function loadQuality(adapterKey?: string) {
  const targetKey = adapterKey || selectedAdapter.value?.adapter_key;
  if (!targetKey) {
    qualityResult.value = undefined;
    return;
  }
  qualityLoading.value = true;
  try {
    qualityResult.value = await getHardwareAdapterQualityApi(targetKey);
  } catch (error) {
    console.error('Load adapter quality error:', error);
    qualityResult.value = undefined;
    message.error('加载生产质量分析失败');
  } finally {
    qualityLoading.value = false;
  }
}

async function loadAdapterCandidates(adapterKey?: string) {
  const targetKey = adapterKey || selectedAdapter.value?.adapter_key;
  if (!targetKey) {
    serverOptions.value = [];
    return;
  }
  candidateLoading.value = true;
  try {
    const response = await getHardwareAdapterCandidatesApi(targetKey, {
      limit: 1000,
    });
    serverOptions.value = (response?.items || []).map((item: any) => ({
      brandName: item.brand_name || '',
      firmwareVersion: item.firmware_version || '',
      label: item.label || item.ip_address,
      matchedRule: item.matched_rule || '',
      modelName: item.model || '',
      status: item.status || '',
      value: item.ip_address,
    }));
    if (
      deviceIp.value &&
      !serverOptions.value.some((item) => item.value === deviceIp.value)
    ) {
      deviceIp.value = '';
    }
  } catch (error) {
    console.error('Load adapter candidates error:', error);
    serverOptions.value = [];
  } finally {
    candidateLoading.value = false;
  }
}

async function handleToggle(record: HardwareAdapterItem, checked: boolean) {
  if (!canToggleAdapter.value) {
    message.warning('无权限启停适配器');
    return;
  }
  if (record.locked) {
    message.warning('通用 Redfish 兜底适配器不能关闭');
    return;
  }
  try {
    await updateHardwareAdapterEnabledApi(record.adapter_key, {
      enabled: checked,
      note: checked ? '页面开启' : '页面关闭',
    });
    message.success(checked ? '适配器已开启' : '适配器已关闭');
    await gridApi.query();
    if (selectedAdapter.value?.adapter_key === record.adapter_key) {
      await loadAuditLogs(record.adapter_key);
    }
  } catch (error) {
    console.error('Toggle adapter error:', error);
    message.error('更新适配器状态失败');
  }
}

async function handleSyncAdapters() {
  if (!canCollectAdapter.value) {
    message.warning('无权限同步适配器注册表');
    return;
  }
  syncLoading.value = true;
  try {
    const response = await syncHardwareAdaptersApi();
    message.success(`适配器注册表已同步，共 ${response?.total || 0} 个`);
    await gridApi.query();
  } catch (error) {
    console.error('Sync adapters error:', error);
    message.error('同步适配器注册表失败');
  } finally {
    syncLoading.value = false;
  }
}

function renderImpactContent(
  record: HardwareAdapterItem,
  checked: boolean,
  impact?: any,
) {
  if (!impact) {
    return h(
      'div',
      { class: 'adapter-impact-modal' },
      `${record.vendor_name} ${checked ? '开启' : '关闭'}后会影响后续采集策略，请确认。`,
    );
  }
  const summary = impact.summary || {};
  const quality = impact.quality || {};
  const notes = impact.action_notes || [];
  return h('div', { class: 'adapter-impact-modal' }, [
    h('div', { class: 'impact-note-list' }, [
      ...notes.map((item: string) => h('p', { key: item }, item)),
      notes.length === 0
        ? h(
            'p',
            `${record.vendor_name} ${checked ? '开启' : '关闭'}后会影响后续采集策略。`,
          )
        : null,
    ]),
    h('div', { class: 'impact-metrics' }, [
      h('div', [h('span', '品牌设备'), h('strong', summary.in_scope ?? 0)]),
      h('div', [h('span', '专属命中'), h('strong', summary.dedicated ?? 0)]),
      h('div', [h('span', '回落通用'), h('strong', summary.fallback ?? 0)]),
      h('div', [
        h('span', '30天成功率'),
        h(
          'strong',
          quality.success_rate === null || quality.success_rate === undefined
            ? '-'
            : `${quality.success_rate}%`,
        ),
      ]),
    ]),
    h(
      'div',
      { class: 'impact-muted' },
      impact.recommendation?.description || '',
    ),
  ]);
}

async function confirmToggle(record: HardwareAdapterItem, checked: boolean) {
  if (!canToggleAdapter.value) {
    message.warning('无权限启停适配器');
    return;
  }
  if (record.locked) {
    message.warning('通用 Redfish 兜底适配器不能关闭');
    return;
  }
  let impact: any;
  try {
    impact = await getHardwareAdapterImpactApi(record.adapter_key);
  } catch (error) {
    console.error('Load adapter impact error:', error);
    message.warning('影响面加载失败，请谨慎确认');
  }
  Modal.confirm({
    title: checked ? '开启适配器' : '关闭适配器',
    content: renderImpactContent(record, checked, impact),
    okText: checked ? '开启' : '关闭',
    okType: checked ? 'primary' : 'danger',
    cancelText: '取消',
    async onOk() {
      await handleToggle(record, checked);
    },
  });
}

async function runCollectTest(adapter?: HardwareAdapterItem) {
  if (!canCollectAdapter.value) {
    message.warning('无权限执行验证采集');
    return;
  }
  const target = adapter || selectedAdapter.value;
  if (!target) {
    message.warning('请选择适配器');
    return;
  }
  if (!deviceIp.value) {
    message.warning('请选择命中当前适配规则的服务器');
    return;
  }
  const selected = selectedServer.value;
  const selectedFromCandidates = matchedServerOptions.value.some(
    (item) => item.value === deviceIp.value,
  );
  if (!selected || !selectedFromCandidates) {
    message.warning('请选择当前适配器品牌和规则命中的服务器');
    return;
  }
  if (
    target.rules?.length &&
    !selected.matchedRule &&
    !selectedPredictedRule.value
  ) {
    message.warning('当前服务器没有命中适配规则，不能作为规则验证目标');
    return;
  }
  setSelectedAdapter(target);
  detailTab.value = 'collect';
  detailDrawerOpen.value = true;
  collectResult.value = undefined;
  collectLoading.value = true;
  try {
    const response = await collectHardwareAdapterTestApi(target.adapter_key, {
      device_ip: deviceIp.value,
    });
    collectResult.value = response;
    if (response.status === 'success') {
      message.success('验证采集完成');
    } else {
      message.warning(response.message || '验证采集失败');
    }
    await loadCollectRecords(target.adapter_key);
    await loadCoverage(target.adapter_key);
    await loadQuality(target.adapter_key);
    await loadAuditLogs(target.adapter_key);
  } catch (error) {
    console.error('Collect adapter test error:', error);
    message.error('验证采集失败');
  } finally {
    collectLoading.value = false;
  }
}

function formatTime(value?: null | string) {
  if (!value) {
    return '-';
  }
  return String(value).replace('T', ' ').slice(0, 19);
}

function qualityText(result?: HardwareAdapterCollectResult) {
  if (!result?.summary) {
    return '-';
  }
  const flags = result.summary.quality_flags || [];
  const missing = result.summary.missing_fields || [];
  if (flags.length === 0 && missing.length === 0) {
    return '质量检查通过';
  }
  return `存在 ${flags.length + missing.length} 项质量问题`;
}

function auditDetailText(detail?: Record<string, any>) {
  if (!detail || Object.keys(detail).length === 0) {
    return '-';
  }
  const labels: Record<string, string> = {
    device_ip: '设备',
    enabled: '状态',
    force: '强制',
    generated_at: '同步时间',
    message: '说明',
    note: '备注',
    rule_count: '规则',
    status: '结果',
    total: '总数',
  };
  return Object.entries(detail)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .slice(0, 6)
    .map(([key, value]) => {
      let text = String(value);
      if (typeof value === 'boolean') {
        text = value ? '是' : '否';
      } else if (Array.isArray(value) || typeof value === 'object') {
        text = JSON.stringify(value);
      }
      return `${labels[key] || key}：${text}`;
    })
    .join('；');
}

function handleFilterChange() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <div class="adapter-overview">
      <div class="overview-copy">
        <strong>服务器适配器治理</strong>
        <span>{{ overviewDescription }}</span>
      </div>
      <div class="overview-metrics">
        <div
          v-for="metric in overviewMetrics"
          :key="metric.label"
          class="overview-metric"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </div>
        <div class="overview-metric is-rate">
          <span>启用率</span>
          <strong>{{ adapterStats.enabledRate }}%</strong>
        </div>
      </div>
    </div>

    <Grid table-title="适配器清单">
      <template #toolbar-actions>
        <span class="table-summary">当前 {{ filteredTotal }} 条</span>
      </template>

      <template #toolbar-tools>
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="adapter-search mr-2"
          placeholder="适配器 / 品牌 / BMC / 能力"
          @change="() => !keyword && gridApi.query()"
          @search="gridApi.query()"
          @press-enter="gridApi.query()"
        />
        <Segmented
          v-model:value="filterMode"
          :options="filterOptions"
          class="mr-2"
          @change="handleFilterChange"
        />
        <Button
          v-if="canCollectAdapter"
          :loading="syncLoading"
          size="small"
          type="primary"
          @click="handleSyncAdapters"
        >
          同步注册表
        </Button>
      </template>

      <template #vendor_name="{ row }">
        <div class="adapter-name">
          <span>{{ row.vendor_name }}</span>
          <small>{{ row.adapter_key }}</small>
        </div>
      </template>

      <template #brand_names="{ row }">
        <div class="adapter-target">
          <span>{{ row.brand_names.join(' / ') }}</span>
          <small>{{ row.bmc_name || '-' }}</small>
        </div>
      </template>

      <template #support_label="{ row }">
        <Tag :color="supportColor(row.support_level)">
          {{ row.support_label }}
        </Tag>
      </template>

      <template #enabled="{ row }">
        <Badge
          :status="adapterStatus(row).status"
          :text="adapterStatus(row).label"
        />
      </template>

      <template #health="{ row }">
        <Tag :color="levelColor(row.health?.level)">
          {{ row.health?.label || '未验证' }}
        </Tag>
        <span
          v-if="
            row.health?.success_rate !== null &&
            row.health?.success_rate !== undefined
          "
          class="muted-text"
        >
          {{ row.health?.success_rate }}%
        </span>
      </template>

      <template #rule_count="{ row }">
        <div class="coverage-cell" :class="coverageClass(row)">
          <div>
            <strong>{{ fullRuleCount(row) }}/{{ row.rule_count }}</strong>
            <span>{{ coverageRate(row) }}%</span>
          </div>
          <i>
            <em :style="{ width: `${coverageRate(row)}%` }"></em>
          </i>
        </div>
      </template>

      <template #capability_labels="{ row }">
        <div class="capability-summary">
          <span
            v-for="capability in row.capability_labels.slice(0, 3)"
            :key="capability"
          >
            {{ capability }}
          </span>
          <Tag v-if="row.capability_labels.length > 3" color="default">
            +{{ row.capability_labels.length - 3 }}
          </Tag>
          <span v-if="row.capability_labels.length === 0">-</span>
        </div>
      </template>

      <template #action="{ row }">
        <div class="action-cell">
          <Switch
            :checked="row.enabled"
            :disabled="row.locked || !canToggleAdapter"
            size="small"
            @change="(checked) => confirmToggle(row, Boolean(checked))"
          />
          <Button size="small" @click="openDetail(row)">详情</Button>
          <Button
            v-if="canCollectAdapter"
            ghost
            size="small"
            type="primary"
            @click="openCollect(row)"
          >
            验证
          </Button>
        </div>
      </template>
    </Grid>

    <Drawer
      v-model:open="detailDrawerOpen"
      :body-style="{
        background: 'hsl(var(--muted) / 18%)',
        padding: '12px 16px',
      }"
      destroy-on-close
      placement="right"
      root-class-name="adapter-detail-drawer"
      width="760"
    >
      <template #title>
        <div class="drawer-title">
          <span>{{ selectedAdapter?.vendor_name || '适配器详情' }}</span>
          <small>{{ selectedAdapter?.adapter_key || '-' }}</small>
        </div>
      </template>

      <template v-if="selectedAdapter" #extra>
        <Space size="small">
          <Badge
            :status="adapterStatus(selectedAdapter).status"
            :text="adapterStatus(selectedAdapter).label"
          />
          <Switch
            :checked="selectedAdapter.enabled"
            :disabled="selectedAdapter.locked || !canToggleAdapter"
            size="small"
            @change="
              (checked) => confirmToggle(selectedAdapter!, Boolean(checked))
            "
          />
          <Button
            v-if="canCollectAdapter"
            size="small"
            type="primary"
            @click="
              detailTab = 'collect';
              loadCollectRecords();
            "
          >
            验证
          </Button>
        </Space>
      </template>

      <template v-if="selectedAdapter">
        <Tabs
          v-model:active-key="detailTab"
          size="small"
          @change="(key) => handleDetailTabChange(String(key))"
        >
          <Tabs.TabPane key="overview" tab="基本信息">
            <div class="basic-page">
              <div class="basic-section">
                <div class="section-title">基础属性</div>
                <Descriptions bordered size="small" :column="2">
                  <Descriptions.Item label="适配品牌">
                    {{ selectedAdapter.brand_names.join(' / ') || '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="BMC 类型">
                    {{ selectedAdapter.bmc_name || '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="治理状态">
                    <Badge
                      :status="adapterStatus(selectedAdapter).status"
                      :text="adapterStatus(selectedAdapter).label"
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="支持范围">
                    <Tag :color="supportColor(selectedAdapter.support_level)">
                      {{ selectedAdapter.support_label }}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {{ selectedAdapter.updated_at || '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="规则数量">
                    {{ selectedAdapter.rule_count }}
                  </Descriptions.Item>
                  <Descriptions.Item label="同步时间">
                    {{ formatTime(selectedAdapter.generated_at) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="规则版本">
                    {{ selectedAdapter.generated_at ? '代码注册表同步' : '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="实现类" :span="2">
                    {{ selectedAdapter.class_path }}
                  </Descriptions.Item>
                  <Descriptions.Item label="说明" :span="2">
                    {{ selectedAdapter.support_summary || '-' }}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div class="basic-section">
                <div class="section-title">健康建议</div>
                <Alert
                  show-icon
                  :description="
                    selectedAdapter.health?.description || '暂无采集质量记录'
                  "
                  :message="selectedAdapter.health?.label || '未验证'"
                  :type="
                    selectedAdapter.health?.level === 'error'
                      ? 'error'
                      : selectedAdapter.health?.level === 'warning'
                        ? 'warning'
                        : selectedAdapter.health?.level === 'success'
                          ? 'success'
                          : 'info'
                  "
                />
                <Descriptions
                  bordered
                  class="basic-sub-desc"
                  size="small"
                  :column="2"
                >
                  <Descriptions.Item label="最近采集">
                    {{ formatTime(selectedAdapter.health?.last_checked_at) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="30天成功率">
                    {{
                      selectedAdapter.health?.success_rate === null ||
                      selectedAdapter.health?.success_rate === undefined
                        ? '-'
                        : `${selectedAdapter.health.success_rate}%`
                    }}
                  </Descriptions.Item>
                  <Descriptions.Item label="最近问题">
                    {{ selectedAdapter.health?.last_issue_count ?? '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="最近原因">
                    {{ selectedAdapter.health?.last_message || '-' }}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div class="basic-section">
                <div class="section-title">匹配判断</div>
                <div class="summary-list">
                  <div>
                    <span>全支持规则</span>
                    <strong>
                      {{ fullRuleCount(selectedAdapter) }}/{{
                        selectedAdapter.rule_count
                      }}
                    </strong>
                  </div>
                  <div>
                    <span>覆盖率</span>
                    <strong>{{ coverageRate(selectedAdapter) }}%</strong>
                  </div>
                  <div>
                    <span>候选设备</span>
                    <strong>{{ matchedServerOptions.length }}</strong>
                  </div>
                </div>
                <Descriptions
                  bordered
                  class="basic-sub-desc"
                  size="small"
                  :column="2"
                >
                  <Descriptions.Item label="品牌口径">
                    {{ selectedAdapter.brand_names.join(' / ') || '通用' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="固件口径">
                    型号规则优先，固件前缀为空时按通用固件处理
                  </Descriptions.Item>
                  <Descriptions.Item label="兜底策略">
                    {{
                      selectedAdapter.locked
                        ? '系统兜底适配器，不允许关闭'
                        : '未命中专属规则时回落通用 Redfish'
                    }}
                  </Descriptions.Item>
                  <Descriptions.Item label="验证方式">
                    仅允许选择命中当前品牌和规则的已纳管服务器
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div class="basic-section">
                <div class="section-title">采集能力</div>
                <div class="capability-panel">
                  <Space wrap :size="[4, 4]">
                    <Tag v-for="item in selectedCapabilities" :key="item">
                      {{ item }}
                    </Tag>
                    <span
                      v-if="selectedCapabilities.length === 0"
                      class="muted-text"
                    >
                      暂无专属能力
                    </span>
                  </Space>
                  <div class="muted-text capability-note">
                    验证采集会返回命中的规则、采集对象数量、关键字段缺失和质量标记，用于判断该适配器是否可以继续启用。
                  </div>
                </div>
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="coverage" tab="设备覆盖">
            <template v-if="coverageResult">
              <Alert
                show-icon
                :description="coverageResult.recommendation.description"
                :message="coverageResult.recommendation.label"
                :type="
                  coverageResult.recommendation.level === 'warning'
                    ? 'warning'
                    : coverageResult.recommendation.level === 'success'
                      ? 'success'
                      : 'info'
                "
              />
              <div class="collect-summary-grid">
                <div>
                  <span>品牌设备</span>
                  <strong>{{ coverageResult.summary.in_scope }}</strong>
                </div>
                <div>
                  <span>专属命中</span>
                  <strong>{{ coverageResult.summary.dedicated }}</strong>
                </div>
                <div>
                  <span>回落通用</span>
                  <strong>{{ coverageResult.summary.fallback }}</strong>
                </div>
                <div>
                  <span>覆盖率</span>
                  <strong>{{ coverageResult.summary.coverage_rate }}%</strong>
                </div>
              </div>
            </template>
            <Table
              class="drawer-table"
              :columns="coverageColumns"
              :data-source="coverageResult?.items || []"
              :loading="coverageLoading"
              row-key="server_id"
              :pagination="{ pageSize: 8, size: 'small' }"
              size="small"
              :scroll="{ x: 980 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'status'">
                  <Tag
                    :color="record.status === 'dedicated' ? 'green' : 'orange'"
                  >
                    {{ record.status_label }}
                  </Tag>
                </template>
                <template v-else-if="column.dataIndex === 'matched_rule'">
                  {{ record.matched_rule || '-' }}
                </template>
                <template v-else-if="column.dataIndex === 'firmware_version'">
                  {{ record.firmware_version || '-' }}
                </template>
              </template>
            </Table>
          </Tabs.TabPane>

          <Tabs.TabPane key="quality" tab="生产质量">
            <template v-if="qualityResult">
              <Alert
                show-icon
                :description="qualityResult.recommendation.description"
                :message="qualityResult.recommendation.label"
                :type="alertTypeFromLevel(qualityResult.recommendation.level)"
              />
              <div class="collect-summary-grid">
                <div v-for="item in qualitySummaryItems" :key="item.label">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>

              <Descriptions bordered size="small" :column="2">
                <Descriptions.Item label="统计周期">
                  近 {{ qualityResult.period_days }} 天
                </Descriptions.Item>
                <Descriptions.Item label="最近采集">
                  {{ formatTime(qualityResult.summary.last_checked_at) }}
                </Descriptions.Item>
                <Descriptions.Item label="规则命中" :span="2">
                  <Space v-if="qualityResult.rule_hits.length > 0" wrap>
                    <Tag
                      v-for="item in qualityResult.rule_hits"
                      :key="item.rule_key"
                      color="blue"
                    >
                      {{ item.rule_key }} / {{ item.count }}
                    </Tag>
                  </Space>
                  <span v-else>-</span>
                </Descriptions.Item>
              </Descriptions>

              <div class="quality-grid">
                <div class="quality-panel">
                  <div class="section-title">高频问题</div>
                  <Table
                    :columns="qualityIssueColumns"
                    :data-source="qualityResult.top_issues"
                    row-key="key"
                    :pagination="false"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.dataIndex === 'count'">
                        <Tag color="orange">{{ record.count }}</Tag>
                      </template>
                    </template>
                  </Table>
                </div>
                <div class="quality-panel">
                  <div class="section-title">缺失字段</div>
                  <Table
                    :columns="qualityIssueColumns"
                    :data-source="qualityResult.top_missing_fields"
                    row-key="key"
                    :pagination="false"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.dataIndex === 'count'">
                        <Tag color="orange">{{ record.count }}</Tag>
                      </template>
                    </template>
                  </Table>
                </div>
              </div>

              <div class="drawer-section">
                <div class="section-title">部件覆盖质量</div>
                <Table
                  :columns="qualityComponentColumns"
                  :data-source="qualityResult.component_health"
                  row-key="component"
                  :pagination="false"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template
                      v-if="column.dataIndex === 'identity_coverage_rate'"
                    >
                      <Tag
                        :color="
                          record.identity_coverage_rate === null ||
                          record.identity_coverage_rate === undefined
                            ? 'default'
                            : record.identity_coverage_rate >= 90
                              ? 'green'
                              : record.identity_coverage_rate >= 60
                                ? 'orange'
                                : 'red'
                        "
                      >
                        {{
                          record.identity_coverage_rate === null ||
                          record.identity_coverage_rate === undefined
                            ? '-'
                            : `${record.identity_coverage_rate}%`
                        }}
                      </Tag>
                    </template>
                    <template v-else-if="column.dataIndex === 'average_count'">
                      {{ record.average_count ?? '-' }}
                    </template>
                    <template
                      v-else-if="column.dataIndex === 'missing_identity'"
                    >
                      <Tag
                        :color="
                          record.missing_identity > 0 ? 'orange' : 'green'
                        "
                      >
                        {{ record.missing_identity }}
                      </Tag>
                    </template>
                  </template>
                </Table>
              </div>

              <div class="drawer-section">
                <div class="section-title">最近异常记录</div>
                <Table
                  :columns="qualityProblemColumns"
                  :data-source="qualityResult.recent_problem_records"
                  row-key="id"
                  :pagination="false"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'created_at'">
                      {{ formatTime(record.created_at) }}
                    </template>
                    <template v-else-if="column.dataIndex === 'status'">
                      <Tag :color="statusColor(record.status)">
                        {{ record.status === 'success' ? '成功' : '失败' }}
                      </Tag>
                    </template>
                    <template v-else-if="column.dataIndex === 'issue_count'">
                      <Tag :color="record.issue_count > 0 ? 'orange' : 'green'">
                        {{ record.issue_count }}
                      </Tag>
                    </template>
                    <template v-else-if="column.dataIndex === 'rule_key'">
                      {{ record.rule_key || '-' }}
                    </template>
                    <template v-else-if="column.dataIndex === 'message'">
                      <span class="audit-detail-text">
                        {{ record.message || '-' }}
                      </span>
                    </template>
                  </template>
                </Table>
              </div>
            </template>
            <div v-else class="quality-empty">
              <Button
                :loading="qualityLoading"
                size="small"
                type="primary"
                @click="loadQuality()"
              >
                加载生产质量
              </Button>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="rules" tab="适配规则">
            <Descriptions bordered size="small" :column="2">
              <Descriptions.Item label="规则数量">
                {{ selectedAdapter.rules?.length || 0 }}
              </Descriptions.Item>
              <Descriptions.Item label="全支持规则">
                {{ fullRuleCount(selectedAdapter) }}
              </Descriptions.Item>
              <Descriptions.Item label="匹配口径" :span="2">
                品牌、型号别名、固件前缀、代际共同决定命中结果；固件为空表示该型号通用。
              </Descriptions.Item>
            </Descriptions>

            <Table
              v-if="selectedAdapter.rules?.length"
              class="drawer-table"
              :columns="ruleColumns"
              :data-source="selectedAdapter.rules"
              row-key="key"
              :pagination="rulePagination(selectedAdapter.rules)"
              size="small"
              :scroll="{ x: 880 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'match_condition'">
                  <div class="rule-match">
                    <strong>{{ record.key }}</strong>
                    <span>型号：{{ listText(record.model_aliases) }}</span>
                    <span>
                      固件：{{ listText(record.firmware_prefixes, '通用固件') }}
                    </span>
                    <span>代际：{{ record.generation || '通用' }}</span>
                  </div>
                </template>
                <template v-else-if="column.dataIndex === 'support_result'">
                  <Tag :color="supportColor(record.support_level)">
                    {{ record.support_label }}
                  </Tag>
                  <div class="muted-text">
                    {{
                      record.support_level === 'full' ? '深度采集' : '基础采集'
                    }}
                  </div>
                </template>
                <template v-else-if="column.dataIndex === 'capability_labels'">
                  <Space wrap :size="[4, 4]">
                    <Tag v-for="item in record.capability_labels" :key="item">
                      {{ item }}
                    </Tag>
                  </Space>
                </template>
                <template v-else-if="column.dataIndex === 'description'">
                  <div class="rule-desc">
                    <span>{{ record.description || '-' }}</span>
                    <small v-if="record.notes?.length">
                      {{ record.notes.join('；') }}
                    </small>
                  </div>
                </template>
              </template>
            </Table>
            <div v-else class="compact-empty">
              通用 Redfish 兜底，无专属规则
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="collect" tab="验证采集">
            <Descriptions bordered size="small" :column="2">
              <Descriptions.Item label="验证范围">
                {{ selectedAdapter.brand_names.join(' / ') || '通用 Redfish' }}
              </Descriptions.Item>
              <Descriptions.Item label="候选设备">
                {{ matchedServerOptions.length }}
              </Descriptions.Item>
              <Descriptions.Item label="预计命中规则" :span="2">
                <template v-if="selectedPredictedRule">
                  {{ selectedPredictedRule.key }}
                  <span class="muted-text">
                    （{{ selectedPredictedRule.description || '无说明' }}）
                  </span>
                </template>
                <template v-else-if="!selectedAdapter.rules?.length">
                  通用适配器，无专属规则；按品牌/通用 Redfish 执行验证采集
                </template>
                <template v-else>
                  {{
                    deviceIp
                      ? '当前设备未命中专属规则'
                      : '选择设备后显示预计命中规则'
                  }}
                </template>
              </Descriptions.Item>
              <Descriptions.Item v-if="selectedServer" label="设备型号">
                {{ selectedServer.modelName || '-' }}
              </Descriptions.Item>
              <Descriptions.Item v-if="selectedServer" label="固件版本">
                {{ selectedServer.firmwareVersion || '-' }}
              </Descriptions.Item>
            </Descriptions>

            <div class="collect-form">
              <Select
                v-model:value="deviceIp"
                allow-clear
                show-search
                :filter-option="true"
                :loading="candidateLoading"
                :options="matchedServerOptions"
                placeholder="选择命中当前适配规则的服务器"
              />
              <Button
                v-if="canCollectAdapter"
                :loading="collectLoading"
                :disabled="
                  candidateLoading || matchedServerOptions.length === 0
                "
                type="primary"
                @click="runCollectTest(selectedAdapter)"
              >
                验证采集
              </Button>
            </div>

            <div v-if="collectResult" class="collect-result-inline">
              <Alert
                show-icon
                :description="collectHealth.description"
                :message="collectHealth.label"
                :type="collectHealth.type"
              />

              <div class="collect-summary-grid">
                <div v-for="item in collectSummaryItems" :key="item.label">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>

              <Descriptions bordered size="small" :column="2">
                <Descriptions.Item label="验证设备">
                  {{ collectResult.device_ip }}
                </Descriptions.Item>
                <Descriptions.Item label="执行状态">
                  <Tag :color="statusColor(collectResult.status)">
                    {{ collectResult.status === 'success' ? '成功' : '失败' }}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="质量检查">
                  {{ qualityText(collectResult) }}
                </Descriptions.Item>
                <Descriptions.Item label="结果说明">
                  {{ collectResult.message || '-' }}
                </Descriptions.Item>
              </Descriptions>

              <Table
                v-if="collectCountRows.length > 0"
                class="drawer-table"
                :columns="collectCountColumns"
                :data-source="collectCountRows"
                :expand-row-by-click="true"
                row-key="rowKey"
                :pagination="false"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'status'">
                    <Tag :color="record.value > 0 ? 'green' : 'orange'">
                      {{ record.status }}
                    </Tag>
                  </template>
                  <template v-else-if="column.dataIndex === 'data_state'">
                    <Tag :color="record.items.length > 0 ? 'blue' : 'default'">
                      {{
                        record.items.length > 0
                          ? `${record.items.length} 条明细`
                          : '无返回明细'
                      }}
                    </Tag>
                  </template>
                </template>

                <template #expandedRowRender="{ record }">
                  <div v-if="record.items.length > 0" class="object-preview">
                    <div
                      v-for="(item, index) in record.items"
                      :key="`${record.key}-${index}`"
                      class="object-preview-item"
                    >
                      <div class="object-preview-title">
                        {{ record.label }} #{{ Number(index) + 1 }}
                      </div>
                      <div class="object-preview-fields">
                        <div
                          v-for="entry in previewEntries(item)"
                          :key="entry.key"
                        >
                          <span>{{ entry.label }}</span>
                          <strong>{{ entry.value }}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="muted-text">
                    当前对象没有返回可展示明细，请检查采集路径或适配规则。
                  </div>
                </template>
              </Table>

              <div
                v-if="collectResult.summary?.adapter_variant"
                class="drawer-section"
              >
                <Descriptions bordered size="small" :column="1">
                  <Descriptions.Item label="命中规则">
                    {{ collectResult.summary.adapter_variant.key || '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="规则说明">
                    {{
                      collectResult.summary.adapter_variant.description || '-'
                    }}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <Table
                v-if="collectIssueRows.length > 0"
                class="drawer-table"
                :columns="collectIssueColumns"
                :data-source="collectIssueRows"
                row-key="rowKey"
                :pagination="false"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'source'">
                    <Tag color="orange">{{ record.source }}</Tag>
                  </template>
                </template>
              </Table>
            </div>
            <div v-else class="collect-empty">
              选择或输入管理口 IP 后执行验证采集
            </div>

            <div class="drawer-section">
              <div class="section-title">最近采集质量记录</div>
              <Table
                :columns="collectRecordColumns"
                :data-source="collectRecords"
                :loading="collectRecordLoading"
                row-key="id"
                :pagination="false"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'created_at'">
                    {{ formatTime(record.created_at) }}
                  </template>
                  <template v-else-if="column.dataIndex === 'status'">
                    <Tag :color="statusColor(record.status)">
                      {{ record.status === 'success' ? '成功' : '失败' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.dataIndex === 'rule_key'">
                    {{ record.rule_key || '-' }}
                  </template>
                  <template v-else-if="column.dataIndex === 'issue_count'">
                    <Tag :color="record.issue_count > 0 ? 'orange' : 'green'">
                      {{ record.issue_count }}
                    </Tag>
                  </template>
                  <template v-else-if="column.dataIndex === 'profile'">
                    <div class="record-profile">
                      <span>{{ record.model || '-' }}</span>
                      <small>{{ record.firmware_version || '-' }}</small>
                    </div>
                  </template>
                </template>
              </Table>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="audit" tab="变更审计">
            <Alert
              show-icon
              description="记录注册表同步、适配器启停和验证采集等治理动作，用于追踪适配器策略变化。"
              message="治理动作可追溯"
              type="info"
            />
            <Table
              class="drawer-table"
              :columns="auditColumns"
              :data-source="auditLogs"
              :loading="auditLoading"
              row-key="id"
              :pagination="{ pageSize: 10, size: 'small' }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'created_at'">
                  {{ formatTime(record.created_at) }}
                </template>
                <template v-else-if="column.dataIndex === 'action_label'">
                  <Tag color="blue">{{ record.action_label }}</Tag>
                </template>
                <template v-else-if="column.dataIndex === 'operator_name'">
                  {{ record.operator_name || '-' }}
                </template>
                <template v-else-if="column.dataIndex === 'detail'">
                  <span class="audit-detail-text">
                    {{ auditDetailText(record.detail) }}
                  </span>
                </template>
              </template>
            </Table>
          </Tabs.TabPane>
        </Tabs>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.adapter-overview {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 12px;
  align-items: stretch;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.overview-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.overview-copy strong {
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: hsl(var(--foreground));
}

.overview-copy span {
  max-width: 760px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.overview-metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(64px, 1fr));
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.overview-metric {
  min-width: 0;
  padding: 7px 10px;
  border-right: 1px solid hsl(var(--border));
}

.overview-metric:last-child {
  border-right: 0;
}

.overview-metric span {
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: hsl(var(--muted-foreground));
}

.overview-metric strong {
  display: block;
  margin-top: 1px;
  font-size: 17px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 22px;
}

.overview-metric.is-rate {
  background: hsl(var(--primary) / 8%);
}

.table-summary {
  font-size: 12px;
  line-height: 24px;
  color: hsl(var(--muted-foreground));
}

.adapter-search {
  width: 300px;
}

.adapter-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 18px;
}

.adapter-name span {
  font-weight: 500;
}

.adapter-name small {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.adapter-target {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 18px;
}

.adapter-target small {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.capability-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  align-items: center;
  max-width: 100%;
}

.capability-summary span {
  max-width: 150px;
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
}

.action-cell {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

:global(.adapter-impact-modal) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

:global(.impact-note-list) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:global(.impact-note-list p) {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--foreground));
}

:global(.impact-metrics) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

:global(.impact-metrics > div) {
  min-width: 0;
  padding: 8px 10px;
  border-right: 1px solid hsl(var(--border));
}

:global(.impact-metrics > div:last-child) {
  border-right: 0;
}

:global(.impact-metrics span) {
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: hsl(var(--muted-foreground));
}

:global(.impact-metrics strong) {
  display: block;
  margin-top: 2px;
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
}

:global(.impact-muted) {
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}

.coverage-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coverage-cell > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  line-height: 16px;
}

.coverage-cell strong {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.coverage-cell span {
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
}

.coverage-cell i {
  display: block;
  height: 4px;
  overflow: hidden;
  background: hsl(var(--muted));
  border-radius: 999px;
}

.coverage-cell em {
  display: block;
  height: 100%;
  background: hsl(var(--primary));
  border-radius: inherit;
}

.coverage-cell.is-good em {
  background: #52c41a;
}

.coverage-cell.is-warn em {
  background: #faad14;
}

.coverage-cell.is-risk em {
  background: #ff4d4f;
}

.coverage-cell.is-empty em {
  background: hsl(var(--muted-foreground) / 40%);
}

:deep(.adapter-detail-drawer .ant-drawer-header) {
  padding: 12px 16px;
}

:deep(.adapter-detail-drawer .ant-drawer-title) {
  font-size: 14px;
}

.drawer-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.drawer-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
}

.drawer-title small,
.muted-text,
.section-title {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}

.drawer-section,
.drawer-table,
.collect-result-inline {
  margin-top: 10px;
}

.basic-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.basic-section {
  padding: 10px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.basic-sub-desc {
  margin-top: 10px;
}

.capability-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.capability-note {
  padding-top: 10px;
  border-top: 1px dashed hsl(var(--border));
}

.summary-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
}

.summary-list > div {
  min-width: 0;
  padding: 7px 8px;
  border-right: 1px solid hsl(var(--border));
}

.summary-list > div:last-child {
  border-right: 0;
}

.summary-list span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 16px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.summary-list strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 22px;
}

.rule-match,
.rule-desc,
.record-profile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.rule-match strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.rule-match span,
.record-profile small,
.rule-desc small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.record-profile span,
.rule-desc span {
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--foreground));
}

.audit-detail-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.section-title {
  margin-bottom: 6px;
}

.collect-form {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 6px;
  padding: 8px;
  margin-top: 10px;
  background: hsl(var(--muted) / 22%);
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.collect-result-inline {
  display: block;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.quality-panel {
  min-width: 0;
  padding: 10px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.collect-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 10px 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.collect-summary-grid > div {
  min-width: 0;
  padding: 8px 10px;
  border-right: 1px solid hsl(var(--border));
}

.collect-summary-grid > div:last-child {
  border-right: 0;
}

.collect-summary-grid span {
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: hsl(var(--muted-foreground));
}

.collect-summary-grid strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 22px;
  white-space: nowrap;
}

.object-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.object-preview-item {
  padding: 8px;
  background: hsl(var(--muted) / 18%);
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.object-preview-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.object-preview-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
}

.object-preview-fields > div {
  min-width: 0;
}

.object-preview-fields span {
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: hsl(var(--muted-foreground));
}

.object-preview-fields strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}

.collect-empty,
.quality-empty,
.compact-empty {
  padding: 10px 12px;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  text-align: center;
  background: hsl(var(--muted) / 18%);
  border: 1px dashed hsl(var(--border));
  border-radius: 6px;
}

@media (max-width: 768px) {
  .adapter-overview {
    grid-template-columns: 1fr;
  }

  .overview-copy span {
    white-space: normal;
  }

  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-metric:nth-child(2n) {
    border-right: 0;
  }

  .collect-form {
    grid-template-columns: 1fr;
  }

  .summary-list,
  .collect-summary-grid,
  .quality-grid,
  .object-preview-fields {
    grid-template-columns: 1fr;
  }

  .summary-list > div {
    border-right: 0;
    border-bottom: 1px solid hsl(var(--border));
  }

  .summary-list > div:last-child {
    border-bottom: 0;
  }

  .collect-summary-grid > div {
    border-right: 0;
    border-bottom: 1px solid hsl(var(--border));
  }

  .collect-summary-grid > div:last-child {
    border-bottom: 0;
  }
}
</style>
