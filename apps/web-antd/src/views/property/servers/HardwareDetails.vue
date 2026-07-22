<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { ServerDetailResponse } from '@vben/types';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import {
  MdiCardBulleted,
  MdiCpu,
  MdiFan,
  MdiHarddisk,
  MdiMemory,
  MdiPowerPlug,
  MdiRaid,
} from '@vben/icons';

import {
  Empty as AEmpty,
  Table as ATable,
  TabPane as ATabPane,
  Tabs as ATabs,
} from 'ant-design-vue';

// 定义接收的 props
const data = ref({
  info: {} as Partial<ServerDetailResponse>,
});

// 添加抽屉控制逻辑
const [Drawer, drawerApi] = useVbenDrawer({
  title: '硬件详情',
  closable: true,
  cancelText: '关闭',
  showCancelButton: false,
  showConfirmButton: false,
  confirmText: '关闭',
  onCancel() {
    drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const drawerData = drawerApi.getData<Record<string, any>>();
    data.value = { info: drawerData?.values || {} };
  },
});

const activeTab = ref('cpu');

const tableProps = {
  pagination: { pageSize: 20, showSizeChanger: false, size: 'small' },
  size: 'small',
} as const;

function resolveHardwareRowKey(record: Record<string, any>) {
  const stableValue =
    record.id ??
    record.serialNumber ??
    record.partNumber ??
    record.slot ??
    record.location ??
    record.name ??
    record.model ??
    JSON.stringify(record);
  return String(stableValue);
}

function resolveStatusColor(status: unknown) {
  const value = String(status || '').toLowerCase();
  const isOk = ['ok', 'enabled', 'present', 'on', 'healthy'].some((key) =>
    value.includes(key),
  );
  const isWarn = ['warning', 'degraded', 'non_critical'].some((key) =>
    value.includes(key),
  );
  if (isOk) return '#52c41a';
  if (isWarn) return '#faad14';
  return '#ff4d4f';
}

function resolveWearRateCell(record: Record<string, any>) {
  if (record.mediaType === 'HDD') {
    return {
      style: { color: '#999' },
      text: 'N/A',
    };
  }

  const value = record.wearRate;
  if (value === null || value === undefined) {
    return { style: undefined, text: '未读取' };
  }

  const rate = Number(value);
  if (Number.isNaN(rate)) {
    return { style: undefined, text: '未读取' };
  }

  let color = 'red';
  if (rate >= 80) color = '#52c41a';
  else if (rate >= 50) color = '#faad14';
  else if (rate >= 20) color = 'orange';

  return {
    style: { color, fontWeight: 500 },
    text: `${rate}%`,
  };
}

const sequenceColumn: TableColumnsType[number] = {
  title: '序号',
  width: 50,
  align: 'center',
  customRender: ({ index }: { index: number }) => index + 1,
};

const statusColumn: TableColumnsType[number] = {
  title: '状态',
  dataIndex: 'status',
  width: 80,
  align: 'center',
  customCell: (record: Record<string, any>) => ({
    style: { color: resolveStatusColor(record.status) },
  }),
  customRender: ({ text }: { text: any }) => text || '未知',
};

const commonColumns: TableColumnsType = [sequenceColumn, statusColumn];

const cpuColumns: TableColumnsType = [
  ...commonColumns,
  { title: '插槽', dataIndex: 'slot', width: 80, align: 'center' },
  { title: '型号', dataIndex: 'model', minWidth: 180 },
  { title: '频率(MHz)', dataIndex: 'frequency', width: 100, align: 'center' },
  { title: '核心数', dataIndex: 'cores', width: 80, align: 'center' },
  { title: '线程数', dataIndex: 'threads', width: 80, align: 'center' },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '序列号', dataIndex: 'serialNumber', width: 120 },
];

const memoryColumns: TableColumnsType = [
  ...commonColumns,
  { title: '插槽', dataIndex: 'slot', width: 80, align: 'center' },
  { title: '容量(GB)', dataIndex: 'capacity', width: 90, align: 'center' },
  { title: '频率(MHz)', dataIndex: 'frequency', width: 100, align: 'center' },
  { title: '类型', dataIndex: 'model', width: 100 },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '部件号', dataIndex: 'partNumber', width: 150 },
  { title: '序列号', dataIndex: 'serialNumber', width: 120 },
];

