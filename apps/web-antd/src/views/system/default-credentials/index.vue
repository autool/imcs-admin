<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DefaultCredentialApi } from '#/api/system/default-credentials';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  backfillDefaultCredentials,
  deleteDefaultCredential,
  getDefaultCredentialList,
} from '#/api/system/default-credentials';

import Form from './modules/form.vue';
import { deviceTypeOptions, getVendorLabel } from './options';

defineOptions({ name: 'SystemDefaultCredentials' });

const deviceTypeMap: Record<string, { color: string; text: string }> = {
  device: { color: 'default', text: '通用设备' },
  server: { color: 'blue', text: '服务器' },
  switch: { color: 'green', text: '交换机' },
};

const scopeMap: Record<string, { color: string; text: string }> = {
  global: { color: 'blue', text: '全局通用' },
  instance: { color: 'orange', text: '实例专属' },
  vendor: { color: 'purple', text: '厂商/平台通用' },
};

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});
const { hasAccessByCodes } = useAccess();
const canAddCredential = hasAccessByCodes(['system_default_credentials:add']);
const canDeleteCredential = hasAccessByCodes([
  'system_default_credentials:delete',
]);
const canEditCredential = hasAccessByCodes(['system_default_credentials:edit']);

const formSchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: deviceTypeOptions,
      placeholder: '设备类型',
    },
    fieldName: 'device_type',
    label: '设备类型',
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: '搜索名称 / 用户名 / 协议',
    },
    fieldName: 'keyword',
    label: '关键词',
  },
];

const columns: VxeTableGridOptions<DefaultCredentialApi.DefaultCredential>['columns'] =
  [
    { title: '序号', type: 'seq', width: 60, fixed: 'left' },
    {
      field: 'name',
      fixed: 'left',
      minWidth: 200,
      showOverflow: 'tooltip',
      title: '凭证名称',
    },
    {
      field: 'device_type',
      slots: { default: 'deviceType' },
      title: '设备类型',
      width: 110,
    },
    { field: 'protocol', title: '协议', width: 90 },
    {
      field: 'credential_scope',
      slots: { default: 'scope' },
      title: '作用域',
      width: 130,
    },
    {
      field: 'vendor_key',
      slots: { default: 'vendor' },
      title: '厂商/平台',
      width: 150,
    },
    {
      field: 'target_ip',
      showOverflow: 'tooltip',
      title: '目标IP/地址',
      width: 150,
    },
    {
      field: 'target_device_id',
      showOverflow: 'tooltip',
      title: '绑定设备ID',
      width: 150,
    },
    {
      field: 'username',
      showOverflow: 'tooltip',
      title: '用户名',
      width: 140,
    },
    {
      field: 'is_default',
      slots: { default: 'defaultFlag' },
      title: '默认',
      width: 80,
    },
    {
      field: 'is_enabled',
      slots: { default: 'enabled' },
      title: '状态',
      width: 80,
    },
    {
      field: 'updated_at',
      formatter: 'formatDateTime',
      title: '更新时间',
      width: 170,
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 180,
      showOverflow: 'tooltip',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 150,
    },
  ];

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema,
    submitOnChange: true,
  },
  gridOptions: {
    columns,
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDefaultCredentialList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    stripe: true,
    toolbarConfig: {
      custom: true,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<DefaultCredentialApi.DefaultCredential>,
});

function onCreate() {
  if (!canAddCredential) {
    message.warning('无权限新增默认凭证');
    return;
  }
  formDrawerApi.setData({}).open();
}

async function onBackfill() {
  if (!canAddCredential) {
    message.warning('无权限同步现有凭证');
    return;
  }
  const hide = message.loading({
    content: '正在同步现有凭证...',
    duration: 0,
    key: 'backfill_default_credentials',
  });
  try {
    const result = await backfillDefaultCredentials();
    message.success({
      content: `同步完成，新增 ${result.created_count || 0} 条`,
      key: 'backfill_default_credentials',
    });
    gridApi.query();
  } catch (error: any) {
    hide();
    message.error(error?.message || '同步失败');
  }
}

function onEdit(row: DefaultCredentialApi.DefaultCredential) {
  if (!canEditCredential) {
    message.warning('无权限编辑默认凭证');
    return;
  }
  formDrawerApi.setData(row).open();
}

function onDelete(row: DefaultCredentialApi.DefaultCredential) {
  if (!canDeleteCredential) {
    message.warning('无权限删除默认凭证');
    return;
  }
  Modal.confirm({
    cancelText: '取消',
    content: `确定删除凭证「${row.name}」吗？`,
    okText: '删除',
    okType: 'danger',
    title: '删除凭证',
    async onOk() {
      try {
        await deleteDefaultCredential(row.id);
        message.success('删除成功');
        gridApi.query();
      } catch (error: any) {
        message.error(error?.message || '删除失败');
      }
    },
  });
}

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid table-title="默认凭证">
      <template #toolbar-tools>
        <Button
          v-access:code="['system_default_credentials:add']"
          @click="onBackfill"
        >
          同步现有凭证
        </Button>
        <Button
          v-access:code="['system_default_credentials:add']"
          type="primary"
          @click="onCreate"
        >
          <Plus class="size-5" />
          新增凭证
        </Button>
      </template>

      <template #deviceType="{ row }">
        <Tag :color="deviceTypeMap[row.device_type]?.color || 'default'">
          {{ deviceTypeMap[row.device_type]?.text || row.device_type }}
        </Tag>
      </template>

      <template #enabled="{ row }">
        <Tag :color="row.is_enabled ? 'success' : 'default'">
          {{ row.is_enabled ? '启用' : '禁用' }}
        </Tag>
      </template>

      <template #scope="{ row }">
        <Tag :color="scopeMap[row.credential_scope]?.color || 'default'">
          {{ scopeMap[row.credential_scope]?.text || row.credential_scope }}
        </Tag>
      </template>

      <template #vendor="{ row }">
        <span>{{ getVendorLabel(row.device_type, row.vendor_key) }}</span>
      </template>

      <template #defaultFlag="{ row }">
        <Tag v-if="row.is_default" color="processing">默认</Tag>
        <span v-else>-</span>
      </template>

      <template #action="{ row }">
        <Button
          v-access:code="['system_default_credentials:edit']"
          size="small"
          type="link"
          @click="onEdit(row)"
        >
          编辑
        </Button>
        <Button
          v-access:code="['system_default_credentials:delete']"
          danger
          size="small"
          type="link"
          @click="onDelete(row)"
        >
          删除
        </Button>
      </template>
    </Grid>
  </Page>
</template>
