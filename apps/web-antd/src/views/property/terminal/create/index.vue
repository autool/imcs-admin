<script lang="ts" setup>
import type { TerminalAssetItem } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { useTerminalAssetsStore } from '#/store';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const emit = defineEmits<{
  success: [];
}>();

const assetsStore = useTerminalAssetsStore();
const submitSucceeded = ref(false);
const userOptions = ref<
  Array<{ department?: string; label: string; value: string }>
>([]);
const userOptionMap = ref(
  new Map<string, { department?: string; label: string; value: string }>(),
);

type TerminalAssetCreatePayload = Omit<
  TerminalAssetItem,
  'created_at' | 'id' | 'updated_at'
>;

function normalizeAssetValues(
  values: Record<string, any>,
): TerminalAssetCreatePayload {
  return {
    ...values,
    asset_type: values.asset_type || 'computer',
    status: values.status || 'active',
    tag_number: String(values.tag_number || ''),
  } as TerminalAssetCreatePayload;
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

// 提交处理函数
async function onSubmit(values: Record<string, any>) {
  submitSucceeded.value = false;
  try {
    await assetsStore.createAsset(normalizeAssetValues(values));
    message.success('创建成功');
    submitSucceeded.value = true;
  } catch (error) {
    console.error('Create error:', error);
    message.error('创建失败');
  }
}

// 创建表单实例
const [BaseForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  handleSubmit: onSubmit,
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

loadUsers();

// 创建模态框实例
const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  closeOnClickModal: false,
  confirmLoading: false,
  class: 'w-[800px]',
  cancelText: '重置',
  onCancel() {
    formApi.resetForm();
  },
  async onConfirm() {
    try {
      modalApi.setState({
        confirmLoading: true,
      });

      // 验证并提交表单
      submitSucceeded.value = false;
      await formApi.validateAndSubmitForm();

      // 如果提交成功，关闭模态框并触发成功事件
      if (submitSucceeded.value) {
        modalApi.close();
        emit('success');
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      modalApi.setState({
        confirmLoading: false,
      });
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 重置表单
      formApi.resetForm();
      const { values } = modalApi.getData<Record<string, any>>();
      if (values) {
        formApi.setValues(values);
      }
    }
  },
  title: '创建终端资产',
});

// 暴露 open 方法给父组件
defineExpose({
  open: modalApi.open,
});
</script>

<template>
  <Modal>
    <BaseForm />
  </Modal>
</template>
