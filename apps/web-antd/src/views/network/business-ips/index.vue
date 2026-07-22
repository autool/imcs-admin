<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { BusinessIPApi } from '#/api';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Tag, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteBusinessIP, getBusinessIPList } from '#/api';

import BusinessIPEdit from './business-ip-edit.vue';
import BusinessIPHistory from './business-ip-history.vue';
import BusinessIPView from './business-ip-view.vue';
import { useBusinessIPActions } from './data';

const [ViewDrawer, viewDrawerApi] = useVbenDrawer({
  connectedComponent: BusinessIPView,
});

const [EditModal, editModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: BusinessIPEdit,
});

const [HistoryDrawer, historyDrawerApi] = useVbenDrawer({
  connectedComponent: BusinessIPHistory,
});

const actions = useBusinessIPActions();

const ipTypeOptions = [
  { color: 'blue', label: '业务IP', value: 'business' },
  { color: 'green', label: '管理IP', value: 'management' },
  { color: 'cyan', label: '服务地址', value: 'service' },
  { color: 'orange', label: '存储IP', value: 'storage' },
  { color: 'geekblue', label: '交换机', value: 'switch' },
  { color: 'volcano', label: '防火墙', value: 'firewall' },
  { color: 'purple', label: '安全设备', value: 'security' },
  { color: 'magenta', label: '终端', value: 'terminal' },
  { color: 'default', label: '资产地址', value: 'asset' },
];

const statusOptions = [
  { color: 'success', label: '使用中', value: 'active' },
  { color: 'default', label: '未使用', value: 'inactive' },
  { color: 'warning', label: '预留', value: 'reserved' },
  { color: 'error', label: '异常', value: 'error' },
];

const displayLabels: Record<string, string> = {
  computer: '办公机',
  desktop: '办公机',
  firewall: '防火墙',
  laptop: '笔记本',
  notebook: '笔记本',
  pc: '办公机',
  server: '服务器',
  storage: '存储',
  switch: '交换机',
  terminal: '终端',
  waf: '防火墙',
};

function displayText(value?: string) {
  if (!value) return '-';
  return displayLabels[String(value).toLowerCase()] || value;
}

function getRowDisplayValue(
  row: BusinessIPApi.BusinessIP,
  column: { field?: string },
) {
  const field = column.field as keyof BusinessIPApi.BusinessIP | undefined;
  return field ? displayText(row[field] as string | undefined) : '-';
}

function getOptionMeta(
  options: Array<{ color: string; label: string; value: string }>,
  value?: string,
) {
  return options.find((item) => item.value === value);
}

function isManualRow(row: BusinessIPApi.BusinessIP) {
  return row.is_editable !== false && row.source_type === 'manual';
}

