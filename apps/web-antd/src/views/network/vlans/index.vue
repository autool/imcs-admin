<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { VLANGroupApi } from '#/api/network/vlan-groups/index';
import type { VLANApi } from '#/api/network/vlans';
import type { RegionApi } from '#/api/system/regions/index';

import { onMounted, ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAllVLANGroups } from '#/api/network/vlan-groups/index';
import { deleteVLAN, getVLANList } from '#/api/network/vlans';
import { getAllRegions } from '#/api/system/regions/index';

import { useVLANActions } from './data';
import VLANEdit from './vlan-edit.vue';
import VLANHistory from './vlan-history.vue';
import VLANView from './vlan-view.vue';

const regions = ref<RegionApi.Region[]>([]);
const vlanGroups = ref<VLANGroupApi.VLANGroup[]>([]);

const actions = useVLANActions();

// 加载区域和分组数据
const loadOptions = async () => {
  try {
    const regionResponse = await getAllRegions();
    regions.value = regionResponse.list || [];

    const groupResponse = await getAllVLANGroups();
    vlanGroups.value = groupResponse || [];
  } catch (error) {
    console.error('加载选项失败:', error);
  }
};

onMounted(() => {
  loadOptions();
});

const [ViewDrawer, viewDrawerApi] = useVbenDrawer({
  connectedComponent: VLANView,
});

const [EditModal, editModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: VLANEdit,
});

const [HistoryDrawer, historyDrawerApi] = useVbenDrawer({
  connectedComponent: VLANHistory,
});

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  schema: [
    {
      component: 'Input',
      fieldName: 'vlan_id',
      label: 'VLAN ID',
    },
    {
      component: 'Input',
      fieldName: 'vlan_name',
      label: 'VLAN名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择区域',
        fieldNames: {
          label: 'region_name',
          value: 'region_id',
        },
      },
      fieldName: 'region_id',
      label: '区域',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择分组',
        fieldNames: {
          label: 'group_name',
          value: 'id',
        },
      },
      fieldName: 'group_id',
      label: '分组',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: 'active' },
          { label: '停用', value: 'inactive' },
        ],
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

const gridOptions: VxeGridProps<VLANApi.VLAN> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'vlan_name',
  },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    { field: 'vlan_id', title: 'VLAN ID', width: 100 },
    { field: 'vlan_name', title: 'VLAN名称', width: 150 },
    { field: 'network_segment', title: '网段', width: 150 },
    { field: 'gateway', title: '网关', width: 150 },
    { field: 'subnet_mask', title: '子网掩码', width: 130 },
    { field: 'region_name', title: '区域', width: 100 },
    { field: 'group_name', title: '分组', width: 120 },
    { field: 'ip_count', title: '使用IP数', width: 100 },
    {
      field: 'status',
      title: '状态',
      width: 80,
      slots: { default: 'status' },
    },
    { field: 'description', title: '描述', width: 180 },
    { field: 'created_at', title: '创建时间', width: 160 },
    { field: 'updated_at', title: '更新时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 280,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const response = await getVLANList({
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

function openViewDrawer(row: VLANApi.VLAN) {
  viewDrawerApi.setData({ values: row });
  viewDrawerApi.open();
}

function openEditModal(row?: VLANApi.VLAN) {
  editModalApi.setData({ values: row || {} });
  editModalApi.open();
}

function openHistoryDrawer(row: VLANApi.VLAN) {
  historyDrawerApi.setData({ values: row });
  historyDrawerApi.open();
}

async function handleDelete(row: VLANApi.VLAN) {
  try {
    await deleteVLAN(row.id);
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

// 监听选项加载完成后更新表单
onMounted(() => {
  // 选项已在loadOptions函数中加载
});
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
          新增VLAN
        </Button>
      </template>
      <template #status="{ row }">
        <Tag v-if="row.status === 'active'" color="success">启用</Tag>
        <Tag v-else-if="row.status === 'inactive'" color="default">停用</Tag>
        <Tag v-else>{{ row.status }}</Tag>
      </template>
      <template #action="{ row }">
        <Button v-if="actions.canView" type="link" @click="openViewDrawer(row)">
          查看
        </Button>
        <Button v-if="actions.canEdit" type="link" @click="openEditModal(row)">
          编辑
        </Button>
        <Button
          v-if="actions.canView"
          type="link"
          @click="openHistoryDrawer(row)"
        >
          历史
        </Button>
        <Popconfirm
          v-if="actions.canDelete"
          title="确定要删除这个VLAN吗？"
          @confirm="handleDelete(row)"
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      </template>
    </Grid>
  </Page>
</template>
