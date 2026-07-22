<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

import type { InfraAsset } from '#/api/infra';
import type { ServerPageFetchParams } from '#/api/servers';
import type { TerminalAssetItem } from '#/api/terminal';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Drawer,
  Input,
  Popover,
  Progress,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { getInfraAssetsListApi } from '#/api/infra';
import { getServersListApi } from '#/api/servers';
import { getTerminalAssetListApi } from '#/api/terminal';

defineOptions({ name: 'MyAssetsPage' });

type AssetTabKey = 'all' | 'infra' | 'servers' | 'terminal';

type PagerState = {
  page: number;
  pageSize: number;
  total: number;
};

type FilterState = {
  business_address: string;
  ip_address: string;
  tag_number: string;
};

type ServerAssetRow = Record<string, any>;

type AssetViewMeta = {
  description: string;
  emptyText: string;
  loading: boolean;
  ownershipHint: string;
  pager: PagerState;
  rows: Array<InfraAsset | MergedAssetRow | ServerAssetRow | TerminalAssetItem>;
  scopeText: string;
  tableColumns: TableColumnType[];
  title: string;
};

type AssetDistributionItem = {
  colorClass: string;
  key: AssetTabKey;
  scopeText: string;
  title: string;
  total: number;
};

type StatusSummaryItem = {
  color: string;
  label: string;
  value: number;
};

type DetailField = {
  label: string;
  value: string;
};

type MergedAssetRow = {
  asset_person?: string;
  asset_type_key: Exclude<AssetTabKey, 'all'>;
  asset_type_label: string;
  brand_name?: string;
  business_address?: string;
  created_at?: string;
  display_name?: string;
  hostname?: string;
  id: string;
  ip_address?: string;
  model_name?: string;
  ownership?: string;
  rawRecord: Record<string, any>;
  serial_number?: string;
  status?: string;
  status_color?: string;
  tag_number?: string;
  user_name?: string;
};

const STORAGE_KEY = 'my-assets-page-state-v4';
const ALL_ASSET_FETCH_SIZE = 1000;
const defaultColumnKeyMap: Record<AssetTabKey, string[]> = {
  all: [
    'asset_type_label',
    'tag_number',
    'display_name',
    'ip_address',
    'brand_name',
    'model_name',
    'asset_person',
    'user_name',
    'ownership',
    'business_address',
    'status',
    'created_at',
  ],
  infra: [
    'tag_number',
    'ip_address',
    'brand_name',
    'model_name',
    'serial_number',
    'asset_person',
    'business_address',
    'created_at',
  ],
  servers: [
    'ip_address',
    'brand_name',
    'model_name',
    'serial_number',
    'tag_number',
    'business_address',
    'created_at',
    'status',
  ],
  terminal: [
    'tag_number',
    'hostname',
    'ip_address',
    'brand_name',
    'model_name',
    'asset_person',
    'user_name',
    'ownership',
    'business_address',
    'status',
  ],
};

const userStore = useUserStore();
const activeTab = ref<AssetTabKey>('all');

const infraRows = ref<InfraAsset[]>([]);
const serverRows = ref<ServerAssetRow[]>([]);
const terminalRows = ref<TerminalAssetItem[]>([]);
const mergedRows = ref<MergedAssetRow[]>([]);

const loadingMap = reactive<Record<AssetTabKey, boolean>>({
  all: false,
  infra: false,
  servers: false,
  terminal: false,
});

const pagerMap = reactive<Record<AssetTabKey, PagerState>>({
  all: { page: 1, pageSize: 10, total: 0 },
  infra: { page: 1, pageSize: 10, total: 0 },
  servers: { page: 1, pageSize: 10, total: 0 },
  terminal: { page: 1, pageSize: 10, total: 0 },
});

const sharedFilters = reactive<FilterState>({
  business_address: '',
  ip_address: '',
  tag_number: '',
});
const allFilters = sharedFilters;
const infraFilters = sharedFilters;
const serverFilters = sharedFilters;
const terminalFilters = sharedFilters;

const detailDrawerOpen = ref(false);
const detailState = ref<null | {
  record: Record<string, any>;
  tab: AssetTabKey;
}>(null);

const columnVisibilityMap = reactive<Record<AssetTabKey, string[]>>({
  all: [...defaultColumnKeyMap.all],
  infra: [...defaultColumnKeyMap.infra],
  servers: [...defaultColumnKeyMap.servers],
  terminal: [...defaultColumnKeyMap.terminal],
});

const currentUserId = computed(() =>
  String(userStore.userInfo?.userId || userStore.userInfo?.id || ''),
);

const currentUserName = computed(() =>
  String(
    userStore.userInfo?.realName ||
      userStore.userInfo?.username ||
      userStore.userInfo?.email ||
      '当前账号',
  ),
);

const totalAssets = computed(
  () => pagerMap.servers.total + pagerMap.infra.total + pagerMap.terminal.total,
);

const distributionItems = computed<AssetDistributionItem[]>(() => [
  {
    colorClass: 'bg-sky-500',
    key: 'servers',
    scopeText: '责任人归属',
    title: '服务器',
    total: pagerMap.servers.total,
  },
  {
    colorClass: 'bg-emerald-500',
    key: 'infra',
    scopeText: '责任人归属',
    title: '基础设施',
    total: pagerMap.infra.total,
  },
  {
    colorClass: 'bg-amber-500',
    key: 'terminal',
    scopeText: '责任人 / 使用人',
    title: '终端',
    total: pagerMap.terminal.total,
  },
]);

const tabItems = computed(() => [
  {
    key: 'all',
    label: `全部 ${pagerMap.all.total}`,
  },
  {
    key: 'servers',
    label: `服务器 ${pagerMap.servers.total}`,
  },
  {
    key: 'infra',
    label: `基础设施 ${pagerMap.infra.total}`,
  },
  {
    key: 'terminal',
    label: `终端 ${pagerMap.terminal.total}`,
  },
]);