const diskColumns: TableColumnsType = [
  ...commonColumns,
  { title: '插槽', dataIndex: 'slot', width: 80, align: 'center' },
  { title: '型号', dataIndex: 'model', width: 180 },
  { title: '容量(GB)', dataIndex: 'capacity', width: 90, align: 'center' },
  {
    title: '剩余寿命(%)',
    dataIndex: 'wearRate',
    width: 100,
    align: 'center',
    customCell: (record: Record<string, any>) => ({
      style: resolveWearRateCell(record).style,
    }),
    customRender: ({ record }: { record: any }) =>
      resolveWearRateCell(record).text,
  },
  { title: '接口', dataIndex: 'interface', width: 80, align: 'center' },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '介质类型', dataIndex: 'mediaType', width: 90, align: 'center' },
  { title: '部件号', dataIndex: 'partNumber', width: 120 },
  { title: '序列号', dataIndex: 'serialNumber', width: 120 },
];

const fanColumns: TableColumnsType = [
  ...commonColumns,
  { title: '位置', dataIndex: 'location', width: 120 },
  { title: '转速(RPM)', dataIndex: 'speed', width: 100, align: 'center' },
  { title: '型号', dataIndex: 'model', width: 150 },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '序列号', dataIndex: 'serialNumber', width: 120 },
];

const powerColumns: TableColumnsType = [
  ...commonColumns,
  { title: '名称', dataIndex: 'name', width: 120 },
  { title: '型号', dataIndex: 'model', width: 150 },
  { title: '额定功率(W)', dataIndex: 'capacity', width: 110, align: 'center' },
  { title: '效率', dataIndex: 'efficiency', width: 80, align: 'center' },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '序列号', dataIndex: 'serialNumber', width: 140 },
];

const raidColumns: TableColumnsType = [
  ...commonColumns,
  { title: '控制器', dataIndex: 'controller', width: 120 },
  { title: '型号', dataIndex: 'model', width: 120 },
  { title: '固件版本', dataIndex: 'firmware', width: 120 },
  { title: '位置', dataIndex: 'location', width: 100, align: 'center' },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '序列号', dataIndex: 'serialNumber', width: 120 },
];

const hbaColumns: TableColumnsType = [
  ...commonColumns,
  { title: '插槽', dataIndex: 'slot', width: 80, align: 'center' },
  { title: '型号', dataIndex: 'model', width: 180 },
  { title: '端口数', dataIndex: 'ports', width: 80, align: 'center' },
  { title: 'MAC地址', dataIndex: 'macAddress', width: 150 },
  { title: 'IP地址', dataIndex: 'ipAddress', width: 130 },
  { title: '速率(Mbps)', dataIndex: 'speed', width: 100, align: 'center' },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '固件版本', dataIndex: 'firmware', width: 120 },
  { title: '部件号', dataIndex: 'partNumber', width: 140 },
  { title: '序列号', dataIndex: 'serialNumber', width: 140 },
];

const riserColumns: TableColumnsType = [
  ...commonColumns,
  { title: '名称', dataIndex: 'name', width: 140 },
  { title: '插槽', dataIndex: 'slot', width: 100, align: 'center' },
  { title: '型号', dataIndex: 'model', width: 160 },
  { title: '类型', dataIndex: 'type', width: 100, align: 'center' },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '固件版本', dataIndex: 'firmware', width: 120 },
  { title: 'PCB版本', dataIndex: 'pcbVersion', width: 100 },
  { title: '板卡ID', dataIndex: 'boardId', width: 120 },
  { title: '部件号', dataIndex: 'partNumber', width: 140 },
  { title: '序列号', dataIndex: 'serialNumber', width: 140 },
];

const driveBackplaneColumns: TableColumnsType = [
  ...commonColumns,
  { title: '名称', dataIndex: 'name', width: 150 },
  { title: '位置', dataIndex: 'location', width: 100, align: 'center' },
  { title: '编号', dataIndex: 'number', width: 80, align: 'center' },
  { title: '型号', dataIndex: 'model', width: 160 },
  { title: '类型', dataIndex: 'type', width: 100, align: 'center' },
  { title: '厂商', dataIndex: 'manufacturer', width: 120 },
  { title: '固件版本', dataIndex: 'firmware', width: 120 },
  { title: 'CPLD版本', dataIndex: 'cpldVersion', width: 100 },
  { title: 'PCB版本', dataIndex: 'pcbVersion', width: 100 },
  { title: '板卡ID', dataIndex: 'boardId', width: 120 },
  { title: '部件号', dataIndex: 'partNumber', width: 140 },
  { title: '序列号', dataIndex: 'serialNumber', width: 140 },
];

