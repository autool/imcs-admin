<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import {
  ExclamationCircleFilled,
  SvgCpuIcon,
  SvgFanIcon,
  SvgMemoryIcon,
  SvgNetworkIcon,
  SvgPowerIcon,
  SvgStorageIcon,
} from '@vben/icons';

import {
  Badge as ABadge,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Spin as ASpin,
  TabPane as ATabPane,
  Tabs as ATabs,
  message,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getServerLifecycleApi,
  markServerLifecycleReadApi,
} from '#/api/servers';
import { useServerStore } from '#/store';
import {
  formatDiagnosticArea,
  formatMissingField,
  formatModelReferenceCatalogIssue,
  formatQualityFlag,
} from '#/utils/collection-diagnostics';
import { resolveServerModelImage } from '#/utils/server-model-assets';

// 在 view.vue 中
import HardwareDetails from './HardwareDetails.vue';

const [HardFormDrawer, HardformDrawerApi] = useVbenDrawer({
  connectedComponent: HardwareDetails,
});
interface ServerInfo {
  ip: string;
  modelName: string;
  motherboard: string;
  biosVersion: string;
  cpldVersion: string;
  bmcVersion: string;
  serialNumber: string;
  tag_number: string;
  location: string;
  uPosition: string;
  power_state: string;
  status: string;
  color: string;
  collectionQuality?: null | {
    detailId?: string;
    device?: Record<string, any>;
    diagnostics?: Record<string, any>;
    endTime?: null | string;
    executionTimeMs?: number;
    startTime?: null | string;
    status?: string;
    taskExecutionId?: string;
    taskName?: string;
    taskType?: string;
  };
  cpuList: any[];
  memoryList: any[];
  diskList: any[];
  fanList: any[];
  raidList: any[];
  hbaList: any[];
  riserList: any[];
  driveBackplaneList: any[];
  model_image: string;
  cpu_total: number;
  cpu_installed: number;
  memory_total: number;
  memory_installed: number;
  memory_capacity: number;
  storage_raid_cards: number;
  storage_logical_drives: number;
  storage_physical_drives: number;
  network_total: number;
  network_installed: number;
  riser_total: number;
  riser_installed: number;
  drive_backplane_total: number;
  drive_backplane_installed: number;
  power_total: number;
  power_installed: number;
  fan_total: number;
  fan_installed: number;
  alerts: {
    critical: number;
    important: number;
    minor: number;
  };
}

function formatCollectionCoverage(coverage?: Record<string, any>) {
  if (!coverage) {
    return '-';
  }
  const present = coverage.present ?? 0;
  const total = coverage.total ?? 0;
  const percent = coverage.percent ?? 0;
  return `${present}/${total} (${percent}%)`;
}

function getCollectionProfile(
  quality?: null | ServerInfo['collectionQuality'],
) {
  const profile = quality?.diagnostics?.profile || {};
  return [
    profile.bmc_name,
    profile.vendor_key,
    profile.hw_generation,
    profile.firmware_version,
  ]
    .filter(Boolean)
    .join(' / ');
}

function getCollectionModelReference(
  quality?: null | ServerInfo['collectionQuality'],
) {
  const reference = quality?.diagnostics?.model_reference;
  return reference && typeof reference === 'object' ? reference : undefined;
}

function formatCollectionModelReference(
  quality?: null | ServerInfo['collectionQuality'],
) {
  const reference = getCollectionModelReference(quality);
  if (!reference) {
    return '-';
  }
  const model = reference.catalog_model || reference.model || '-';
  return reference.matched ? `${model} / 已匹配` : `${model} / 未匹配`;
}

function getCollectionModelReferenceCatalogIssue(
  quality?: null | ServerInfo['collectionQuality'],
) {
  return formatModelReferenceCatalogIssue(getCollectionModelReference(quality));
}

function getCollectionMissingFields(
  quality?: null | ServerInfo['collectionQuality'],
) {
  const fields = quality?.diagnostics?.missing_fields;
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields.map((field) => formatMissingField(field));
}

function getCollectionQualityFlags(
  quality?: null | ServerInfo['collectionQuality'],
) {
  const flags = quality?.diagnostics?.quality_flags;
  if (!Array.isArray(flags)) {
    return [];
  }
  return flags.map((flag) => formatQualityFlag(flag));
}