const summaryCards = computed(() => [
  {
    description: '查看本人名下全部资产。',
    key: 'all' as const,
    scopeText: '全部资产',
    title: '全部资产',
    total: pagerMap.all.total,
  },
  {
    description: '查看归属与连接状态。',
    key: 'servers' as const,
    scopeText: '责任人归属',
    title: '服务器资产',
    total: pagerMap.servers.total,
  },
  {
    description: '核对资产号、位置与归属。',
    key: 'infra' as const,
    scopeText: '责任人归属',
    title: '基础设施',
    total: pagerMap.infra.total,
  },
  {
    description: '同时识别责任人与使用人。',
    key: 'terminal' as const,
    scopeText: '责任人 / 使用人',
    title: '终端资产',
    total: pagerMap.terminal.total,
  },
]);

const allInfraColumns: TableColumnType[] = [
  { dataIndex: 'tag_number', key: 'tag_number', title: '资产号', width: 150 },
  { dataIndex: 'ip_address', key: 'ip_address', title: 'IP地址', width: 150 },
  { dataIndex: 'brand_name', key: 'brand_name', title: '品牌', width: 120 },
  { dataIndex: 'model_name', key: 'model_name', title: '型号', width: 180 },
  {
    dataIndex: 'serial_number',
    key: 'serial_number',
    title: '序列号',
    width: 200,
  },
  {
    dataIndex: 'asset_person',
    key: 'asset_person',
    title: '责任人',
    width: 140,
  },
  {
    dataIndex: 'loc',
    key: 'business_address',
    title: '业务地址',
    width: 220,
  },
  { dataIndex: 'created_at', key: 'created_at', title: '添加时间', width: 180 },
];

const allServerColumns: TableColumnType[] = [
  { dataIndex: 'ip_address', key: 'ip_address', title: 'IP地址', width: 150 },
  { dataIndex: 'brand_name', key: 'brand_name', title: '品牌', width: 120 },
  { dataIndex: 'model_name', key: 'model_name', title: '型号', width: 150 },
  {
    dataIndex: 'serial_number',
    key: 'serial_number',
    title: '序列号',
    width: 220,
  },
  { dataIndex: 'tag_number', key: 'tag_number', title: '资产号', width: 120 },
  {
    dataIndex: 'asset_location',
    key: 'business_address',
    title: '业务地址',
    width: 220,
  },
  { dataIndex: 'created_at', key: 'created_at', title: '添加时间', width: 180 },
  { dataIndex: 'status', key: 'status', title: '连接状态', width: 120 },
];

const allTerminalColumns: TableColumnType[] = [
  { dataIndex: 'tag_number', key: 'tag_number', title: '资产号', width: 150 },
  { dataIndex: 'hostname', key: 'hostname', title: '主机名', width: 180 },
  { dataIndex: 'ip_address', key: 'ip_address', title: 'IP地址', width: 150 },
  { dataIndex: 'brand_name', key: 'brand_name', title: '品牌', width: 120 },
  { dataIndex: 'model_name', key: 'model_name', title: '型号', width: 180 },
  {
    dataIndex: 'asset_person',
    key: 'asset_person',
    title: '责任人',
    width: 140,
  },
  { dataIndex: 'user_name', key: 'user_name', title: '使用人', width: 140 },
  { dataIndex: 'ownership', key: 'ownership', title: '归属关系', width: 140 },
  {
    dataIndex: 'business_address',
    key: 'business_address',
    title: '业务地址',
    width: 220,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 120 },
];

const allMergedColumns: TableColumnType[] = [
  {
    dataIndex: 'asset_type_label',
    key: 'asset_type_label',
    title: '资产类型',
    width: 120,
  },
  { dataIndex: 'tag_number', key: 'tag_number', title: '资产号', width: 150 },
  {
    dataIndex: 'display_name',
    key: 'display_name',
    title: '设备名称',
    width: 180,
  },
  { dataIndex: 'ip_address', key: 'ip_address', title: 'IP地址', width: 150 },
  { dataIndex: 'brand_name', key: 'brand_name', title: '品牌', width: 120 },
  { dataIndex: 'model_name', key: 'model_name', title: '型号', width: 180 },
  {
    dataIndex: 'asset_person',
    key: 'asset_person',
    title: '责任人',
    width: 140,
  },
  { dataIndex: 'user_name', key: 'user_name', title: '使用人', width: 140 },
  { dataIndex: 'ownership', key: 'ownership', title: '归属关系', width: 140 },
  {
    dataIndex: 'business_address',
    key: 'business_address',
    title: '业务地址',
    width: 220,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 140 },
  { dataIndex: 'created_at', key: 'created_at', title: '添加时间', width: 180 },
];

function filterVisibleColumns(
  columns: TableColumnType[],
  visibleKeys: string[],
) {
  const visibleKeySet = new Set(visibleKeys);
  const filteredColumns = columns.filter((column) =>
    visibleKeySet.has(String(column.key || column.dataIndex || '')),
  );
  return filteredColumns.length > 0 ? filteredColumns : columns;
}

const visibleInfraColumns = computed(() =>
  filterVisibleColumns(allInfraColumns, columnVisibilityMap.infra),
);
const visibleMergedColumns = computed(() =>
  filterVisibleColumns(allMergedColumns, columnVisibilityMap.all),
);
const visibleServerColumns = computed(() =>
  filterVisibleColumns(allServerColumns, columnVisibilityMap.servers),
);
const visibleTerminalColumns = computed(() =>
  filterVisibleColumns(allTerminalColumns, columnVisibilityMap.terminal),
);
const pagedMergedRows = computed(() => {
  const page = pagerMap.all.page;
  const pageSize = pagerMap.all.pageSize;
  const start = (page - 1) * pageSize;
  return mergedRows.value.slice(start, start + pageSize);
});

