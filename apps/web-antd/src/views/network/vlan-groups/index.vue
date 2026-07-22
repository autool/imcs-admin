<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { VLANGroupApi } from '#/api/network/vlan-groups';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteVLANGroup, getVLANGroupList } from '#/api/network/vlan-groups';

import { useVLANGroupActions } from './data';
import VLANGroupEdit from './vlan-group-edit.vue';

const [EditModal, editModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: VLANGroupEdit,
});

const actions = useVLANGroupActions();

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  schema: [
    {
      component: 'Input',
      fieldName: 'group_name',
      label: '分组名称',
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
  ],
  showCollapseButton: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<VLANGroupApi.VLANGroup> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'group_name',
  },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    { field: 'group_name', title: '分组名称', width: 180, fixed: 'left' },
    {
      field: 'status',
      title: '状态',
      width: 80,
      slots: { default: 'status' },
    },
    { field: 'vlan_count', title: 'VLAN总数', width: 100 },
    {
      field: 'active_vlan_count',
      title: '启用VLAN',
      width: 100,
      slots: { default: 'activeVlanCount' },
    },
    {
      field: 'inactive_vlan_count',
      title: '停用VLAN',
      width: 100,
      slots: { default: 'inactiveVlanCount' },
    },
    {
      field: 'vlan_id_range',
      title: 'VLAN范围',
      width: 120,
      slots: { default: 'vlanRange' },
    },
    { field: 'network_segment_count', title: '网段数', width: 90 },
    {
      field: 'last_vlan_updated_at',
      title: '最近VLAN更新',
      width: 170,
    },
    { field: 'updated_at', title: '分组更新时间', width: 170 },
    {
      field: 'description',
      title: '描述',
      minWidth: 240,
      showOverflow: 'tooltip',
    },
    {
      field: 'action',
      title: '操作',
      width: 150,
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
          const response = await getVLANGroupList({
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

function openEditModal(row?: VLANGroupApi.VLANGroup) {
  if (row) {
    editModalApi.setData({ values: row });
  }
  editModalApi.open();
}

async function handleDelete(row: VLANGroupApi.VLANGroup) {
  try {
    await deleteVLANGroup(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch (error) {
    console.error('删除失败:', error);
  }
}

function handleAddNew() {
  editModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <EditModal />
    <Grid>
      <template #toolbar-tools>
        <Button
          v-if="actions.canAdd"
          class="mr-2"
          type="primary"
          @click="handleAddNew()"
        >
          新增分组
        </Button>
      </template>
      <template #status="{ row }">
        <Tag v-if="row.status === 'active'" color="success">启用</Tag>
        <Tag v-else-if="row.status === 'inactive'" color="default">停用</Tag>
        <Tag v-else>{{ row.status }}</Tag>
      </template>
      <template #activeVlanCount="{ row }">
        <Tag color="success">{{ row.active_vlan_count || 0 }}</Tag>
      </template>
      <template #inactiveVlanCount="{ row }">
        <Tag color="default">{{ row.inactive_vlan_count || 0 }}</Tag>
      </template>
      <template #vlanRange="{ row }">
        <span>{{ row.vlan_id_range || '-' }}</span>
      </template>
      <template #action="{ row }">
        <Button v-if="actions.canEdit" type="link" @click="openEditModal(row)">
          编辑
        </Button>
        <Popconfirm
          v-if="actions.canDelete"
          title="确定要删除这个分组吗？"
          @confirm="handleDelete(row)"
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      </template>
    </Grid>
  </Page>
</template>
