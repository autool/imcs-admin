<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { NotificationConfigApi } from '#/api/system/notification-configs';

import { reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Drawer,
  Form,
  FormItem,
  Input,
  message,
  Select,
  SelectOption,
  Space,
  Textarea,
} from 'ant-design-vue';

import {
  createNotificationConfigApi,
  updateNotificationConfigApi,
} from '#/api/system/notification-configs';

import EmailConfigForm from './EmailConfigForm.vue';
import WebhookConfigForm from './WebhookConfigForm.vue';
import WeComConfigForm from './WeComConfigForm.vue';

interface Props {
  canManage?: boolean;
  visible: boolean;
  config: NotificationConfigApi.NotificationConfig | null;
  isCreating: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref();
const saving = ref(false);

const formData = reactive<{
  config_data: any;
  config_type: NotificationConfigApi.ConfigType;
  description?: string;
  is_default: boolean;
  is_enabled: boolean;
  name: string;
}>({
  name: '',
  config_type: 'email',
  config_data: {},
  description: '',
  is_enabled: true,
  is_default: false,
});

const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  config_type: [
    { required: true, message: '请选择配置类型', trigger: 'change' },
  ],
};

// 监听配置变化
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      formData.name = newConfig.name;
      formData.config_type = newConfig.config_type;
      formData.config_data = { ...newConfig.config_data };
      formData.description = newConfig.description;
      formData.is_enabled = newConfig.is_enabled;
      formData.is_default = newConfig.is_default;
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

// 重置表单
function resetForm() {
  formData.name = '';
  formData.config_type = 'email';
  formData.config_data = {};
  formData.description = '';
  formData.is_enabled = true;
  formData.is_default = false;
  formRef.value?.clearValidate();
}

// 类型变化
function handleTypeChange() {
  formData.config_data = {};
}

// 关闭抽屉
function handleClose() {
  emit('update:visible', false);
  resetForm();
}

// 提交表单
async function handleSubmit() {
  if (!props.canManage) {
    message.warning('无权限保存通知配置');
    return;
  }
  try {
    await formRef.value?.validate();
    saving.value = true;

    if (props.isCreating) {
      await createNotificationConfigApi({
        name: formData.name,
        config_type: formData.config_type,
        config_data: formData.config_data,
        description: formData.description,
        is_enabled: formData.is_enabled,
        is_default: formData.is_default,
      });
      message.success('创建成功');
    } else {
      const configId = props.config?.id;
      if (!configId) {
        throw new Error('缺少通知配置标识');
      }
      await updateNotificationConfigApi(configId, {
        name: formData.name,
        config_data: formData.config_data,
        description: formData.description,
        is_enabled: formData.is_enabled,
        is_default: formData.is_default,
      });
      message.success('更新成功');
    }

    emit('success');
    handleClose();
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      return;
    }
    message.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="visible"
    :title="isCreating ? '新建通知配置' : '编辑通知配置'"
    width="600px"
    @close="handleClose"
  >
    <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <FormItem label="配置名称" name="name">
        <Input v-model:value="formData.name" placeholder="请输入配置名称" />
      </FormItem>

      <FormItem label="配置类型" name="config_type">
        <Select
          v-model:value="formData.config_type"
          placeholder="请选择配置类型"
          :disabled="!isCreating"
          @change="handleTypeChange"
        >
          <SelectOption value="email">邮箱</SelectOption>
          <SelectOption value="wecom">企业微信应用</SelectOption>
          <SelectOption value="webhook">Webhook</SelectOption>
        </Select>
      </FormItem>

      <!-- 邮箱配置 -->
      <template v-if="formData.config_type === 'email'">
        <EmailConfigForm v-model:config="formData.config_data" />
      </template>

      <!-- 企业微信配置 -->
      <template v-if="formData.config_type === 'wecom'">
        <WeComConfigForm v-model:config="formData.config_data" />
      </template>

      <!-- Webhook配置 -->
      <template v-if="formData.config_type === 'webhook'">
        <WebhookConfigForm v-model:config="formData.config_data" />
      </template>

      <FormItem label="配置描述" name="description">
        <Textarea
          v-model:value="formData.description"
          placeholder="请输入配置描述"
          :rows="3"
        />
      </FormItem>

      <FormItem name="is_enabled">
        <Checkbox v-model:checked="formData.is_enabled">启用此配置</Checkbox>
      </FormItem>

      <FormItem name="is_default">
        <Checkbox v-model:checked="formData.is_default">
          设为默认配置（同类型只能有一个默认配置）
        </Checkbox>
      </FormItem>
    </Form>

    <template #footer>
      <Space>
        <Button @click="handleClose">取消</Button>
        <Button
          type="primary"
          :disabled="!canManage"
          :loading="saving"
          @click="handleSubmit"
        >
          保存
        </Button>
      </Space>
    </template>
  </Drawer>
</template>
