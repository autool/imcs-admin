<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TerminalBrandOption, TerminalModelOption } from '#/api/terminal';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Image, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTerminalBrandsApi, getTerminalModelsApi } from '#/api/terminal';
import { useTerminalAssetsStore } from '#/store';
import { loadSystemUserOptions } from '#/utils/system-user-options';

import createAdd from './create/index.vue';
import editAsset from './edit/index.vue';
import viewAsset from './view.vue';

const assetsStore = useTerminalAssetsStore();

// 品牌和型号选项
const brandOptions = ref<TerminalBrandOption[]>([]);
const modelOptions = ref<TerminalModelOption[]>([]);
const userOptions = ref<Array<{ label: string; value: string }>>([]);

// 获取品牌选项
async function fetchBrandOptions() {
  try {
    const response = await getTerminalBrandsApi();
    brandOptions.value = Array.isArray(response) ? response : [];
    gridApi.formApi.updateSchema([
      {
        componentProps: {
          options: brandOptions.value,
        },
        fieldName: 'brand_id',
      },
    ]);
  } catch (error) {
    console.error('Error fetching brand options:', error);
    brandOptions.value = [];
  }
}

async function fetchModelOptions(brandId: string) {
  try {
    const response = await getTerminalModelsApi({ brand_id: brandId });
    modelOptions.value = Array.isArray(response) ? response : [];
    gridApi.formApi.updateSchema([
      {
        componentProps: {
          options: modelOptions.value,
        },
        fieldName: 'model_id',
      },
    ]);
  } catch (error) {
    console.error('Error fetching terminal model options:', error);
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
    console.error('Error fetching users:', error);
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
    {
      component: 'Select',
      componentProps: (_, formApi) => ({
        allowClear: true,
        filterOption: true,
        options: brandOptions.value,
        placeholder: '请选择品牌',
        showSearch: true,
        onChange: async (value?: string) => {
          formApi.setFieldValue('model_id', undefined);
          modelOptions.value = [];
          gridApi.formApi.updateSchema([
            {
              componentProps: {
                options: [],
              },
              fieldName: 'model_id',
            },
          ]);
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
        options: modelOptions.value,
        placeholder: '请选择型号',
        showSearch: true,
      },
      dependencies: {
        disabled: (values) => !values.brand_id,
        triggerFields: ['brand_id'],
      },
      fieldName: 'model_id',
      label: '型号',
    },
    {
      component: 'Input',
      fieldName: 'serial_number',
      label: '序列号',
    },
  ],
  showCollapseButton: false,
  submitOnChange: true,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: [
    { type: 'seq', width: 60 },
    { field: 'tag_number', title: '资产号', width: 150 },
    {
      field: 'brand_name',
      slots: { default: 'brand_name' },
      title: '品牌',
      align: 'center',
      width: 60,
    },
    { field: 'model_name', title: '型号', width: 150 },
    { field: 'asset_person', title: '责任人', width: 120 },
    { field: 'serial_number', title: '序列号', width: 200 },
    { field: 'ip_address', title: 'IP地址', width: 150 },
    { field: 'mac_address', title: 'MAC地址', width: 150 },
    {
      field: 'asset_type',
      title: '类型',
      width: 100,
      slots: { default: 'asset_type' },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    { field: 'hostname', title: '主机名', width: 150 },
    { field: 'cpu_model', title: 'CPU', width: 150 },
    { field: 'memory_size', title: '内存(GB)', width: 100 },
    { field: 'disk_size', title: '硬盘(GB)', width: 100 },
    { field: 'os_type', title: '操作系统', width: 100 },
    { field: 'user_name', title: '使用人', width: 120 },
    { field: 'user_dept', title: '使用部门', width: 150 },
    {
      field: 'action',
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'action' },
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
      query: async ({ page }, formValues) => {
        const params = {
          page: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        };
        const result = await assetsStore.fetchAssets(params);
        return result;
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
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

function handleView(id: string) {
  viewAssetRef.value?.open({ id });
}

function handleEdit(id: string) {
  editAssetRef.value?.open({ id });
}

async function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个资产吗？此操作不可恢复。',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await assetsStore.deleteAsset(id);
        gridApi.query();
      } catch (error) {
        console.error('Delete error:', error);
      }
    },
  });
}

function openAssetsAddDrawer() {
  createAddRef.value?.open();
}

function handleSuccess() {
  gridApi.query();
}

const createAddRef = ref();
const editAssetRef = ref();
const viewAssetRef = ref();

// 组件挂载时加载品牌选项
onMounted(() => {
  fetchBrandOptions();
  loadUsers();
});
</script>

<template>
  <Page auto-content-height>
    <createAdd ref="createAddRef" @success="handleSuccess" />
    <editAsset ref="editAssetRef" @success="handleSuccess" />
    <viewAsset ref="viewAssetRef" />
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="['property_terminal:add']"
          class="mr-2"
          type="primary"
          @click="openAssetsAddDrawer()"
        >
          添加资产
        </Button>
      </template>
      <template #brand_name="{ row }">
        <Image
          v-if="row.brand_icon"
          :alt="row.brand_name"
          :preview="false"
          :src="row.brand_icon"
          height="30px"
          width="30px"
        />
        <span v-else>{{ row.brand_name || '-' }}</span>
      </template>
      <template #asset_type="{ row }">
        <span>
          {{
            row.asset_type === 'computer'
              ? '台式机'
              : row.asset_type === 'laptop'
                ? '笔记本'
                : row.asset_type
          }}
        </span>
      </template>
      <template #status="{ row }">
        <span
          :class="
            row.status === 'active' || row.status === '正常'
              ? 'text-green-600'
              : 'text-red-600'
          "
        >
          {{
            row.status === 'active'
              ? '正常'
              : row.status === 'maintenance'
                ? '维护中'
                : row.status === 'inactive'
                  ? '停用'
                  : row.status === 'retired'
                    ? '报废'
                    : row.status
          }}
        </span>
      </template>

      <template #action="{ row }">
        <Button
          v-access:code="['property_terminal:view']"
          type="link"
          @click="handleView(row.id)"
        >
          查看
        </Button>
        <Button
          v-access:code="['property_terminal:edit']"
          type="link"
          @click="handleEdit(row.id)"
        >
          编辑
        </Button>
        <Button
          v-access:code="['property_terminal:delete']"
          danger
          type="link"
          @click="handleDelete(row.id)"
        >
          删除
        </Button>
      </template>
    </Grid>
  </Page>
</template>
