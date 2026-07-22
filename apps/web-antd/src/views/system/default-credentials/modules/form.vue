<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { DefaultCredentialApi } from '#/api/system/default-credentials';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenDrawer, useVbenForm } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  createDefaultCredential,
  updateDefaultCredential,
} from '#/api/system/default-credentials';

import {
  credentialScopeOptions,
  deviceTypeOptions,
  getDefaultProtocol,
  getProtocolOptions,
  getVendorOptions,
} from '../options';

const emit = defineEmits<{
  success: [];
}>();

const credentialId = ref<string>();
const { hasAccessByCodes } = useAccess();
const canAddCredential = hasAccessByCodes(['system_default_credentials:add']);
const canEditCredential = hasAccessByCodes(['system_default_credentials:edit']);
const isEdit = computed(() => !!credentialId.value);

function vendorLabel(deviceType: string) {
  if (deviceType === 'device') return '平台类型';
  if (deviceType === 'switch') return '厂商';
  return '厂商/BMC';
}

function targetPlaceholder(deviceType: string) {
  if (deviceType === 'device') return '实例专属可填写平台地址或 API 地址';
  if (deviceType === 'switch') return '实例专属可填写交换机管理 IP';
  return '实例专属可填写服务器管理口 IP';
}

async function applyDeviceType(deviceType: string, resetProtocol = false) {
  await formApi.updateSchema([
    {
      componentProps: {
        allowClear: false,
        options: getProtocolOptions(deviceType),
        placeholder: '请选择协议',
        showSearch: true,
      },
      fieldName: 'protocol',
    },
    {
      componentProps: {
        allowClear: true,
        options: getVendorOptions(deviceType),
        placeholder: `${vendorLabel(deviceType)}通用凭证请选择${vendorLabel(deviceType)}`,
        showSearch: true,
      },
      fieldName: 'vendor_key',
      label: vendorLabel(deviceType),
    },
    {
      componentProps: {
        placeholder: targetPlaceholder(deviceType),
      },
      fieldName: 'target_ip',
    },
  ]);

  if (resetProtocol) {
    await formApi.setValues({
      protocol: getDefaultProtocol(deviceType),
      vendor_key: undefined,
    });
  }
}

const [BaseForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '例如：Dell iDRAC 通用凭证',
      },
      fieldName: 'name',
      label: '凭证名称',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: deviceTypeOptions,
        placeholder: '请选择设备类型',
        onChange: (value: string) => applyDeviceType(value, true),
      },
      defaultValue: 'server',
      fieldName: 'device_type',
      label: '设备类型',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: getProtocolOptions('server'),
        placeholder: '请选择协议',
        showSearch: true,
      },
      defaultValue: 'redfish',
      fieldName: 'protocol',
      label: '协议',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: credentialScopeOptions,
        placeholder: '请选择凭证作用域',
        onChange: async (value: string) => {
          if (value === 'global') {
            await formApi.setValues({
              target_device_id: undefined,
              target_ip: undefined,
              vendor_key: undefined,
            });
          }
        },
      },
      defaultValue: 'global',
      fieldName: 'credential_scope',
      label: '作用域',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getVendorOptions('server'),
        placeholder: '厂商/BMC 通用凭证请选择厂商/BMC',
        showSearch: true,
      },
      fieldName: 'vendor_key',
      label: '厂商/BMC',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: targetPlaceholder('server'),
      },
      fieldName: 'target_ip',
      label: '目标IP/地址',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '实例专属可填写已纳管设备ID',
      },
      fieldName: 'target_device_id',
      label: '绑定设备ID',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户名',
      },
      fieldName: 'username',
      label: '用户名',
      rules: 'required',
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: '编辑时留空表示不修改密码',
      },
      fieldName: 'password',
      label: '密码',
    },
    {
      component: 'Switch',
      componentProps: {
        class: 'credential-form-switch',
      },
      defaultValue: true,
      fieldName: 'is_enabled',
      label: '启用',
    },
    {
      component: 'Switch',
      componentProps: {
        class: 'credential-form-switch',
      },
      defaultValue: false,
      fieldName: 'is_default',
      label: '默认凭证',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入说明',
        rows: 3,
      },
      fieldName: 'description',
      label: '说明',
    },
  ] as VbenFormSchema[],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    if (isEdit.value && !canEditCredential) {
      message.warning('无权限编辑默认凭证');
      return;
    }
    if (!isEdit.value && !canAddCredential) {
      message.warning('无权限新增默认凭证');
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) return;

    const rawValues = await formApi.getValues();
    if (!isEdit.value && !rawValues.password) {
      message.error('请输入密码');
      return;
    }
    if (rawValues.credential_scope === 'vendor' && !rawValues.vendor_key) {
      message.error('厂商/平台通用凭证必须选择厂商或平台');
      return;
    }
    if (
      rawValues.credential_scope === 'instance' &&
      !rawValues.target_ip &&
      !rawValues.target_device_id
    ) {
      message.error('实例专属凭证必须填写目标 IP/地址或绑定设备 ID');
      return;
    }

    const values: DefaultCredentialApi.DefaultCredentialFormData = {
      credential_scope: rawValues.credential_scope || 'global',
      description: rawValues.description || undefined,
      device_type: rawValues.device_type,
      is_default: Boolean(rawValues.is_default),
      is_enabled: Boolean(rawValues.is_enabled),
      name: rawValues.name,
      password: rawValues.password || undefined,
      protocol: rawValues.protocol,
      target_device_id:
        rawValues.credential_scope === 'instance'
          ? rawValues.target_device_id || undefined
          : undefined,
      target_ip:
        rawValues.credential_scope === 'instance'
          ? rawValues.target_ip || undefined
          : undefined,
      username: rawValues.username,
      vendor_key:
        rawValues.credential_scope === 'global'
          ? undefined
          : rawValues.vendor_key || undefined,
    };

    drawerApi.lock();
    try {
      if (isEdit.value) {
        const currentCredentialId = credentialId.value;
        if (!currentCredentialId) throw new Error('缺少凭证标识');
        await updateDefaultCredential(currentCredentialId, values);
        message.success('更新成功');
      } else {
        await createDefaultCredential(values);
        message.success('创建成功');
      }
      emit('success');
      drawerApi.close();
    } catch (error: any) {
      message.error(error?.message || '操作失败');
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<DefaultCredentialApi.DefaultCredential>();
    formApi.resetForm();

    if (data?.id) {
      credentialId.value = data.id;
      drawerApi.setState({ title: '编辑凭证' });
      await applyDeviceType(data.device_type);
      await formApi.setValues({
        credential_scope: data.credential_scope || 'global',
        description: data.description,
        device_type: data.device_type,
        is_default: data.is_default,
        is_enabled: data.is_enabled,
        name: data.name,
        password: '',
        protocol: data.protocol,
        target_device_id: data.target_device_id || undefined,
        target_ip: data.target_ip || undefined,
        username: data.username,
        vendor_key: data.vendor_key || undefined,
      });
    } else {
      credentialId.value = undefined;
      drawerApi.setState({ title: '新增凭证' });
      await applyDeviceType('server');
      await formApi.setValues({
        credential_scope: 'global',
        device_type: 'server',
        is_default: false,
        is_enabled: true,
        protocol: 'redfish',
      });
    }
  },
  title: '新增凭证',
});
</script>

<template>
  <Drawer>
    <BaseForm />
  </Drawer>
</template>

<style scoped>
:deep(.credential-form-switch) {
  width: fit-content !important;
  min-width: 44px;
}
</style>
