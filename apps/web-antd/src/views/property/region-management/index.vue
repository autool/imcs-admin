<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { RegionManagementApi } from '#/api/assets/region-management';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRegion,
  getRegionList,
  lockRegion,
  unlockRegion,
} from '#/api/assets/region-management';

import { useRegionManagementActions } from './data';
import RegionDetail from './modules/detail.vue';
import RegionForm from './modules/form.vue';

const actions = useRegionManagementActions();

const [EditModal, editModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: RegionForm,
});

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: RegionDetail,
});

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4',
  schema: [
    {
      component: 'Input',
      fieldName: 'region_name',
      label: '区域名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '办公场所', value: 'office' },
          { label: '机房', value: 'datacenter' },
          { label: '其他', value: 'other' },
        ],
        placeholder: '请选择区域类型',
      },
      fieldName: 'region_type',
      label: '区域类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '正常', value: 'normal' },
          { label: '锁定', value: 'locked' },
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

const gridOptions: VxeGridProps<RegionManagementApi.Region> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    { field: 'region_name', title: '区域名称', width: 200 },
    {
      field: 'region_type',
      title: '区域类型',
      width: 120,
      slots: { default: 'region_type' },
    },
    { field: 'location', title: '位置', width: 250 },
    { field: 'parent_region', title: '上级区域', width: 150 },
    { field: 'asset_count', title: '资产数量', width: 100 },
    { field: 'responsible_person', title: '负责人', width: 120 },
    { field: 'contact', title: '联系方式', width: 150 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'description', title: '描述', width: 250 },
    { field: 'created_at', title: '创建时间', width: 180 },
    { field: 'updated_at', title: '更新时间', width: 180 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 280,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const response = await getRegionList({
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

function handleAddNew() {
  editModalApi.setState({ title: '新增区域' });
  editModalApi.setData(undefined);
  editModalApi.open();
}

function handleEdit(row: RegionManagementApi.Region) {
  editModalApi.setState({ title: '编辑区域' });
  editModalApi.setData(row);
  editModalApi.open();
}

function handleView(row: RegionManagementApi.Region) {
  detailDrawerApi.setState({ title: '区域详情' });
  detailDrawerApi.setData(row);
  detailDrawerApi.open();
}

async function handleDelete(row: RegionManagementApi.Region) {
  try {
    await deleteRegion(row.region_id);
    message.success('删除成功');
    gridApi.reload();
  } catch (error) {
    console.error('删除失败:', error);
  }
}

async function handleLock(row: RegionManagementApi.Region) {
  try {
    await lockRegion(row.region_id);
    message.success('锁定成功');
    gridApi.reload();
  } catch (error) {
    console.error('锁定失败:', error);
  }
}

async function handleUnlock(row: RegionManagementApi.Region) {
  try {
    await unlockRegion(row.region_id);
    message.success('解锁成功');
    gridApi.reload();
  } catch (error) {
    console.error('解锁失败:', error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <EditModal />
    <DetailDrawer />
    <Grid>
      <template #toolbar-tools>
        <Button
          v-if="actions.canAdd"
          class="mr-2"
          type="primary"
          @click="handleAddNew()"
        >
          新增区域
        </Button>
      </template>
      <template #region_type="{ row }">
        <Tag v-if="row.region_type === 'office'" color="blue">办公场所</Tag>
        <Tag v-else-if="row.region_type === 'datacenter'" color="green">
          机房
        </Tag>
        <Tag v-else-if="row.region_type === 'other'" color="default">其他</Tag>
        <Tag v-else>{{ row.region_type }}</Tag>
      </template>
      <template #status="{ row }">
        <Tag v-if="row.status === 'normal'" color="success">正常</Tag>
        <Tag v-else-if="row.status === 'locked'" color="error">锁定</Tag>
        <Tag v-else>{{ row.status }}</Tag>
      </template>
      <template #action="{ row }">
        <Button v-if="actions.canView" type="link" @click="handleView(row)">
          查看
        </Button>
        <Button v-if="actions.canEdit" type="link" @click="handleEdit(row)">
          编辑
        </Button>
        <Button
          v-if="row.status === 'normal' && actions.canLock"
          type="link"
          @click="handleLock(row)"
        >
          锁定
        </Button>
        <Button
          v-if="row.status === 'locked' && actions.canUnlock"
          type="link"
          @click="handleUnlock(row)"
        >
          解锁
        </Button>
        <Popconfirm
          v-if="actions.canDelete"
          title="确定要删除这个区域吗？"
          @confirm="handleDelete(row)"
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      </template>
    </Grid>
  </Page>
</template>
