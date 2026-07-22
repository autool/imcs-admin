<script lang="ts" setup>
import type { SmsGatewayApi } from '#/api/system/sms-gateway';

import { computed, nextTick, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createSmsGateway, updateSmsGateway } from '#/api/system/sms-gateway';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'SmsGatewayForm' });

const emits = defineEmits(['success']);
const { hasAccessByCodes } = useAccess();
const canCreateGateway = hasAccessByCodes(['sms_gateway:add']);
const canEditGateway = hasAccessByCodes(['sms_gateway:edit']);

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const id = ref<string>();
const formData = ref<SmsGatewayApi.SmsGateway>();

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const canSave = id.value ? canEditGateway : canCreateGateway;
    if (!canSave) {
      message.warning('无权限保存短信网关');
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    // 根据 provider 构建提交数据
    const submitData: SmsGatewayApi.SmsGatewayFormData = {
      access_key: '',
      name: values.name,
      provider: values.provider,
      secret_key: '',
      is_enabled: values.is_enabled,
      is_default: values.is_default,
      description: values.description,
      rate_limit: values.rate_limit,
      daily_limit: values.daily_limit,
    };

    switch (values.provider) {
      case 'aliyun': {
        submitData.access_key = values.access_key;
        submitData.secret_key = values.secret_key;
        submitData.sign_name = values.sign_name;
        submitData.template_code = values.template_code;
        submitData.region = values.region;
        break;
      }
      case 'custom': {
        submitData.access_key = values.access_key;
        submitData.secret_key = values.secret_key;
        submitData.endpoint = values.endpoint;
        submitData.region = values.region;
        break;
      }
      case 'qiniu': {
        submitData.access_key = values.access_key;
        submitData.secret_key = values.secret_key;
        submitData.sign_name = values.sign_name;
        submitData.template_code = values.template_code;
        submitData.region = values.region;
        break;
      }
      case 'tencent': {
        submitData.access_key = values.secret_id;
        submitData.secret_key = values.secret_key;
        submitData.sign_name = values.sign_name;
        submitData.template_code = values.template_code;
        submitData.region = values.region;
        break;
      }
      case 'upyun': {
        submitData.access_key = values.operator_name;
        submitData.secret_key = values.operator_password;
        submitData.sign_name = values.bucket_name;
        submitData.template_code = values.template_code;
        submitData.region = values.region;
        break;
      }
    }

    drawerApi.lock();

    (id.value
      ? updateSmsGateway(id.value, submitData)
      : createSmsGateway(submitData)
    )
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const data = drawerApi.getData<SmsGatewayApi.SmsGateway>();

    if (data?.id) {
      formData.value = data;
      id.value = data.id;
    } else {
      formData.value = undefined;
      id.value = undefined;
    }

    formApi.resetForm();
    await nextTick();

    if (data?.id) {
      // 编辑模式：密钥字段不回填
      const baseValues: Record<string, any> = {
        name: data.name,
        provider: data.provider,
        sign_name: data.sign_name,
        template_code: data.template_code,
        endpoint: data.endpoint,
        region: data.region,
        is_enabled: data.is_enabled,
        is_default: data.is_default,
        description: data.description,
        rate_limit: data.rate_limit,
        daily_limit: data.daily_limit,
        secret_key: '',
      };

      // 又拍云字段映射
      if (data.provider === 'upyun') {
        baseValues.operator_name = data.access_key;
        baseValues.operator_password = '';
        baseValues.bucket_name = data.sign_name;
      }
      // 腾讯云字段映射
      if (data.provider === 'tencent') {
        baseValues.secret_id = data.access_key;
      }

      await formApi.setValues(baseValues);
    }
  },
});

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', ['短信网关'])
    : $t('common.create', ['短信网关']);
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