const currentView = computed<AssetViewMeta>(() => {
  if (activeTab.value === 'all') {
    return {
      description: '查看本人名下全部资产，便于集中检索和核对。',
      emptyText: '当前账号下暂无资产',
      loading: loadingMap.all,
      ownershipHint: '',
      pager: pagerMap.all,
      rows: pagedMergedRows.value,
      scopeText: '全部资产',
      tableColumns: visibleMergedColumns.value,
      title: '全部资产明细',
    };
  }
  if (activeTab.value === 'infra') {
    return {
      description:
        '展示当前账号作为责任人的基础设施资产，便于核对位置、资产号和责任归属。',
      emptyText: '当前账号下暂无基础设施资产',
      loading: loadingMap.infra,
      ownershipHint: '基础设施按资产责任人归属',
      pager: pagerMap.infra,
      rows: infraRows.value,
      scopeText: '责任人归属',
      tableColumns: visibleInfraColumns.value,
      title: '基础设施资产明细',
    };
  }
  if (activeTab.value === 'terminal') {
    return {
      description:
        '展示当前账号作为责任人或使用人的终端资产，方便核对占用关系与终端状态。',
      emptyText: '当前账号下暂无终端资产',
      loading: loadingMap.terminal,
      ownershipHint: '终端同时识别责任人与使用人',
      pager: pagerMap.terminal,
      rows: terminalRows.value,
      scopeText: '责任人 / 使用人',
      tableColumns: visibleTerminalColumns.value,
      title: '终端资产明细',
    };
  }
  return {
    description:
      '展示当前账号作为资产责任人的服务器资产，重点关注位置、型号与连接状态。',
    emptyText: '当前账号下暂无服务器资产',
    loading: loadingMap.servers,
    ownershipHint: '服务器按资产责任人归属',
    pager: pagerMap.servers,
    rows: serverRows.value,
    scopeText: '责任人归属',
    tableColumns: visibleServerColumns.value,
    title: '服务器资产明细',
  };
});

const activeFilterState = computed(() => {
  return allFilters;
});

function getColumnsForTab(tab: AssetTabKey) {
  switch (tab) {
    case 'all': {
      return allMergedColumns;
    }
    case 'infra': {
      return allInfraColumns;
    }
    case 'terminal': {
      return allTerminalColumns;
    }
    default: {
      return allServerColumns;
    }
  }
}

const currentColumnOptions = computed(() => {
  const source = getColumnsForTab(activeTab.value);
  return source.map((column) => ({
    key: String(column.key || column.dataIndex || ''),
    title: String(column.title || column.key || column.dataIndex || ''),
  }));
});

const activeFilterEntries = computed(() => {
  const entries = [
    {
      label: 'IP',
      value: normalizeText(activeFilterState.value.ip_address),
    },
    {
      label: '业务地址',
      value: normalizeText(activeFilterState.value.business_address),
    },
    {
      label: '资产号',
      value: normalizeText(activeFilterState.value.tag_number),
    },
  ];
  return entries.filter((item) => item.value);
});

const activeFilterCount = computed(() => activeFilterEntries.value.length);

const currentPageCount = computed(() => currentView.value.rows.length);

const activeSummaryCard = computed(
  () => summaryCards.value.find((item) => item.key === activeTab.value) || null,
);
const detailSummaryCard = computed(
  () =>
    summaryCards.value.find((item) => item.key === detailState.value?.tab) ||
    null,
);

const activeViewShare = computed(() => {
  if (!totalAssets.value) {
    return 0;
  }
  return Math.round((currentView.value.pager.total / totalAssets.value) * 100);
});

const activeViewStats = computed(() => [
  {
    label: '当前页记录',
    value: String(currentPageCount.value),
  },
  {
    label: '筛选条件',
    value: activeFilterCount.value ? `${activeFilterCount.value} 项` : '未启用',
  },
  {
    label: '资产占比',
    value: `${activeViewShare.value}%`,
  },
  {
    label: '归属范围',
    value: currentView.value.scopeText,
  },
]);

const activeStatusSummaryItems = computed<StatusSummaryItem[]>(() => {
  if (activeTab.value === 'all') {
    return [
      {
        color: 'processing',
        label: '服务器',
        value: mergedRows.value.filter(
          (item) => item.asset_type_key === 'servers',
        ).length,
      },
      {
        color: 'blue',
        label: '基础设施',
        value: mergedRows.value.filter(
          (item) => item.asset_type_key === 'infra',
        ).length,
      },
      {
        color: 'gold',
        label: '终端',
        value: mergedRows.value.filter(
          (item) => item.asset_type_key === 'terminal',
        ).length,
      },
    ];
  }
  if (activeTab.value === 'servers') {
    const active = serverRows.value.filter(
      (item) => getServerStatusMeta(item).label === '在线 / 正常',
    ).length;
    const warning = serverRows.value.filter(
      (item) => getServerStatusMeta(item).label === '需关注',
    ).length;
    const exception = serverRows.value.filter(
      (item) => getServerStatusMeta(item).label === '异常 / 离线',
    ).length;
    return [
      { color: 'success', label: '在线 / 正常', value: active },
      { color: 'warning', label: '需关注', value: warning },
      { color: 'error', label: '异常 / 离线', value: exception },
    ];
  }

  if (activeTab.value === 'terminal') {
    return [
      {
        color: 'success',
        label: '启用中',
        value: terminalRows.value.filter(
          (item) => getTerminalStatusMeta(item.status).label === '启用中',
        ).length,
      },
      {
        color: 'warning',
        label: '维护中',
        value: terminalRows.value.filter(
          (item) => getTerminalStatusMeta(item.status).label === '维护中',
        ).length,
      },
      {
        color: 'default',
        label: '已退役',
        value: terminalRows.value.filter(
          (item) => getTerminalStatusMeta(item.status).label === '已退役',
        ).length,
      },
    ];
  }

  return [
    {
      color: 'processing',
      label: '已登记IP',
      value: infraRows.value.filter((item) => !!normalizeText(item.ip_address))
        .length,
    },
    {
      color: 'blue',
      label: '已登记位置',
      value: infraRows.value.filter((item) => !!normalizeText(item.loc)).length,
    },
    {
      color: 'purple',
      label: '唯一位置数',
      value: new Set(
        infraRows.value.map((item) => normalizeText(item.loc)).filter(Boolean),
      ).size,
    },
  ];
});

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function normalizeStatusToken(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function sanitizeColumnKeys(tab: AssetTabKey, columnKeys: string[]) {
  const normalizedKeys = columnKeys.map((key) => {
    if (tab === 'all' && key === 'hostname') {
      return 'display_name';
    }
    if (tab === 'infra' && key === 'loc') {
      return 'business_address';
    }
    if (tab === 'servers' && key === 'asset_location') {
      return 'business_address';
    }
    return key;
  });
  const sourceColumns = getColumnsForTab(tab);
  const allowedKeys = new Set(
    sourceColumns.map((column) => String(column.key || column.dataIndex || '')),
  );
  const nextKeys = normalizedKeys.filter((key) => allowedKeys.has(key));
  return nextKeys.length > 0 ? nextKeys : [...defaultColumnKeyMap[tab]];
}

function buildStoragePayload() {
  return {
    activeTab: activeTab.value,
    columnVisibilityMap: {
      all: [...columnVisibilityMap.all],
      infra: [...columnVisibilityMap.infra],
      servers: [...columnVisibilityMap.servers],
      terminal: [...columnVisibilityMap.terminal],
    },
    filters: {
      all: { ...allFilters },
      infra: { ...infraFilters },
      servers: { ...serverFilters },
      terminal: { ...terminalFilters },
    },
  };
}

function persistPageState() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(buildStoragePayload()),
  );
}