function getCollectionSourcePaths(
  quality?: null | ServerInfo['collectionQuality'],
) {
  const paths = quality?.diagnostics?.source_paths || {};
  return Object.entries(paths)
    .map(([key, value]: [string, any]) => ({
      failed: value?.failed_count || 0,
      hit: value?.hit_count || 0,
      label: formatDiagnosticArea(key),
      total: value?.candidate_count || 0,
    }))
    .filter((item) => item.total > 0)
    .slice(0, 8);
}

function getCollectionStatusColor(status?: string) {
  const statusText = String(status || '').toLowerCase();
  if (statusText === 'success') {
    return 'success';
  }
  if (statusText === 'failed') {
    return 'error';
  }
  if (statusText === 'partial') {
    return 'warning';
  }
  return 'default';
}

// 定义接收的 props
const serverStore = useServerStore();
const data = ref();
const serverInfo = ref<ServerInfo>();
const loading = ref(false);
const activeTab = ref('info');
const currentServerId = ref('');
const lifecycleUnreadCount = ref(0);
const lifecycleItems = ref<any[]>([]);

function isEmptyLifecycleValue(value: any) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return ['', '-', 'n/a', 'none', 'null', 'unknown'].includes(
      value.trim().toLowerCase(),
    );
  }
  return false;
}

function formatLifecycleValue(value: any) {
  if (isEmptyLifecycleValue(value)) {
    return '-';
  }

  if (typeof value !== 'string') {
    return String(value);
  }

  const text = value.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) {
    return text;
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return `${parsed.length} 项`;
    }
    const labels: Record<string, string> = {
      capacity: '容量',
      board_id: '板卡ID',
      cpld_version: 'CPLD',
      device_name: '名称',
      firmware_version: '固件',
      manufacturer: '厂商',
      media_type: '介质',
      model: '型号',
      name: '名称',
      number: '编号',
      part_number: '部件号',
      pcb_version: 'PCB',
      serial_number: '序列号',
      size: '容量',
      socket: '槽位',
      slot: '槽位',
      speed_mhz: '频率',
      status: '状态',
      type: '类型',
    };
    return (
      Object.entries(parsed)
        .filter(([, itemValue]) => !isEmptyLifecycleValue(itemValue))
        .slice(0, 6)
        .map(([key, itemValue]) => `${labels[key] || key}: ${itemValue}`)
        .join('；') || '-'
    );
  } catch {
    return text;
  }
}

const lifecycleColumns: VxeGridProps['columns'] = [
  {
    title: '类型',
    field: 'event_type',
    width: 90,
    slots: { default: 'eventType' },
  },
  {
    title: '字段/组件',
    field: 'field_name',
    width: 130,
    slots: { default: 'lifecycleObject' },
  },
  {
    title: '变更前',
    field: 'old_value',
    minWidth: 180,
    showOverflow: 'tooltip',
    slots: { default: 'oldValue' },
  },
  {
    title: '变更后',
    field: 'new_value',
    minWidth: 180,
    showOverflow: 'tooltip',
    slots: { default: 'newValue' },
  },
  {
    title: '原因',
    field: 'change_reason',
    minWidth: 220,
    showOverflow: 'tooltip',
  },
  {
    title: '时间',
    field: 'created_at',
    width: 170,
    formatter: 'formatDateTime',
  },
];

const lifecycleGridOptions: VxeGridProps = {
  border: true,
  columns: lifecycleColumns,
  height: 420,
  keepSource: true,
  pagerConfig: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!currentServerId.value) {
          return { items: [], total: 0 };
        }
        const response = await getServerLifecycleApi(currentServerId.value, {
          category: 'all',
          page: page.currentPage,
          page_size: page.pageSize,
        });
        const items = response?.items || [];
        lifecycleItems.value = items;
        updateLifecycleUnread(
          currentServerId.value,
          items,
          response?.total || 0,
          response?.unread_count,
          response?.read_at,
          response?.read_state_available,
        );
        return response;
      },
    },
    response: {
      list: 'items',
      result: 'items',
      total: 'total',
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  stripe: true,
  toolbarConfig: {
    refresh: true,
  },
};

const [LifecycleGrid, lifecycleGridApi] = useVbenVxeGrid({
  gridOptions: lifecycleGridOptions,
});

function lifecycleReadKey(serverId: string) {
  return `server-lifecycle-read-at:${serverId}`;
}