function getAddressSources(row: BusinessIPApi.BusinessIP) {
  return row.address_sources || [];
}

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'ip_address',
      label: 'IP地址',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: ipTypeOptions.map(({ label, value }) => ({ label, value })),
        placeholder: '请选择IP类型',
      },
      fieldName: 'ip_type',
      label: 'IP类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions.map(({ label, value }) => ({ label, value })),
        placeholder: '请选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Input',
      fieldName: 'network_segment',
      label: '网段',
    },
  ],
  showCollapseButton: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<BusinessIPApi.BusinessIP> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'ip_address',
  },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    { field: 'ip_address', title: 'IP地址', width: 150 },
    {
      field: 'address_source',
      title: '来源',
      minWidth: 170,
      slots: { default: 'address_source' },
    },
    {
      field: 'source_name',
      title: '关联对象',
      minWidth: 180,
      showOverflow: 'tooltip',
      slots: { default: 'source_name' },
    },
    { field: 'mac_address', title: 'MAC地址', width: 150 },
    {
      field: 'ip_type',
      title: 'IP类型',
      width: 110,
      slots: { default: 'ip_type' },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'network_segment', title: '网段', width: 150 },
    { field: 'vlan_id', title: 'VLAN ID', width: 100 },
    { field: 'vlan_group_name', title: 'VLAN分组', width: 130 },
    { field: 'gateway', title: '网关', width: 150 },
    { field: 'ip_person', title: '地址负责人', width: 120 },
    { field: 'server_ip', title: '服务器地址', width: 150 },
    {
      field: 'server_brand',
      title: '品牌/类型',
      width: 120,
      slots: { default: 'display_text' },
    },
    {
      field: 'server_model',
      title: '型号/分类',
      width: 150,
      slots: { default: 'display_text' },
    },
    { field: 'asset_person', title: '资产负责人', width: 120 },
    {
      field: 'is_fused',
      title: '口径',
      width: 100,
      slots: { default: 'fusion_scope' },
    },
    { field: 'created_at', title: '创建时间', width: 180 },
    { field: 'updated_at', title: '更新时间', width: 180 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 300,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const response = await getBusinessIPList({
            page: page.currentPage,
            pageSize: page.pageSize,
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
    export: actions.canExport,
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

function openViewDrawer(row: BusinessIPApi.BusinessIP) {
  viewDrawerApi.setData({ values: row });
  viewDrawerApi.open();
}

function openEditModal(row?: BusinessIPApi.BusinessIP) {
  if (row && !isManualRow(row)) {
    message.warning('融合地址来自源数据，只能在对应设备或资产中维护');
    return;
  }
  editModalApi.setData({ values: row || {} });
  editModalApi.open();
}

function openHistoryDrawer(row: BusinessIPApi.BusinessIP) {
  if (!isManualRow(row)) {
    message.warning('融合地址暂无手工台账历史');
    return;
  }
  historyDrawerApi.setData({ values: row });
  historyDrawerApi.open();
}

async function handleDelete(row: BusinessIPApi.BusinessIP) {
  if (!isManualRow(row)) {
    message.warning('融合地址来自源数据，不能在这里删除');
    return;
  }
  try {
    await deleteBusinessIP(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch (error) {
    // 错误会被 errorMessageResponseInterceptor 自动处理并显示
    console.error('删除失败:', error);
  }
}

function handleAddNew() {
  openEditModal();
}
</script>

<template>
  <Page auto-content-height>
    <ViewDrawer />
    <EditModal />
    <HistoryDrawer />
    <Grid>
      <template #toolbar-tools>
        <Button
          v-if="actions.canAdd"
          class="mr-2"
          type="primary"
          @click="handleAddNew()"
        >
          新增业务地址
        </Button>
      </template>
      <template #ip_type="{ row }">
        <Tag :color="getOptionMeta(ipTypeOptions, row.ip_type)?.color">
          {{ getOptionMeta(ipTypeOptions, row.ip_type)?.label || row.ip_type }}
        </Tag>
      </template>
      <template #status="{ row }">
        <Tag :color="getOptionMeta(statusOptions, row.status)?.color">
          {{ getOptionMeta(statusOptions, row.status)?.label || row.status }}
        </Tag>
      </template>
      <template #address_source="{ row }">
        <Tooltip
          v-if="getAddressSources(row).length > 1"
          :title="getAddressSources(row).join(' / ')"
        >
          <Tag color="processing">
            {{ getAddressSources(row).length }}个来源
          </Tag>
        </Tooltip>
        <Tag v-else color="default">{{ row.address_source || '-' }}</Tag>
      </template>
      <template #source_name="{ row }">
        <span>{{ displayText(row.source_name || row.usage_purpose) }}</span>
      </template>
      <template #display_text="{ row, column }">
        <span>{{ getRowDisplayValue(row, column) }}</span>
      </template>
      <template #fusion_scope="{ row }">
        <Tag v-if="row.is_fused" color="processing">融合</Tag>
        <Tag v-else color="success">手工</Tag>
      </template>
      <template #action="{ row }">
        <Button v-if="actions.canView" type="link" @click="openViewDrawer(row)">
          查看
        </Button>
        <Tooltip
          v-if="actions.canEdit"
          :title="isManualRow(row) ? '' : '请在对应设备或资产中维护源数据'"
        >
          <Button
            :disabled="!isManualRow(row)"
            type="link"
            @click="openEditModal(row)"
          >
            编辑
          </Button>
        </Tooltip>
        <Button
          v-if="actions.canView"
          :disabled="!isManualRow(row)"
          type="link"
          @click="openHistoryDrawer(row)"
        >
          历史
        </Button>
        <Popconfirm
          v-if="actions.canDelete && isManualRow(row)"
          title="确定要删除这条业务地址吗？"
          @confirm="handleDelete(row)"
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>
        <Tooltip
          v-else-if="actions.canDelete"
          title="融合地址来自源数据，不能在这里删除"
        >
          <Button danger disabled type="link">删除</Button>
        </Tooltip>
      </template>
    </Grid>
  </Page>
</template>