function restorePageState() {
  if (typeof window === 'undefined') {
    return;
  }
  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return;
  }
  try {
    const state = JSON.parse(rawValue);
    const nextTab = String(state?.activeTab || '').trim();
    if (
      nextTab === 'all' ||
      nextTab === 'infra' ||
      nextTab === 'servers' ||
      nextTab === 'terminal'
    ) {
      activeTab.value = nextTab;
    }
    for (const tab of [
      'all',
      'infra',
      'servers',
      'terminal',
    ] as AssetTabKey[]) {
      const filterState = state?.filters?.[tab] || {};
      const targetFilters = getFilterState(tab);
      targetFilters.ip_address = String(filterState.ip_address || '');
      targetFilters.tag_number = String(filterState.tag_number || '');
      targetFilters.business_address = String(
        filterState.business_address || '',
      );

      const columnKeys = Array.isArray(state?.columnVisibilityMap?.[tab])
        ? state.columnVisibilityMap[tab].map(String)
        : [];
      columnVisibilityMap[tab] = sanitizeColumnKeys(tab, columnKeys);
    }
  } catch {
    // ignore invalid local state
  }
}

function getServerStatusMeta(record: ServerAssetRow) {
  const status = normalizeStatusToken(record.status);
  if (
    record.color === 'green' ||
    ['active', 'healthy', 'normal', 'online', 'running', 'success'].includes(
      status,
    )
  ) {
    return { color: 'success', label: '在线 / 正常' };
  }
  if (
    record.color === 'orange' ||
    ['maintenance', 'pending', 'unknown', 'warning'].includes(status)
  ) {
    return { color: 'warning', label: '需关注' };
  }
  if (
    record.color === 'red' ||
    ['error', 'failed', 'inactive', 'offline'].includes(status)
  ) {
    return { color: 'error', label: '异常 / 离线' };
  }
  return { color: 'default', label: record.status || '-' };
}

function getTerminalStatusMeta(status: string) {
  const normalizedStatus = normalizeStatusToken(status);
  if (normalizedStatus === 'active') {
    return { color: 'success', label: '启用中' };
  }
  if (normalizedStatus === 'maintenance') {
    return { color: 'warning', label: '维护中' };
  }
  if (normalizedStatus === 'retired') {
    return { color: 'default', label: '已退役' };
  }
  return { color: 'error', label: status || '-' };
}

function openDetailDrawer(record: Record<string, any>, tab: AssetTabKey) {
  detailState.value = { record, tab };
  detailDrawerOpen.value = true;
}

function toggleColumnVisibility(
  tab: AssetTabKey,
  columnKey: string,
  checked: boolean,
) {
  if (checked) {
    if (!columnVisibilityMap[tab].includes(columnKey)) {
      columnVisibilityMap[tab] = [...columnVisibilityMap[tab], columnKey];
    }
    return;
  }
  if (columnVisibilityMap[tab].length <= 1) {
    return;
  }
  columnVisibilityMap[tab] = columnVisibilityMap[tab].filter(
    (key) => key !== columnKey,
  );
}

function handleColumnVisibilityChange(columnKey: string, checked: boolean) {
  toggleColumnVisibility(activeTab.value, columnKey, checked);
}

function buildTableRow(record: Record<string, any>) {
  const detailTab =
    activeTab.value === 'all'
      ? ((record.asset_type_key || 'servers') as AssetTabKey)
      : activeTab.value;
  const detailRecord =
    activeTab.value === 'all'
      ? (record.rawRecord as Record<string, any>)
      : record;
  return {
    class: 'cursor-pointer',
    onClick: () => openDetailDrawer(detailRecord, detailTab),
  };
}

const detailFields = computed<DetailField[]>(() => {
  const detailTab = detailState.value?.tab;
  const record = detailState.value?.record || {};
  if (detailTab === 'infra') {
    return [
      ['资产号', record.tag_number],
      ['IP地址', record.ip_address],
      ['品牌', record.brand_name],
      ['型号', record.model_name],
      ['序列号', record.serial_number],
      ['责任人', record.asset_person],
      ['业务地址', record.loc || record.location_name],
      ['添加时间', record.created_at],
    ].map(([label, value]) => ({
      label: String(label),
      value: normalizeText(value) || '-',
    }));
  }
  if (detailTab === 'terminal') {
    return [
      ['资产号', record.tag_number],
      ['主机名', record.hostname],
      ['IP地址', record.ip_address],
      ['品牌', record.brand_name],
      ['型号', record.model_name],
      ['责任人', record.asset_person],
      ['使用人', record.user_name],
      ['归属关系', record.ownership],
      ['业务地址', record.business_address || record.location_name],
      ['状态', getTerminalStatusMeta(record.status).label],
    ].map(([label, value]) => ({
      label: String(label),
      value: normalizeText(value) || '-',
    }));
  }
  return [
    ['IP地址', record.ip_address],
    ['品牌', record.brand_name],
    ['型号', record.model_name],
    ['序列号', record.serial_number],
    ['资产号', record.tag_number],
    ['业务地址', record.asset_location],
    ['连接状态', getServerStatusMeta(record).label],
    ['添加时间', record.created_at],
  ].map(([label, value]) => ({
    label: String(label),
    value: normalizeText(value) || '-',
  }));
});

