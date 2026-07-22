<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { InfraAsset } from '#/api/infra';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, message, Modal, Switch, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteInfraAssetApi,
  getBrandOptionsApi,
  getInfraAssetsListApi,
  getModelOptionsApi,
} from '#/api';
import { loadSystemUserOptions } from '#/utils/system-user-options';

import InfraEdit from './infra-edit.vue';
import InfraView from './infra-view.vue';
import tagAdd from './tag-add.vue';

const [ViewDrawer, viewDrawerApi] = useVbenDrawer({
  connectedComponent: InfraView,
});

const [EditModal, editModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: InfraEdit,
});

const [AssetAddModal, assetAddModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: tagAdd,
});

const { hasAccessByCodes } = useAccess();
const canDeleteAsset = hasAccessByCodes(['property_infra:delete']);

const brandOptions = ref<Array<{ label: string; value: string }>>([]);
const modelOptions = ref<Array<{ label: string; value: string }>>([]);
const userOptions = ref<Array<{ label: string; value: string }>>([]);

function normalizeOptions(response: any) {
  const items = Array.isArray(response) ? response : response?.items || [];
  return items.map((item: { label: string; value: string }) => ({
    label: item.label,
    value: item.value,
  }));
}

async function fetchBrandOptions() {
  try {
    const response = await getBrandOptionsApi();
    brandOptions.value = normalizeOptions(response);
  } catch (error) {
    console.error('Error fetching server brand options:', error);
    brandOptions.value = [];
  }
}

async function fetchModelOptions(brandId: string) {
  try {
    const response = await getModelOptionsApi({ brand_id: brandId });
    modelOptions.value = normalizeOptions(response);
  } catch (error) {
    console.error('Error fetching server model options:', error);
    modelOptions.value = [];
  }
}