function getLifecycleTimestamp(item: any) {
  const time = item?.created_at ? new Date(item.created_at).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function updateLifecycleUnread(
  serverId: string,
  items: any[],
  total: number,
  backendUnreadCount?: number,
  backendReadAt?: null | string,
  readStateAvailable = false,
) {
  if (!serverId) {
    lifecycleUnreadCount.value = 0;
    return;
  }
  if (readStateAvailable && typeof backendUnreadCount === 'number') {
    lifecycleUnreadCount.value = backendUnreadCount;
    if (backendReadAt) {
      localStorage.setItem(
        lifecycleReadKey(serverId),
        String(new Date(backendReadAt).getTime()),
      );
    }
    return;
  }
  const readAt = Number(localStorage.getItem(lifecycleReadKey(serverId)) || 0);
  if (!readAt) {
    lifecycleUnreadCount.value = total;
    return;
  }
  lifecycleUnreadCount.value = items.filter(
    (item) => getLifecycleTimestamp(item) > readAt,
  ).length;
}

async function markLifecycleRead() {
  if (!currentServerId.value) {
    return;
  }
  const now = Date.now();
  localStorage.setItem(lifecycleReadKey(currentServerId.value), String(now));
  lifecycleUnreadCount.value = 0;
  try {
    const response = await markServerLifecycleReadApi(currentServerId.value);
    if (typeof response?.unread_count === 'number') {
      lifecycleUnreadCount.value = response.unread_count;
    }
  } catch (error) {
    console.warn('标记服务器生命周期已读失败，已使用本地已读兜底:', error);
  }
}

function getLifecycleEventTypeText(type: string) {
  const map: Record<string, string> = {
    business_ip: '业务IP',
    hardware: '硬件',
    ip: '管理IP',
    server: '服务器',
  };
  return map[type] || type || '-';
}

function getLifecycleFieldText(fieldName?: null | string) {
  const map: Record<string, string> = {
    bios_version: 'BIOS版本',
    business_ip: '业务IP',
    capacity: '容量',
    component: '组件',
    cpld_version: 'CPLD版本',
    device_name: '设备名称',
    firmware_version: '固件版本',
    guuid: 'GUUID',
    ip_address: '管理IP',
    location: '位置',
    manufacturer: '厂商',
    model: '型号',
    name: '名称',
    number: '编号',
    part_number: '部件号',
    pcb_version: 'PCB版本',
    power_capacity: '额定功率',
    speed: '速率',
    speed_mhz: '频率',
    speed_rpm: '转速',
    serial_number: '序列号',
    slot: '槽位',
    status: '状态',
    type: '类型',
  };
  return map[fieldName || ''] || fieldName || '-';
}

function getLifecycleObject(record: any) {
  if (record?.event_type === 'business_ip') {
    return record?.ip_address || record?.new_value || '业务IP';
  }
  if (record?.event_type === 'ip') {
    return getLifecycleFieldText(record?.field_name);
  }
  if (record?.event_type === 'server') {
    return getLifecycleFieldText(record?.field_name);
  }
  const component = formatDiagnosticArea(record?.component_type || '');
  return (
    [component, record?.component_id].filter(Boolean).join(' / ') ||
    getLifecycleFieldText(record?.field_name)
  );
}

// 获取服务器详情
async function fetchServerDetails(serverId: string) {
  if (!serverId) {
    message.error('服务器ID不能为空');
    return;
  }

  loading.value = true;
  try {
    const response = await serverStore.getServerDetails(serverId);
    serverInfo.value = response as ServerInfo;
  } catch (error) {
    console.error('获取服务器信息失败:', error);
    message.error('获取服务器信息失败');
    serverInfo.value = undefined;
  } finally {
    loading.value = false;
  }
}

async function fetchServerLifecycleBadge(serverId: string) {
  try {
    const response = await getServerLifecycleApi(serverId, {
      category: 'all',
      page: 1,
      page_size: 20,
    });
    lifecycleItems.value = response?.items || [];
    updateLifecycleUnread(
      serverId,
      lifecycleItems.value,
      response?.total || 0,
      response?.unread_count,
      response?.read_at,
      response?.read_state_available,
    );
  } catch (error) {
    console.error('获取服务器生命周期失败:', error);
    lifecycleItems.value = [];
    lifecycleUnreadCount.value = 0;
  }
}

async function handleTabChange(key: unknown) {
  activeTab.value = String(key);
  if (activeTab.value === 'lifecycle') {
    await nextTick();
    await lifecycleGridApi.query();
    await markLifecycleRead();
  }
}

// 打开抽屉的方法
function openServerDetail() {
  HardformDrawerApi.setData({
    values: serverInfo.value,
  });
  HardformDrawerApi.open();
}

const [Drawer, drawerApi] = useVbenDrawer({
  closable: true,
  loading: false,
  closeOnClickModal: false,
  cancelText: '关闭',

  confirmText: '查看硬件详情',
  onConfirm() {
    openServerDetail();
  },
  onCancel() {
    drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    data.value = drawerApi.getData<Record<string, any>>();
    const serverId = data.value?.values?.server_id;
    if (isOpen && serverId) {
      currentServerId.value = serverId;
      activeTab.value = 'info';
      lifecycleItems.value = [];
      lifecycleUnreadCount.value = 0;
      fetchServerDetails(serverId);
      fetchServerLifecycleBadge(serverId);
    } else if (!isOpen) {
      currentServerId.value = '';
      activeTab.value = 'info';
      lifecycleItems.value = [];
      lifecycleUnreadCount.value = 0;
    }
  },
});
</script>

<template>
  <Drawer class="w-1/2" title="服务器详情">
    <ASpin :spinning="loading">
      <div v-if="serverInfo" class="flex flex-col gap-4">
        <ATabs
          v-model:active-key="activeTab"
          size="small"
          @change="handleTabChange"
        >
          <ATabPane key="info" tab="基本信息">
            <div class="flex flex-col gap-4">
              <!-- 服务器图片 + 状态行 -->
              <div class="flex items-start gap-4">
                <div class="w-1/4 rounded-lg border p-3">
                  <img
                    :src="
                      resolveServerModelImage(serverInfo) ||
                      '/assets/brand/default.png'
                    "
                    alt="服务器正视图"
                    class="w-full object-contain"
                  />
                </div>
                <div class="flex-1">
                  <div class="mb-3 flex items-center gap-3">
                    <span class="text-lg font-medium">{{
                      serverInfo.modelName
                    }}</span>
                    <Tag :color="serverInfo.color || 'green'">
                      {{ serverInfo.status || '管理口在线' }}
                    </Tag>
                    <Tag
                      :color="
                        serverInfo.power_state?.toLowerCase() === 'on'
                          ? 'success'
                          : 'default'
                      "
                    >
                      {{
                        serverInfo.power_state?.toLowerCase() === 'on'
                          ? '上电'
                          : '下电'
                      }}
                    </Tag>
                  </div>
                  <ADescriptions :column="2" bordered size="small">
                    <ADescriptionsItem label="IP地址">
                      {{ serverInfo.ip }}
                    </ADescriptionsItem>
                    <ADescriptionsItem label="序列号">
                      {{ serverInfo.serialNumber || '-' }}
                    </ADescriptionsItem>
                    <ADescriptionsItem label="资产号">
                      {{ serverInfo.tag_number || '-' }}
                    </ADescriptionsItem>
                    <ADescriptionsItem label="资产位置">
                      {{ serverInfo.location || '-' }}
                    </ADescriptionsItem>
                    <ADescriptionsItem label="U位">
                      {{ serverInfo.uPosition || '-' }}
                    </ADescriptionsItem>
                  </ADescriptions>
                </div>
              </div>

              <!-- 固件版本信息 -->
              <div class="rounded-lg border p-3">
                <div class="mb-2 text-sm font-medium">固件版本</div>
                <ADescriptions :column="3" bordered size="small">
                  <ADescriptionsItem label="BIOS版本">
                    {{ serverInfo.biosVersion || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="CPLD版本">
                    {{ serverInfo.cpldVersion || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="BMC版本">
                    {{ serverInfo.bmcVersion || '-' }}
                  </ADescriptionsItem>
                </ADescriptions>
              </div>

              <!-- 采集质量 -->
              <div
                v-if="serverInfo.collectionQuality"
                class="rounded-lg border p-3"
              >
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span>采集质量</span>
                  <Tag
                    :color="
                      getCollectionStatusColor(
                        serverInfo.collectionQuality.status,
                      )
                    "
                  >
                    {{ serverInfo.collectionQuality.status || '-' }}
                  </Tag>
                </div>
                <ADescriptions :column="3" bordered size="small">
                  <ADescriptionsItem label="最近任务">
                    {{ serverInfo.collectionQuality.taskName || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="完成时间">
                    {{ serverInfo.collectionQuality.endTime || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="耗时">
                    {{ serverInfo.collectionQuality.executionTimeMs || 0 }}ms
                  </ADescriptionsItem>
                  <ADescriptionsItem label="适配器">
                    {{
                      getCollectionProfile(serverInfo.collectionQuality) || '-'
                    }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="关键字段">
                    {{
                      formatCollectionCoverage(
                        serverInfo.collectionQuality.diagnostics
                          ?.required_field_coverage,
                      )
                    }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="设备标识">
                    {{
                      serverInfo.collectionQuality.device?.id ||
                      serverInfo.collectionQuality.device?.ip ||
                      '-'
                    }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="型号目录">
                    {{
                      formatCollectionModelReference(
                        serverInfo.collectionQuality,
                      )
                    }}
                  </ADescriptionsItem>
                  <ADescriptionsItem
                    v-if="
                      getCollectionModelReferenceCatalogIssue(
                        serverInfo.collectionQuality,
                      )
                    "
                    label="目录核验"
                  >
                    {{
                      getCollectionModelReferenceCatalogIssue(
                        serverInfo.collectionQuality,
                      )
                    }}
                  </ADescriptionsItem>
                </ADescriptions>
                <div class="mt-3 flex flex-wrap gap-2">
                  <Tag
                    v-if="
                      getCollectionModelReference(serverInfo.collectionQuality)
                    "
                    :color="
                      getCollectionModelReference(serverInfo.collectionQuality)
                        ?.matched
                        ? 'success'
                        : 'warning'
                    "
                  >
                    {{
                      getCollectionModelReference(serverInfo.collectionQuality)
                        ?.manufacturer || '-'
                    }}
                    {{
                      getCollectionModelReference(serverInfo.collectionQuality)
                        ?.model || '-'
                    }}
                  </Tag>
                  <Tag
                    v-for="field in getCollectionMissingFields(
                      serverInfo.collectionQuality,
                    )"
                    :key="`missing-${field}`"
                    color="warning"
                  >
                    {{ field }}
                  </Tag>
                  <Tag
                    v-for="flag in getCollectionQualityFlags(
                      serverInfo.collectionQuality,
                    )"
                    :key="`flag-${flag}`"
                    color="error"
                  >
                    {{ flag }}
                  </Tag>
                  <Tag
                    v-for="path in getCollectionSourcePaths(
                      serverInfo.collectionQuality,
                    )"
                    :key="`path-${path.label}`"
                    :color="path.hit > 0 ? 'processing' : 'default'"
                  >
                    {{ path.label }} {{ path.hit }}/{{ path.total }}
                  </Tag>
                </div>
              </div>

              <!-- 告警信息卡片 -->
              <div class="rounded-lg border p-3">
                <div class="mb-2 text-sm font-medium">告警信息</div>
                <div class="grid grid-cols-3 gap-3">
                  <div class="flex items-center gap-2 rounded-lg border p-3">
                    <ExclamationCircleFilled class="critical-color text-2xl" />
                    <div>
                      <div class="mb-1 text-sm font-medium">紧急告警</div>
                      <div class="critical-color text-lg font-semibold">
                        {{ serverInfo?.alerts?.critical || 0 }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 rounded-lg border p-3">
                    <ExclamationCircleFilled class="important-color text-2xl" />
                    <div>
                      <div class="mb-1 text-sm font-medium">重要告警</div>
                      <div class="important-color text-lg font-semibold">
                        {{ serverInfo?.alerts?.important || 0 }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 rounded-lg border p-3">
                    <ExclamationCircleFilled class="minor-color text-2xl" />
                    <div>
                      <div class="mb-1 text-sm font-medium">轻微告警</div>
                      <div class="minor-color text-lg font-semibold">
                        {{ serverInfo?.alerts?.minor || 0 }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 硬件概览 -->
              <div class="rounded-lg border p-3">
                <div class="mb-2 text-sm font-medium">硬件概览</div>
                <div class="grid grid-cols-3 gap-3">
                  <div class="rounded-lg border p-3">
                    <div class="mb-2 text-sm font-medium">处理器</div>
                    <div class="flex items-center gap-3">
                      <SvgCpuIcon class="h-8 w-8 text-blue-500" />
                      <div>
                        <div>总数: {{ serverInfo.cpu_total || 0 }}</div>
                        <div>在位: {{ serverInfo.cpu_installed || 0 }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-lg border p-3">
                    <div class="mb-2 text-sm font-medium">内存</div>
                    <div class="flex items-center gap-3">
                      <SvgMemoryIcon class="h-8 w-8 text-green-500" />
                      <div>
                        <div>总数: {{ serverInfo.memory_total || 0 }}</div>
                        <div>在位: {{ serverInfo.memory_installed || 0 }}</div>
                        <div>容量: {{ serverInfo.memory_capacity || 0 }}G</div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-lg border p-3">
                    <div class="mb-2 text-sm font-medium">存储</div>
                    <div class="flex items-center gap-3">
                      <SvgStorageIcon class="h-8 w-8 text-purple-500" />
                      <div>
                        <div>
                          RAID卡: {{ serverInfo.storage_raid_cards || 0 }}
                        </div>
                        <div>
                          逻辑盘:
                          {{ serverInfo.storage_logical_drives || 0 }}
                        </div>
                        <div>
                          物理盘:
                          {{ serverInfo.storage_physical_drives || 0 }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-lg border p-3">
                    <div class="mb-2 text-sm font-medium">网络适配器</div>
                    <div class="flex items-center gap-3">
                      <SvgNetworkIcon class="h-8 w-8 text-orange-500" />
                      <div>
                        <div>总数: {{ serverInfo.network_total || 0 }}</div>
                        <div>在位: {{ serverInfo.network_installed || 0 }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-lg border p-3">
                    <div class="mb-2 text-sm font-medium">板卡/背板</div>
                    <div class="flex items-center gap-3">
                      <SvgStorageIcon class="h-8 w-8 text-teal-500" />
                      <div>
                        <div>Riser: {{ serverInfo.riser_total || 0 }}</div>
                        <div>
                          硬盘背板:
                          {{ serverInfo.drive_backplane_total || 0 }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-lg border p-3">
                    <div class="mb-2 text-sm font-medium">电源</div>
                    <div class="flex items-center gap-3">
                      <SvgPowerIcon class="h-8 w-8 text-red-500" />
                      <div>
                        <div>总数: {{ serverInfo.power_total || 0 }}</div>
                        <div>在位: {{ serverInfo.power_installed || 0 }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-lg border p-3">
                    <div class="mb-2 text-sm font-medium">风扇</div>
                    <div class="flex items-center gap-3">
                      <SvgFanIcon class="h-8 w-8 text-cyan-500" />
                      <div>
                        <div>总数: {{ serverInfo.fan_total || 0 }}</div>
                        <div>在位: {{ serverInfo.fan_installed || 0 }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ATabPane>

          <ATabPane key="lifecycle">
            <template #tab>
              <ABadge
                :count="lifecycleUnreadCount"
                :overflow-count="99"
                :show-zero="false"
                size="small"
              >
                <span>变更记录</span>
              </ABadge>
            </template>

            <LifecycleGrid>
              <template #eventType="{ row }">
                <Tag size="small">
                  {{ getLifecycleEventTypeText(row.event_type) }}
                </Tag>
              </template>
              <template #lifecycleObject="{ row }">
                {{ getLifecycleObject(row) }}
              </template>
              <template #oldValue="{ row }">
                {{ formatLifecycleValue(row.old_value) }}
              </template>
              <template #newValue="{ row }">
                {{ formatLifecycleValue(row.new_value) }}
              </template>
            </LifecycleGrid>
          </ATabPane>
        </ATabs>
      </div>

      <HardFormDrawer />
    </ASpin>
  </Drawer>
</template>

<style scoped>
:deep(.critical-color) {
  color: #ff4d4f;
}

:deep(.important-color) {
  color: #faad14;
}

:deep(.minor-color) {
  color: #ffc53d;
}

:deep([data-theme='dark'] .critical-color) {
  color: #ff7875;
}

:deep([data-theme='dark'] .important-color) {
  color: #ffd666;
}

:deep([data-theme='dark'] .minor-color) {
  color: #fff1b8;
}
</style>
