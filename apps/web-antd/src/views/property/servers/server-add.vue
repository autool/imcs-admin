<script lang="ts" setup>
import type { InfraOptionItem } from '#/api/infra';

import { nextTick, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Button, message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { checkServerCredentialApi } from '#/api';
import { getCabinets, getLocations, getRegions } from '#/api/infra';
import { getUsableDefaultCredentials } from '#/api/system/default-credentials';
import { useServerStore } from '#/store';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const emit = defineEmits<{
  success: [payload?: { collectSubmitted?: boolean }];
}>();

const serverStore = useServerStore();
// 定义响应式变量存储选项数据
const brandOptions = ref<Array<{ label: string; value: any }>>([]);
const modelOptions = ref<Array<{ label: string; value: any }>>([]);
const credentialOptions = ref<Array<{ label: string; value: string }>>([]);
const regionOptions = ref<InfraOptionItem[]>([]);
const locationOptions = ref<InfraOptionItem[]>([]);
const cabinetOptions = ref<InfraOptionItem[]>([]);
const userOptions = ref<Array<{ label: string; value: string }>>([]);
const serverCredentials = ref<
  Array<{
    id: string;
    is_default: boolean;
    name: string;
    protocol: string;
    username: string;
  }>
>([]);
const isPrefilling = ref(false);
const submitting = ref(false);
const submittedResponse = ref<any>();
const connectionTesting = ref(false);
const connectionStatus = ref<'failed' | 'idle' | 'success'>('idle');
const connectionMessage = ref('');

function filterOptionByLabel(input: string, option: any) {
  return String(option?.label || '')
    .toLowerCase()
    .includes(input.toLowerCase());
}

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
async function fetchModelOptions(brandId: number | string) {
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

async function loadUsers() {
  try {
    const response = await loadSystemUserOptions({ include_disabled: true });
    userOptions.value = response.options;
    formApi.updateSchema([
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

async function loadRegions() {
  try {
    const response = await getRegions();
    regionOptions.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching regions:', error);
    regionOptions.value = [];
  }
}

async function loadLocations(regionId?: string) {
  try {
    const response = await getLocations(regionId);
    locationOptions.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    locationOptions.value = [];
  }
}

async function loadCabinets(locationId?: string) {
  try {
    const response = await getCabinets(locationId);
    cabinetOptions.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching cabinets:', error);
    cabinetOptions.value = [];
  }
}

function resetConnectionStatus() {
  connectionStatus.value = 'idle';
  connectionMessage.value = '';
}

async function testConnection(showSuccessMessage = true) {
  const values = await formApi.getValues();
  const ip = values.ip;
  const credentialId = values.credential_id;
  if (!ip || !credentialId) {
    connectionStatus.value = 'failed';
    connectionMessage.value = '请先填写 IPMI 地址并选择凭证';
    return false;
  }

  connectionTesting.value = true;
  try {
    const response = await checkServerCredentialApi({
      ip,
      credential_id: credentialId,
    });
    if (response?.code === 200) {
      connectionStatus.value = 'success';
      connectionMessage.value = response.message || '登录成功';
      if (showSuccessMessage) {
        message.success(connectionMessage.value);
      }
      return true;
    }

    connectionStatus.value = 'failed';
    connectionMessage.value = response?.message || '登录失败';
    message.error(connectionMessage.value);
    return false;
  } catch (error: any) {
    connectionStatus.value = 'failed';
    connectionMessage.value =
      error?.response?.data?.detail || error?.message || '登录测试失败';
    message.error(connectionMessage.value);
    return false;
  } finally {
    connectionTesting.value = false;
  }
}

// 在组件挂载时获取品牌选项
onMounted(() => {
  fetchBrandOptions();
  fetchServerCredentials();
  loadRegions();
  loadUsers();
});
// 创建表单实例
const [BaseForm, formApi] = useVbenForm({
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
        placeholder: 'IPMI 地址',
        onChange: resetConnectionStatus,
      },
      fieldName: 'ip',
      label: 'IPMI 地址',
      rules: z.string().ip('请输入正确的IP').min(1, 'IPMI 地址不能为空'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: credentialOptions,
        placeholder: '选择系统默认凭证',
        showSearch: true,
        onChange: resetConnectionStatus,
      },
      fieldName: 'credential_id',
      label: '凭证',
      rules: z.string().min(1, '请选择凭证'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: brandOptions,
        placeholder: '请选择',
        showSearch: true,
        onChange: async (value: string) => {
          if (isPrefilling.value) {
            return;
          }
          // 品牌改变时，清空型号并重新加载型号选项
          formApi.setFieldValue('model', undefined);
          if (value) {
            await fetchModelOptions(value);
          } else {
            modelOptions.value = [];
          }
        },
      },
      fieldName: 'brand',
      label: '品牌',
      rules: z.string().min(1, '品牌不能为空'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: modelOptions,
        placeholder: '请先选择品牌',
        showSearch: true,
      },
      fieldName: 'model',
      label: '型号',
      rules: z.string().min(1, '型号不能为空'),
    },
    {
      component: 'RadioGroup',
      help: '是否添加后自动获取信息 \n 仅添加：不获取服务器信息，仅添加到服务器列表\n 添加&获取：添加到服务器列表，并获取服务器信息',
      defaultValue: false,
      componentProps: {
        options: [
          {
            label: '仅添加',
            value: false,
          },
          {
            label: '添加&获取',
            value: true,
          },
        ],
      },
      fieldName: 'isAddRun',
      label: '操作',
      rules: z.boolean(),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入资产号，可以为空',
      },
      fieldName: 'tag',
      label: '资产号',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: filterOptionByLabel,
        options: regionOptions,
        placeholder: '请选择区域',
        showSearch: true,
        onChange: async (value: string) => {
          formApi.setFieldValue('location_id', undefined);
          formApi.setFieldValue('cabinet_id', undefined);
          locationOptions.value = [];
          cabinetOptions.value = [];
          if (value) {
            await loadLocations(value);
          }
        },
      },
      fieldName: 'region_id',
      label: '区域',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: filterOptionByLabel,
        options: locationOptions,
        placeholder: '请选择位置',
        showSearch: true,
        onChange: async (value: string) => {
          formApi.setFieldValue('cabinet_id', undefined);
          cabinetOptions.value = [];
          if (value) {
            await loadCabinets(value);
          }
        },
      },
      dependencies: {
        disabled: (values) => !values.region_id,
        triggerFields: ['region_id'],
      },
      fieldName: 'location_id',
      label: '位置',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: filterOptionByLabel,
        options: cabinetOptions,
        placeholder: '请选择机柜',
        showSearch: true,
      },
      dependencies: {
        disabled: (values) => !values.location_id,
        triggerFields: ['location_id'],
      },
      fieldName: 'cabinet_id',
      label: '机柜',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '例如: 1-4',
      },
      fieldName: 'uPosition',
      label: 'U位',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: filterOptionByLabel,
        options: userOptions,
        placeholder: '请选择责任人',
        showSearch: true,
      },
      fieldName: 'asset_user_id',
      label: '责任人',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注信息',
        rows: 2,
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
  cancelText: '重置',

  onCancel() {
    formApi.resetForm();
    resetConnectionStatus();
    submitting.value = false;
    modalApi.setState({ confirmLoading: false });
  },
  onConfirm: async () => {
    if (submitting.value) {
      return;
    }
    submitting.value = true;
    modalApi.setState({
      confirmLoading: true,
    });
    try {
      submittedResponse.value = undefined;
      await formApi.validateAndSubmitForm();
      const response = submittedResponse.value;
      if (response?.code === 200 || serverStore.serverData.code === 200) {
        emit('success', {
          collectSubmitted: Boolean(response?.collect_submitted),
        });
        modalApi.close();
      }
    } finally {
      submitting.value = false;
      modalApi.setState({
        confirmLoading: false,
      });
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { values = {} } = modalApi.getData<Record<string, any>>();
      formApi.resetForm();
      resetConnectionStatus();
      submitting.value = false;
      submittedResponse.value = undefined;
      modalApi.setState({ confirmLoading: false });
      isPrefilling.value = true;

      try {
        if (brandOptions.value.length === 0) {
          await fetchBrandOptions();
        }
        if (serverCredentials.value.length === 0) {
          await fetchServerCredentials();
        }
        if (regionOptions.value.length === 0) {
          await loadRegions();
        }

        const defaultCredential = serverCredentials.value.find(
          (item) => item.is_default,
        );
        if (!values.credential_id && defaultCredential) {
          values.credential_id = defaultCredential.id;
        }

        if (values.brand) {
          await fetchModelOptions(values.brand);
        } else {
          modelOptions.value = [];
        }

        if (values.region_id) {
          await loadLocations(values.region_id);
        } else {
          locationOptions.value = [];
        }
        if (values.location_id) {
          await loadCabinets(values.location_id);
        } else {
          cabinetOptions.value = [];
        }

        formApi.setValues(values);
        await nextTick();
        if (values.model) {
          formApi.setFieldValue('model', values.model);
        }
      } finally {
        isPrefilling.value = false;
      }
    }
  },
  title: '添加服务器',
});

async function onSubmit(values: Record<string, any>) {
  const submitValues = { ...values };
  if (connectionStatus.value !== 'success') {
    const isConnected = await testConnection(false);
    if (!isConnected) {
      return;
    }
  }
  const response = await serverStore.addServer(submitValues);
  submittedResponse.value = response;
  return response;
}
</script>

<template>
  <Modal>
    <div class="server-add-form">
      <BaseForm />
      <div class="credential-test">
        <Button :loading="connectionTesting" @click="testConnection()">
          登录测试
        </Button>
      </div>
      <div v-if="connectionStatus !== 'idle'" class="credential-test-result">
        <Alert
          :message="connectionMessage"
          :type="connectionStatus === 'success' ? 'success' : 'error'"
          show-icon
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.server-add-form {
  position: relative;
}

.credential-test {
  position: absolute;
  top: 52px;
  left: calc(25% + 75% * 0.75 + 12px);
}

.credential-test-result {
  width: calc(75% * 0.75);
  margin-top: -8px;
  margin-left: 25%;
}

:deep(.server-add-form .ant-form-item:nth-child(2) .ant-form-item-control) {
  max-width: calc(75% * 0.75);
}
</style>