async function loadUsers() {
  try {
    const response = await loadSystemUserOptions({ include_disabled: true });
    userOptions.value = response.options;
    gridApi.formApi.updateSchema([
      {
        componentProps: {
          options: userOptions.value,
        },
        fieldName: 'asset_user_id',
      },
    ]);
  } catch (error) {
    console.error('Error fetching user options:', error);
    userOptions.value = [];
  }
}

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'ip_address',
      label: 'IP地址',
    },
    {
      component: 'Input',
      fieldName: 'tag_number',
      label: '资产号',
    },
    {
      component: 'Select',
      componentProps: (_, formApi) => ({
        allowClear: true,
        filterOption: true,
        options: brandOptions.value,
        placeholder: '请选择品牌',
        showSearch: true,
        onChange: async (value?: string) => {
          formApi.setFieldValue('models_id', undefined);
          modelOptions.value = [];
          if (value) {
            await fetchModelOptions(value);
          }
        },
      }),
      fieldName: 'brand_id',
      label: '品牌',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: modelOptions,
        placeholder: '请选择型号',
        showSearch: true,
      },
      dependencies: {
        disabled: (values) => !values.brand_id,
        triggerFields: ['brand_id'],
      },
      fieldName: 'models_id',
      label: '型号',
    },
    {
      component: 'Input',
      fieldName: 'sn_number',
      label: '序列号',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: userOptions.value,
        placeholder: '请选择责任人',
        showSearch: true,
      },
      fieldName: 'asset_user_id',
      label: '责任人',
    },
  ],
  showCollapseButton: false,
  submitOnChange: true,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<InfraAsset> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    { field: 'ip_address', title: 'IP地址', width: 150 },
    {
      field: 'brand_name',
      slots: { default: 'brand_name' },
      title: '品牌',
      align: 'center',
      width: 80,
    },
    { field: 'model_name', title: '型号', width: 150 },
    { field: 'serial_number', title: '序列号', width: 200 },
    { field: 'tag_number', title: '资产号', width: 150 },
    { field: 'loc', title: '资产位置', width: 200 },
    { field: 'uPosition', title: 'U位', width: 80 },
    { field: 'asset_person', title: '责任人', width: 200 },
    {
      field: 'purchase_date',
      formatter: ({ cellValue }) => cellValue || '-',
      title: '采购日期',
      width: 200,
    },
    {
      field: 'created_at',
      formatter: 'formatDateTime',
      sortable: true,
      title: '添加日期',
      width: 200,
    },
    { field: 'info', title: '备注', width: 150 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 240,
    },
  ],
  editConfig: {
    mode: 'row',
    trigger: 'click',
  },
  exportConfig: {},
  importConfig: {},
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }, formValues) => {
        try {
          const params = {
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          if (sort?.field === 'created_at' && sort?.order) {
            Object.assign(params, {
              sort_field: sort.field,
              sort_order: sort.order,
            });
          }
          const response = await getInfraAssetsListApi(params);
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
    import: true,
    refresh: true,
    zoom: true,
  },
  rowConfig: {
    isHover: true,
  },
  sortConfig: {
    defaultSort: { field: 'created_at', order: 'desc' },
    multiple: false,
    remote: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  formOptions,
});

onMounted(() => {
  fetchBrandOptions();
  loadUsers();
});

function refreshGrid() {
  gridApi.query();
}

function handleAssetAddSuccess(payload?: { collectSubmitted?: boolean }) {
  refreshGrid();
  if (payload?.collectSubmitted) {
    window.setTimeout(refreshGrid, 3000);
    window.setTimeout(refreshGrid, 8000);
  }
}

function openViewDrawer(row: InfraAsset) {
  // 需要传递完整的数据，包括cabinet_id用于加载机柜服务器
  const viewData = {
    ...row,
    server_id: row.product_id || row.id, // 使用product_id作为server_id
  };
  viewDrawerApi.setData({ values: viewData });
  viewDrawerApi.open();
}

function openEditModal(row: InfraAsset) {
  // 需要传递server_id用于更新资产位置
  const editData = {
    ...row,
    server_id: row.product_id || row.id, // 使用product_id作为server_id
  };
  editModalApi.setData({ values: editData });
  editModalApi.open();
}

function openAssetAddModal() {
  assetAddModalApi.open();
}

function handleDeleteAsset(row: InfraAsset) {
  if (!canDeleteAsset) {
    message.warning('无权限删除资产');
    return;
  }
  Modal.confirm({
    centered: true,
    content: `确认删除资产「${row.tag_number || row.ip_address || row.id}」吗？删除后不可恢复。`,
    okButtonProps: { danger: true },
    okText: '删除',
    title: '删除资产',
    async onOk() {
      await deleteInfraAssetApi(row.id);
      message.success('删除成功');
      refreshGrid();
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <ViewDrawer />
    <EditModal @success="refreshGrid" />
    <AssetAddModal @success="handleAssetAddSuccess" />
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="['property_infra:add']"
          class="mr-2"
          type="primary"
          @click="openAssetAddModal()"
        >
          添加资产
        </Button>
      </template>
      <template #brand_name="{ row }">
        <div class="brand-logo-frame">
          <img
            :alt="row.brand_name"
            class="brand-logo-image"
            :src="row.brand_icon || '/assets/brand/default.png'"
          />
        </div>
      </template>
      <template #open="{ row }">
        <Switch v-model:checked="row.open" />
      </template>
      <template #status="{ row }">
        <Tag :color="row.color">{{ row.status }}</Tag>
      </template>
      <template #action="{ row }">
        <Button
          v-access:code="['property_infra:edit']"
          type="link"
          @click="openEditModal(row)"
        >
          编辑
        </Button>
        <Button
          v-access:code="['property_infra:view']"
          type="link"
          @click="openViewDrawer(row)"
        >
          查看
        </Button>
        <Button
          v-access:code="['property_infra:delete']"
          danger
          type="link"
          @click="handleDeleteAsset(row)"
        >
          删除
        </Button>
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
.brand-logo-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 24px;
  padding: 2px 4px;
  overflow: hidden;
  line-height: 1;
  vertical-align: middle;
  background: rgb(148 163 184 / 14%);
  border: 1px solid rgb(148 163 184 / 20%);
  border-radius: 4px;
}

.brand-logo-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