const detailDrawerTitle = computed(() => {
  const detailTab = detailState.value?.tab;
  if (detailTab === 'infra') {
    return '基础设施详情';
  }
  if (detailTab === 'terminal') {
    return '终端详情';
  }
  return '服务器详情';
});

function buildServerParams(
  page = pagerMap.servers.page,
  pageSize = pagerMap.servers.pageSize,
): ServerPageFetchParams {
  return {
    business_address:
      normalizeText(serverFilters.business_address) || undefined,
    ip_address: normalizeText(serverFilters.ip_address) || undefined,
    owned_only: true,
    page,
    pageSize,
    sort_field: 'created_at',
    sort_order: 'desc',
    tag_number: normalizeText(serverFilters.tag_number) || undefined,
  };
}

function sortMergedRows(rows: MergedAssetRow[]) {
  return rows.toSorted((current, next) => {
    const nextTime = new Date(normalizeText(next.created_at) || 0).getTime();
    const currentTime = new Date(
      normalizeText(current.created_at) || 0,
    ).getTime();
    if (nextTime !== currentTime) {
      return nextTime - currentTime;
    }
    return String(next.id).localeCompare(String(current.id));
  });
}

function mapMergedInfraRows(rows: InfraAsset[]): MergedAssetRow[] {
  return rows.map((item) => ({
    asset_person: item.asset_person,
    asset_type_key: 'infra',
    asset_type_label: '基础设施',
    brand_name: item.brand_name,
    business_address: item.loc,
    created_at: item.created_at,
    display_name: item.ip_address || item.tag_number || item.serial_number,
    id: `infra-${item.id}`,
    ip_address: item.ip_address,
    model_name: item.model_name,
    rawRecord: item as Record<string, any>,
    serial_number: item.serial_number,
    status: '已登记',
    tag_number: item.tag_number,
  }));
}

function mapMergedServerRows(rows: ServerAssetRow[]): MergedAssetRow[] {
  return rows.map((item) => ({
    ...(() => {
      const statusMeta = getServerStatusMeta(item);
      return {
        status: statusMeta.label,
        status_color: statusMeta.color,
      };
    })(),
    asset_person: item.asset_person,
    asset_type_key: 'servers',
    asset_type_label: '服务器',
    brand_name: item.brand_name,
    business_address: item.asset_location,
    created_at: item.created_at,
    display_name: item.ip_address || item.tag_number || item.serial_number,
    id: `servers-${item.id || item.tag_number || item.ip_address}`,
    ip_address: item.ip_address,
    model_name: item.model_name,
    rawRecord: item,
    serial_number: item.serial_number,
    tag_number: item.tag_number,
  }));
}

function mapMergedTerminalRows(rows: TerminalAssetItem[]): MergedAssetRow[] {
  return rows.map((item) => ({
    ...(() => {
      const statusMeta = getTerminalStatusMeta(item.status);
      return {
        status: statusMeta.label,
        status_color: statusMeta.color,
      };
    })(),
    asset_person: item.asset_person,
    asset_type_key: 'terminal',
    asset_type_label: '终端',
    brand_name: item.brand_name,
    business_address: item.business_address || item.location_name,
    created_at: item.created_at,
    display_name: item.hostname || item.tag_number || item.ip_address,
    hostname: item.hostname,
    id: `terminal-${item.id}`,
    ip_address: item.ip_address,
    model_name: item.model_name,
    ownership:
      (item as Record<string, any>).ownership || resolveTerminalOwnership(item),
    rawRecord: item as Record<string, any>,
    serial_number: item.serial_number,
    tag_number: item.tag_number,
    user_name: item.user_name,
  }));
}

async function loadInfraAssets() {
  loadingMap.infra = true;
  try {
    const result = await getInfraAssetsListApi({
      business_address:
        normalizeText(infraFilters.business_address) || undefined,
      ip_address: normalizeText(infraFilters.ip_address) || undefined,
      owned_only: true,
      page: pagerMap.infra.page,
      pageSize: pagerMap.infra.pageSize,
      sort_field: 'created_at',
      sort_order: 'desc',
      tag_number: normalizeText(infraFilters.tag_number) || undefined,
    });
    infraRows.value = result.items || [];
    pagerMap.infra.total = Number(result.total || 0);
  } catch {
    infraRows.value = [];
    pagerMap.infra.total = 0;
  } finally {
    loadingMap.infra = false;
  }
}

async function loadServerAssets() {
  loadingMap.servers = true;
  try {
    const result = await getServersListApi(buildServerParams());
    serverRows.value = result.items || [];
    pagerMap.servers.total = Number(result.total || 0);
  } catch {
    serverRows.value = [];
    pagerMap.servers.total = 0;
  } finally {
    loadingMap.servers = false;
  }
}

function resolveTerminalOwnership(row: TerminalAssetItem) {
  const userId = currentUserId.value;
  const isOwner = normalizeText(row.asset_user_id) === userId;
  const isUser = normalizeText(row.user_id) === userId;
  if (isOwner && isUser) return '责任人 / 使用人';
  if (isOwner) return '责任人';
  if (isUser) return '使用人';
  return '-';
}

async function loadTerminalAssets() {
  loadingMap.terminal = true;
  try {
    const result = await getTerminalAssetListApi({
      business_address:
        normalizeText(terminalFilters.business_address) || undefined,
      ip_address: normalizeText(terminalFilters.ip_address) || undefined,
      owned_only: true,
      page: pagerMap.terminal.page,
      pageSize: pagerMap.terminal.pageSize,
      tag_number: normalizeText(terminalFilters.tag_number) || undefined,
    });
    terminalRows.value = (result.items || []).map((item) => ({
      ...item,
      ownership: resolveTerminalOwnership(item),
    }));
    pagerMap.terminal.total = Number(result.total || 0);
  } catch {
    terminalRows.value = [];
    pagerMap.terminal.total = 0;
  } finally {
    loadingMap.terminal = false;
  }
}

