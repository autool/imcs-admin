<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getServerInfoApi, updateServerApi } from '#/api';
import { getUsableDefaultCredentials } from '#/api/system/default-credentials';
import { useServerStore } from '#/store';

// 定义emit
const emit = defineEmits<{
  success: [];
}>();
const serverStore = useServerStore();
const brandOptions = ref([]);
const modelOptions = ref<{ label: string; value: any }[]>([]);
const credentialOptions = ref<Array<{ label: string; value: string }>>([]);
const serverCredentials = ref<
  Array<{
    id: string;
    is_default: boolean;
    name: string;
    protocol: string;
    username: string;
  }>
>([]);
const isLoading = ref(false);
const serverId = ref<string>('');
const submitSucceeded = ref(false);

// 获取品牌选项
async function fetchBrandOptions() {
  try {
    const response = await serverStore.getBrandOptions();
    brandOptions.value = response;
  } catch (error) {
    console.error('Error fetching brand options:', error);
  }
}

// 获取型号选项
async function fetchModelOptions(brandId: string) {
  if (!brandId) return;
  try {
    const response = await serverStore.getModelOptions({ brand_id: brandId });
    modelOptions.value = response;
  } catch (error) {
    console.error('Error fetching model options:', error);
  }
}

async function fetchServerCredentials() {
  try {
    const response = await getUsableDefaultCredentials({
      device_type: 'server',
    });
    serverCredentials.value = response?.items || [];
    credentialOptions.value = serverCredentials.value.map((item) => ({
      label: `${item.name} / ${item.protocol}${item.is_default ? ' / 默认' : ''}`,
      value: item.id,
    }));
  } catch (error) {
    console.error('Error fetching server credentials:', error);
    serverCredentials.value = [];
    credentialOptions.value = [];
  }
}

// 提交处理函数
async function onSubmit(values: Record<string, any>) {
  submitSucceeded.value = false;
  if (!serverId.value) {
    message.error('服务器ID不存在');
    return;
  }

  try {
    await updateServerApi(serverId.value, {
      ...values,
      isAddRun: false,
    });

    message.success('更新成功');
    submitSucceeded.value = true;
  } catch (error) {
    console.error('Update error:', error);
    message.error('更新失败');
  }
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-9/12',
    },
  },
  handleSubmit: onSubmit,
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入IP地址',
      },
      fieldName: 'ip',
      label: 'IP地址',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: credentialOptions,
        placeholder: '请选择服务器凭证',
        showSearch: true,
      },
      fieldName: 'credential_id',
      label: '凭证',
    },
    {
      component: 'Select',
      componentProps: {
        options: brandOptions,
        placeholder: '请选择品牌',
        onChange: async (value: any) => {
          formApi.setFieldValue('models_id', '');
          modelOptions.value = [];
          if (value) {
            await fetchModelOptions(value);
          }
        },
      },
      fieldName: 'brand',
      label: '品牌',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: modelOptions,
        placeholder: '请选择型号',
      },
      dependencies: {
        triggerFields: ['brand'],
        disabled: (values) => !values.brand,
      },
      fieldName: 'models_id',
      label: '型号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入资产号',
      },
      fieldName: 'tag',
      label: '资产号',
    },
  ],
  showDefaultActions: false,
});

// 加载服务器信息
async function loadServerInfo() {
  if (!serverId.value) return;

  isLoading.value = true;

  try {
    await fetchBrandOptions();
    await fetchServerCredentials();
    const response = await getServerInfoApi(serverId.value);

    if (response && response.id) {
      if (response.brand_id) {
        await fetchModelOptions(response.brand_id);
      }

      await formApi.setValues({
        ip: response.ip_address,
        credential_id: response.credential_id || undefined,
        brand: response.brand_id,
        models_id: response.models_id,
        tag: response.tag_number || '',
      });
    }
  } catch (error: any) {
    console.error('Error loading server info:', error);
    message.error(
      `加载服务器信息失败: ${error?.response?.data?.detail || error?.message || '未知错误'}`,
    );
  } finally {
    isLoading.value = false;
  }
}

// 创建模态框实例
const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  closeOnClickModal: false,
  confirmLoading: false,
  cancelText: '取消',
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      modalApi.setState({
        confirmLoading: true,
      });

      // 验证并提交表单
      submitSucceeded.value = false;
      await formApi.validateAndSubmitForm();

      // 如果提交成功，emit success事件并关闭模态框
      if (submitSucceeded.value) {
        // 等待一小段时间确保后端更新完成
        await new Promise((resolve) => setTimeout(resolve, 300));
        emit('success');
        modalApi.close();
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
      const data = modalApi.getData<Record<string, any>>();
      if (data?.serverId) {
        serverId.value = data.serverId;
        loadServerInfo();
      }
    }
  },
  title: '编辑服务器',
});

// 组件挂载时加载品牌选项
onMounted(() => {
  fetchBrandOptions();
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
