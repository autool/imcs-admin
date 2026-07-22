<script lang="ts" setup>
import type { TerminalBrandOption } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getTerminalAssetDetailApi,
  getTerminalBrandsApi,
  getTerminalModelsApi,
} from '#/api';
import { useTerminalAssetsStore } from '#/store';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const emit = defineEmits<{
  success: [];
}>();

const assetsStore = useTerminalAssetsStore();
const userOptions = ref<
  Array<{ department?: string; label: string; value: string }>
>([]);
const userOptionMap = ref(
  new Map<string, { department?: string; label: string; value: string }>(),
);

// 品牌和型号选项
const brandOptions = ref<TerminalBrandOption[]>([]);
const modelOptions = ref<{ label: string; value: any }[]>([]);

// 获取品牌选项
async function fetchBrandOptions() {
  try {
    const response = await getTerminalBrandsApi();
    brandOptions.value = Array.isArray(response) ? response : [];
    formApi.updateSchema([
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

// 获取型号选项
async function fetchModelOptions(brandId: string) {
  if (!brandId) return;
  try {
    const response = await getTerminalModelsApi({ brand_id: brandId });
    modelOptions.value = Array.isArray(response) ? response : [];
    formApi.updateSchema([
      {
        componentProps: {
          options: modelOptions.value,
        },
        fieldName: 'model_id',
      },
    ]);
  } catch (error) {
    console.error('Error fetching model options:', error);
    modelOptions.value = [];
  }
}

async function loadUsers() {
  try {
    const response = await loadSystemUserOptions({ include_disabled: true });
    userOptions.value = response.options;
    userOptionMap.value = response.byId;
    formApi.updateSchema([
      {
        componentProps: {
          options: userOptions.value,
        },
        fieldName: 'user_id',
      },
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
    userOptionMap.value = new Map();
  }
}

// 创建表单实例
const [BaseForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1 md:grid-cols-2 gap-x-12',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入资产号',
      },
      fieldName: 'tag_number',
      label: '资产号',
      rules: z.string().min(1, '资产号不能为空'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: brandOptions.value,
        placeholder: '请选择品牌',
        onChange: async (value: any) => {
          formApi.setFieldValue('model_id', '');
          modelOptions.value = [];
          formApi.updateSchema([
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
      },
      fieldName: 'brand_id',
      label: '品牌',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: modelOptions.value,
        placeholder: '请选择型号',
      },
      dependencies: {
        triggerFields: ['brand_id'],
        disabled: (values) => !values.brand_id,
      },
      fieldName: 'model_id',
      label: '型号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入序列号',
      },
      fieldName: 'serial_number',
      label: '序列号',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: [
          { label: '台式机', value: 'computer' },
          { label: '笔记本', value: 'laptop' },
        ],
        placeholder: '请选择资产类型',
        showSearch: true,
      },
      fieldName: 'asset_type',
      label: '资产类型',
      rules: z.string().min(1, '请选择资产类型'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '正常', value: 'active' },
          { label: '维护中', value: 'maintenance' },
          { label: '停用', value: 'inactive' },
          { label: '报废', value: 'retired' },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入CPU型号',
      },
      fieldName: 'cpu_model',
      label: 'CPU型号',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入内存大小(GB)',
        min: 1,
      },
      fieldName: 'memory_size',
      label: '内存大小(GB)',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入硬盘容量(GB)',
        min: 1,
      },
      fieldName: 'disk_size',
      label: '硬盘容量(GB)',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'Windows', value: 'Windows' },
          { label: 'macOS', value: 'macOS' },
          { label: 'Linux', value: 'Linux' },
          { label: '其他', value: 'Other' },
        ],
        placeholder: '请选择操作系统',
      },
      fieldName: 'os_type',
      label: '操作系统',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入操作系统版本',
      },
      fieldName: 'os_version',
      label: '系统版本',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入主机名',
      },
      fieldName: 'hostname',
      label: '主机名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入IP地址',
      },
      fieldName: 'ip_address',
      label: 'IP地址',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入MAC地址',
      },
      fieldName: 'mac_address',
      label: 'MAC地址',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: userOptions.value,
        placeholder: '请选择使用人',
        showSearch: true,
        onChange: (value?: string) => {
          const option = value ? userOptionMap.value.get(value) : undefined;
          formApi.setFieldValue('user_dept', option?.department || '');
        },
      },
      fieldName: 'user_id',
      label: '使用人',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '自动带出使用部门',
        readonly: true,
      },
      fieldName: 'user_dept',
      label: '使用部门',
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
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商',
      },
      fieldName: 'supplier',
      label: '供应商',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
      fieldName: 'notes',
      label: '备注',
    },
  ],
  showDefaultActions: false,
});

// 创建模态框实例
const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  closeOnClickModal: false,
  confirmLoading: false,
  class: 'w-[800px]',
  cancelText: '取消',
  async onConfirm() {
    try {
      modalApi.setState({
        confirmLoading: true,
      });

      // 验证表单
      const valid = await formApi.validate();
      if (!valid) {
        return;
      }

      // 获取表单值并提交
      const values = await Promise.resolve(formApi.getValues());
      const { id } = modalApi.getData<{ id: string }>();

      await assetsStore.updateAsset(id, values);

      // 提交成功，关闭模态框并触发成功事件
      modalApi.close();
      emit('success');
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('更新失败，请查看控制台错误信息');
    } finally {
      modalApi.setState({
        confirmLoading: false,
      });
    }
  },
  async onOpenChange(isOpen: boolean) {
    // 数据已经在 open 方法中加载，这里不需要再加载
    if (!isOpen) {
      // 关闭时清空表单
      formApi.resetForm();
    }
  },
  title: '编辑终端资产',
});

// 暴露 open 方法给父组件
defineExpose({
  open: async (data?: { id: string }) => {
    if (data?.id) {
      try {
        // 先加载品牌选项
        await fetchBrandOptions();
        await loadUsers();

        // 加载资产数据
        const asset = await getTerminalAssetDetailApi(data.id);

        // 如果有品牌ID，加载对应的型号选项
        if (asset.brand_id) {
          await fetchModelOptions(asset.brand_id);
        }

        // 设置表单值
        formApi.setValues(asset);

        // 设置模态框数据
        modalApi.setData(data);

        // 最后打开模态框
        modalApi.open();
      } catch (error) {
        console.error('Failed to load asset:', error);
        message.error('加载资产信息失败');
      }
    } else {
      console.error('No id provided to edit component');
      message.error('缺少资产ID');
    }
  },
});
</script>

<template>
  <Modal>
    <BaseForm />
  </Modal>
</template>