type HardwareDataSource = keyof Pick<
  ServerDetailResponse,
  | 'cpuList'
  | 'diskList'
  | 'driveBackplaneList'
  | 'fanList'
  | 'hbaList'
  | 'memoryList'
  | 'powerList'
  | 'raidList'
  | 'riserList'
>;

const iconComponents = {
  MdiCardBulleted,
  MdiCpu,
  MdiFan,
  MdiHarddisk,
  MdiMemory,
  MdiPowerPlug,
  MdiRaid,
} as const;

const hardwareTabs: Array<{
  color: string;
  columns: TableColumnsType;
  dataSource: HardwareDataSource;
  icon: keyof typeof iconComponents;
  key: string;
  label: string;
}> = [
  {
    key: 'cpu',
    label: 'CPU',
    icon: 'MdiCpu',
    color: 'blue',
    columns: cpuColumns,
    dataSource: 'cpuList',
  },
  {
    key: 'memory',
    label: '内存',
    icon: 'MdiMemory',
    color: 'green',
    columns: memoryColumns,
    dataSource: 'memoryList',
  },
  {
    key: 'disk',
    label: '硬盘',
    icon: 'MdiHarddisk',
    color: 'yellow',
    columns: diskColumns,
    dataSource: 'diskList',
  },
  {
    key: 'fan',
    label: '风扇',
    icon: 'MdiFan',
    color: 'purple',
    columns: fanColumns,
    dataSource: 'fanList',
  },
  {
    key: 'power',
    label: '电源',
    icon: 'MdiPowerPlug',
    color: 'red',
    columns: powerColumns,
    dataSource: 'powerList',
  },
  {
    key: 'raid',
    label: 'RAID',
    icon: 'MdiRaid',
    color: 'red',
    columns: raidColumns,
    dataSource: 'raidList',
  },
  {
    key: 'hba',
    label: 'PCI',
    icon: 'MdiCardBulleted',
    color: 'indigo',
    columns: hbaColumns,
    dataSource: 'hbaList',
  },
  {
    key: 'riser',
    label: 'Riser',
    icon: 'MdiCardBulleted',
    color: 'cyan',
    columns: riserColumns,
    dataSource: 'riserList',
  },
  {
    key: 'driveBackplane',
    label: '硬盘背板',
    icon: 'MdiCardBulleted',
    color: 'orange',
    columns: driveBackplaneColumns,
    dataSource: 'driveBackplaneList',
  },
];
</script>

<template>
  <Drawer class="hardware-detail-drawer w-3/5" title="硬件详情">
    <ATabs v-model:active-key="activeTab" type="card">
      <ATabPane v-for="tab in hardwareTabs" :key="tab.key">
        <template #tab>
          <div class="flex items-center gap-1">
            <component
              :is="iconComponents[tab.icon as keyof typeof iconComponents]"
              :class="`h-4 w-4 text-${tab.color}-500`"
            />
            {{ tab.label }}
            <span class="ml-1 text-xs text-gray-400">{{
              (data.info[tab.dataSource] || []).length
            }}</span>
          </div>
        </template>

        <ATable
          v-if="(data.info[tab.dataSource] || []).length > 0"
          class="hardware-detail-table"
          v-bind="tableProps"
          :columns="tab.columns"
          :data-source="data.info[tab.dataSource] || []"
          :row-key="resolveHardwareRowKey"
          :scroll="{ x: 'max-content' }"
        />
        <div v-else class="flex justify-center py-8">
          <AEmpty description="暂无数据" />
        </div>
      </ATabPane>
    </ATabs>
  </Drawer>
</template>

<style scoped>
.hardware-detail-drawer :deep(.ant-drawer-body) {
  padding-bottom: 16px;
}

.hardware-detail-table :deep(.ant-table-pagination) {
  margin: 12px 0 0;
}

.hardware-detail-table :deep(.ant-table-tbody > tr > td) {
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