async function loadAllAssets() {
  loadingMap.all = true;
  try {
    const [infraResult, serverResult, terminalResult] = await Promise.all([
      getInfraAssetsListApi({
        business_address:
          normalizeText(infraFilters.business_address) || undefined,
        ip_address: normalizeText(infraFilters.ip_address) || undefined,
        owned_only: true,
        page: 1,
        pageSize: ALL_ASSET_FETCH_SIZE,
        sort_field: 'created_at',
        sort_order: 'desc',
        tag_number: normalizeText(infraFilters.tag_number) || undefined,
      }),
      getServersListApi(buildServerParams(1, ALL_ASSET_FETCH_SIZE)),
      getTerminalAssetListApi({
        business_address:
          normalizeText(terminalFilters.business_address) || undefined,
        ip_address: normalizeText(terminalFilters.ip_address) || undefined,
        owned_only: true,
        page: 1,
        pageSize: ALL_ASSET_FETCH_SIZE,
        tag_number: normalizeText(terminalFilters.tag_number) || undefined,
      }),
    ]);

    pagerMap.infra.total = Number(infraResult.total || 0);
    pagerMap.servers.total = Number(serverResult.total || 0);
    pagerMap.terminal.total = Number(terminalResult.total || 0);

    const normalizedTerminalRows = (terminalResult.items || []).map((item) => ({
      ...item,
      ownership: resolveTerminalOwnership(item),
    }));
    const nextMergedRows = sortMergedRows([
      ...mapMergedServerRows(serverResult.items || []),
      ...mapMergedInfraRows(infraResult.items || []),
      ...mapMergedTerminalRows(normalizedTerminalRows),
    ]);

    mergedRows.value = nextMergedRows;
    pagerMap.all.total =
      pagerMap.infra.total + pagerMap.servers.total + pagerMap.terminal.total;
  } catch {
    mergedRows.value = [];
    pagerMap.all.total = 0;
  } finally {
    loadingMap.all = false;
  }
}

async function loadTabData(tab: AssetTabKey) {
  if (tab === 'all') {
    await loadAllAssets();
    return;
  }
  if (tab === 'infra') {
    await loadInfraAssets();
    return;
  }
  if (tab === 'terminal') {
    await loadTerminalAssets();
    return;
  }
  await loadServerAssets();
}

async function refreshAll() {
  await Promise.all([
    loadAllAssets(),
    loadInfraAssets(),
    loadServerAssets(),
    loadTerminalAssets(),
  ]);
}

function getFilterState(tab: AssetTabKey) {
  return tab === 'all' ? allFilters : sharedFilters;
}

async function handleSearch(tab: AssetTabKey) {
  pagerMap[tab].page = 1;
  if (tab === 'all') {
    pagerMap.all.page = 1;
  }
  await loadTabData(tab);
}

async function handleTabChange(tab: number | string) {
  activeTab.value = String(tab) as AssetTabKey;
  await loadTabData(activeTab.value);
}

async function handleReset(tab: AssetTabKey) {
  const filters = getFilterState(tab);
  filters.business_address = '';
  filters.ip_address = '';
  filters.tag_number = '';
  pagerMap.all.page = 1;
  await handleSearch(tab);
}

async function handleTableChange(
  tab: AssetTabKey,
  pagination: { current?: number; pageSize?: number },
) {
  pagerMap[tab].page = Number(pagination.current || 1);
  pagerMap[tab].pageSize = Number(pagination.pageSize || 10);
  if (tab === 'all') {
    return;
  }
  await loadTabData(tab);
}

function resolveRowKey(record: Record<string, any>) {
  return (
    record.id ||
    (record.asset_type_key
      ? `${record.asset_type_key}-${record.tag_number || record.ip_address || record.hostname || 'row'}`
      : '') ||
    record.tag_number ||
    record.serial_number ||
    record.hostname ||
    record.ip_address
  );
}

watch(activeTab, () => {
  persistPageState();
});
watch(sharedFilters, persistPageState, { deep: true });
watch(columnVisibilityMap, persistPageState, { deep: true });

onMounted(async () => {
  restorePageState();
  await refreshAll();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex min-h-0 flex-col gap-4">
      <Card
        :bordered="false"
        :body-style="{ padding: '0' }"
        class="overflow-hidden"
      >
        <div class="relative overflow-hidden px-4 py-3">
          <div
            class="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent"
          ></div>
          <div
            class="relative flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="m-0 text-lg font-semibold text-foreground">
                  我的资产
                </h2>
                <Tag color="blue">仅本人归属</Tag>
                <span
                  class="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  当前账号：{{ currentUserName }}
                </span>
                <span
                  class="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  总资产：{{ totalAssets }}
                </span>
                <span
                  class="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  终端兼容责任人 / 使用人
                </span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 xl:min-w-[300px]">
              <div
                class="rounded-lg border border-border/80 bg-background/90 px-3 py-2"
              >
                <div class="text-[11px] text-muted-foreground">服务器</div>
                <div
                  class="mt-1 text-lg font-semibold leading-none text-foreground"
                >
                  {{ pagerMap.servers.total }}
                </div>
              </div>
              <div
                class="rounded-lg border border-border/80 bg-background/90 px-3 py-2"
              >
                <div class="text-[11px] text-muted-foreground">基础设施</div>
                <div
                  class="mt-1 text-lg font-semibold leading-none text-foreground"
                >
                  {{ pagerMap.infra.total }}
                </div>
              </div>
              <div
                class="rounded-lg border border-border/80 bg-background/90 px-3 py-2"
              >
                <div class="text-[11px] text-muted-foreground">终端</div>
                <div
                  class="mt-1 text-lg font-semibold leading-none text-foreground"
                >
                  {{ pagerMap.terminal.total }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Card
          v-for="item in summaryCards"
          :key="item.key"
          :body-style="{ padding: '10px 12px' }"
          class="cursor-pointer rounded-lg border transition-all duration-200"
          :class="[
            item.key === activeTab
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/30 hover:shadow-sm',
          ]"
          :bordered="false"
          hoverable
          @click="handleTabChange(item.key)"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-foreground">
                {{ item.title }}
              </div>
              <div class="text-[11px] text-muted-foreground">
                {{ item.scopeText }}
              </div>
            </div>
            <Tag :color="item.key === activeTab ? 'blue' : 'default'">
              {{ item.key === activeTab ? '当前视图' : '点击切换' }}
            </Tag>
          </div>
          <div class="mt-2 flex items-end justify-between gap-3">
            <div class="text-xl font-semibold leading-none text-foreground">
              {{ item.total }}
            </div>
            <div class="text-[11px] text-muted-foreground">
              {{ item.description }}
            </div>
          </div>
        </Card>
      </div>

      <Card
        :bordered="false"
        :body-style="{ padding: '0' }"
        class="min-h-0 flex-1 overflow-hidden"
      >
        <div class="border-b border-border px-5 pb-0 pt-5">
          <div
            class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
          >
            <div>
              <div class="text-lg font-semibold text-foreground">
                {{ currentView.title }}
              </div>
              <div class="mt-1 text-sm leading-6 text-muted-foreground">
                {{ currentView.description }}
              </div>
            </div>
            <Space :size="12" wrap>
              <Tag color="processing">
                当前归属：{{ currentView.scopeText }}
              </Tag>
              <Tag color="default">共 {{ currentView.pager.total }} 条</Tag>
              <Button @click="loadTabData(activeTab)">刷新当前</Button>
              <Button type="primary" @click="refreshAll">刷新全部</Button>
            </Space>
          </div>

          <Tabs
            v-model:active-key="activeTab"
            class="mt-4"
            size="large"
            @change="handleTabChange"
          >
            <Tabs.TabPane
              v-for="item in tabItems"
              :key="item.key"
              :tab="item.label"
            />
          </Tabs>
        </div>

        <div class="p-5">
          <div class="rounded-2xl border border-border bg-accent/40 p-4">
            <div
              class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
            >
              <div class="flex flex-wrap items-center gap-2">
                <div class="text-sm font-medium text-foreground">查询条件</div>
                <Tag color="default">支持 IP / 资产号</Tag>
                <Tag v-if="currentView.ownershipHint" color="processing">
                  {{ currentView.ownershipHint }}
                </Tag>
              </div>
              <div class="text-xs text-muted-foreground">
                优先筛出具体设备，再进入明细台账核对
              </div>
            </div>

            <div
              class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[minmax(0,200px)_minmax(0,200px)_minmax(0,220px)_auto]"
            >
              <Input
                v-model:value="activeFilterState.business_address"
                allow-clear
                placeholder="业务地址"
                size="small"
                @press-enter="handleSearch(activeTab)"
              />
              <Input
                v-model:value="activeFilterState.ip_address"
                allow-clear
                placeholder="IP 地址"
                size="small"
                @press-enter="handleSearch(activeTab)"
              />
              <Input
                v-model:value="activeFilterState.tag_number"
                allow-clear
                placeholder="资产号"
                size="small"
                @press-enter="handleSearch(activeTab)"
              />
              <div class="flex flex-wrap items-center gap-2">
                <Button
                  size="small"
                  type="primary"
                  @click="handleSearch(activeTab)"
                >
                  查询
                </Button>
                <Button size="small" @click="handleReset(activeTab)">
                  重置
                </Button>
                <Popover placement="bottomRight" trigger="click">
                  <template #content>
                    <div class="flex w-44 flex-col gap-2 py-1">
                      <Checkbox
                        v-for="item in currentColumnOptions"
                        :key="item.key"
                        :checked="
                          columnVisibilityMap[activeTab].includes(item.key)
                        "
                        @change="
                          (event) =>
                            handleColumnVisibilityChange(
                              item.key,
                              Boolean(event.target?.checked),
                            )
                        "
                      >
                        {{ item.title }}
                      </Checkbox>
                    </div>
                  </template>
                  <Button size="small">列设置</Button>
                </Popover>
                <Tag color="default">当前页 {{ currentPageCount }} 条</Tag>
              </div>
            </div>

            <div
              v-if="activeFilterEntries.length > 0"
              class="mt-3 flex flex-wrap items-center gap-2"
            >
              <span class="text-xs text-muted-foreground">已启用筛选</span>
              <Tag
                v-for="item in activeFilterEntries"
                :key="item.label"
                color="blue"
              >
                {{ item.label }}: {{ item.value }}
              </Tag>
            </div>
          </div>

          <div
            class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div class="min-w-0">
              <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div
                  v-for="item in activeViewStats"
                  :key="item.label"
                  class="rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <div class="text-xs text-muted-foreground">
                    {{ item.label }}
                  </div>
                  <div class="mt-2 text-lg font-semibold text-foreground">
                    {{ item.value }}
                  </div>
                </div>
              </div>

              <Alert
                class="mt-4"
                message="终端资产会同时识别“责任人”和“使用人”；服务器与基础设施按照资产责任人归属。"
                show-icon
                type="info"
              />

              <div
                class="mt-4 overflow-hidden rounded-2xl border border-border"
              >
                <Table
                  :columns="currentView.tableColumns"
                  :custom-row="buildTableRow"
                  :data-source="currentView.rows"
                  :loading="currentView.loading"
                  :locale="{ emptyText: currentView.emptyText }"
                  :pagination="{
                    current: currentView.pager.page,
                    pageSize: currentView.pager.pageSize,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                    total: currentView.pager.total,
                  }"
                  :row-key="resolveRowKey"
                  :scroll="{ x: 1280 }"
                  size="middle"
                  @change="
                    (pagination) => handleTableChange(activeTab, pagination)
                  "
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'asset_type_label'">
                      <Tag
                        :color="
                          record.asset_type_key === 'servers'
                            ? 'processing'
                            : record.asset_type_key === 'infra'
                              ? 'blue'
                              : 'gold'
                        "
                      >
                        {{ record.asset_type_label }}
                      </Tag>
                    </template>
                    <template
                      v-else-if="
                        column.key === 'status' &&
                        (activeTab === 'servers' ||
                          record.asset_type_key === 'servers')
                      "
                    >
                      <Tag
                        :color="
                          activeTab === 'all'
                            ? record.status_color || 'default'
                            : getServerStatusMeta(record).color
                        "
                      >
                        {{
                          activeTab === 'all'
                            ? record.status || getServerStatusMeta(record).label
                            : getServerStatusMeta(record).label
                        }}
                      </Tag>
                    </template>
                    <template v-else-if="column.key === 'ownership'">
                      <Tag color="blue">{{ record.ownership || '-' }}</Tag>
                    </template>
                    <template
                      v-else-if="
                        column.key === 'status' &&
                        (activeTab === 'terminal' ||
                          record.asset_type_key === 'terminal')
                      "
                    >
                      <Tag
                        :color="
                          activeTab === 'all'
                            ? record.status_color || 'default'
                            : getTerminalStatusMeta(record.status).color
                        "
                      >
                        {{
                          activeTab === 'all'
                            ? record.status ||
                              getTerminalStatusMeta(record.rawRecord?.status)
                                .label
                            : getTerminalStatusMeta(record.status).label
                        }}
                      </Tag>
                    </template>
                    <template
                      v-else-if="
                        column.key === 'status' &&
                        record.asset_type_key === 'infra'
                      "
                    >
                      <Tag color="default">{{ record.status || '已登记' }}</Tag>
                    </template>
                  </template>
                </Table>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="rounded-2xl border border-border bg-background p-4">
                <div class="text-sm font-medium text-foreground">状态摘要</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  当前页可直接确认的状态信息，减少逐行翻表
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3">
                  <div
                    v-for="item in activeStatusSummaryItems"
                    :key="item.label"
                    class="rounded-xl border border-border/80 px-3 py-3"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <Tag :color="item.color">{{ item.label }}</Tag>
                      <span class="text-base font-semibold text-foreground">
                        {{ item.value }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-border bg-background p-4">
                <div class="text-sm font-medium text-foreground">资产分布</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  个人名下资产按类型拆分，便于快速判断当前关注重心
                </div>

                <div class="mt-4 space-y-4">
                  <div v-for="item in distributionItems" :key="item.key">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex min-w-0 items-center gap-2">
                        <span
                          class="h-2.5 w-2.5 rounded-full"
                          :class="item.colorClass"
                        ></span>
                        <div class="min-w-0">
                          <div class="truncate text-sm text-foreground">
                            {{ item.title }}
                          </div>
                          <div class="text-xs text-muted-foreground">
                            {{ item.scopeText }}
                          </div>
                        </div>
                      </div>
                      <div class="text-sm font-medium text-foreground">
                        {{ item.total }}
                      </div>
                    </div>
                    <Progress
                      :percent="
                        totalAssets
                          ? Number(
                              ((item.total / totalAssets) * 100).toFixed(1),
                            )
                          : 0
                      "
                      :show-info="false"
                      :stroke-color="
                        item.key === 'servers'
                          ? '#0ea5e9'
                          : item.key === 'infra'
                            ? '#10b981'
                            : '#f59e0b'
                      "
                      class="mt-2"
                      size="small"
                    />
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-border bg-background p-4">
                <div class="text-sm font-medium text-foreground">
                  当前视图画像
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  当前选中的资产类型及其筛选状态
                </div>

                <div class="mt-4 space-y-3">
                  <div class="rounded-xl bg-accent/60 p-3">
                    <div class="text-xs text-muted-foreground">当前类型</div>
                    <div class="mt-1 text-base font-semibold text-foreground">
                      {{ activeSummaryCard?.title || currentView.title }}
                    </div>
                    <div class="mt-1 text-xs leading-5 text-muted-foreground">
                      {{
                        activeSummaryCard?.description ||
                        currentView.description
                      }}
                    </div>
                  </div>

                  <div
                    class="rounded-xl border border-dashed border-border p-3"
                  >
                    <div class="text-xs text-muted-foreground">启用筛选</div>
                    <div
                      v-if="activeFilterEntries.length > 0"
                      class="mt-2 flex flex-wrap gap-2"
                    >
                      <Tag
                        v-for="item in activeFilterEntries"
                        :key="item.label"
                        color="blue"
                      >
                        {{ item.label }}: {{ item.value }}
                      </Tag>
                    </div>
                    <div v-else class="mt-2 text-sm text-muted-foreground">
                      当前未启用筛选条件，展示当前视图下的全部本人资产。
                    </div>
                  </div>

                  <div class="rounded-xl border border-border p-3">
                    <div class="text-xs text-muted-foreground">查看建议</div>
                    <div class="mt-2 text-sm leading-6 text-muted-foreground">
                      优先通过资产号定位具体设备；如是终端问题，建议同时核对“责任人”和“使用人”两列。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
    <Drawer
      v-model:open="detailDrawerOpen"
      :width="420"
      :title="detailDrawerTitle"
    >
      <div class="flex flex-col gap-3">
        <div class="rounded-xl bg-accent/60 p-3">
          <div class="text-xs text-muted-foreground">当前类型</div>
          <div class="mt-1 text-base font-semibold text-foreground">
            {{ detailSummaryCard?.title || detailDrawerTitle }}
          </div>
        </div>
        <div
          v-for="item in detailFields"
          :key="item.label"
          class="flex items-start justify-between gap-4 rounded-xl border border-border px-3 py-2"
        >
          <div class="text-xs text-muted-foreground">{{ item.label }}</div>
          <div
            class="max-w-[220px] break-all text-right text-sm text-foreground"
          >
            {{ item.value }}
          </div>
        </div>
      </div>
    </Drawer>
  </Page>
</template>
