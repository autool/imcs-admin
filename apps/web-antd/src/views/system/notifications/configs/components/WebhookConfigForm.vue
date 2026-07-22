<script lang="ts" setup>
import type { NotificationConfigApi } from '#/api/system/notification-configs';

import { reactive, ref, watch } from 'vue';

import {
  Alert,
  Checkbox,
  Input,
  InputPassword,
  message,
  Select,
  SelectOption,
  Textarea,
} from 'ant-design-vue';

interface Props {
  config: NotificationConfigApi.WebhookConfig;
}

interface Emits {
  (e: 'update:config', value: NotificationConfigApi.WebhookConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localConfig = reactive<NotificationConfigApi.WebhookConfig>({
  webhook_type: 'wecom',
  webhook_url: '',
  secret: '',
  headers: {},
  method: 'POST',
  content_type: 'application/json',
  support_markdown: true,
});

const headersText = ref('');

// 监听配置变化
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig && Object.keys(newConfig).length > 0) {
      Object.assign(localConfig, newConfig);
      if (newConfig.headers) {
        headersText.value = JSON.stringify(newConfig.headers, null, 2);
      }
    }
  },
  { immediate: true, deep: true },
);

// 监听本地配置变化，同步到父组件
watch(
  localConfig,
  (newConfig) => {
    emit('update:config', { ...newConfig });
  },
  { deep: true },
);

// 处理请求头变化
function handleHeadersChange() {
  if (!headersText.value.trim()) {
    localConfig.headers = {};
    return;
  }

  try {
    localConfig.headers = JSON.parse(headersText.value);
  } catch {
    message.error('请求头格式错误，请输入有效的JSON');
  }
}
</script>

<template>
  <div class="webhook-config-form">
    <Alert
      message="Webhook配置说明"
      description="支持企业微信、飞书、钉钉群机器人Webhook，或自定义Webhook地址"
      type="info"
      show-icon
      class="mb-4"
    />

    <div class="form-item">
      <label class="form-label">
        <span class="required">*</span> Webhook类型
      </label>
      <Select
        v-model:value="localConfig.webhook_type"
        placeholder="请选择Webhook类型"
      >
        <SelectOption value="wecom">企业微信群机器人</SelectOption>
        <SelectOption value="feishu">飞书群机器人</SelectOption>
        <SelectOption value="dingtalk">钉钉群机器人</SelectOption>
        <SelectOption value="custom">自定义Webhook</SelectOption>
      </Select>
      <div v-if="!localConfig.webhook_type" class="error-text">
        请选择Webhook类型
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">
        <span class="required">*</span> Webhook地址
      </label>
      <Textarea
        v-model:value="localConfig.webhook_url"
        placeholder="请输入完整的Webhook URL"
        :rows="3"
      />
      <div v-if="!localConfig.webhook_url" class="error-text">
        请输入Webhook地址
      </div>
    </div>

    <div
      v-if="
        localConfig.webhook_type === 'feishu' ||
        localConfig.webhook_type === 'dingtalk'
      "
      class="form-item"
    >
      <label class="form-label">签名密钥</label>
      <InputPassword
        v-model:value="localConfig.secret"
        placeholder="签名密钥（可选）"
      />
      <div class="help-text">飞书和钉钉机器人的签名密钥，用于验证消息来源</div>
    </div>

    <div
      v-if="
        localConfig.webhook_type === 'wecom' ||
        localConfig.webhook_type === 'feishu'
      "
      class="form-item"
    >
      <Checkbox v-model:checked="localConfig.support_markdown">
        支持Markdown格式
      </Checkbox>
      <div class="help-text">
        启用后将使用Markdown格式发送消息，支持富文本样式
      </div>
    </div>

    <template v-if="localConfig.webhook_type === 'custom'">
      <div class="form-item">
        <label class="form-label">请求方法</label>
        <Select v-model:value="localConfig.method" placeholder="请求方法">
          <SelectOption value="POST">POST</SelectOption>
          <SelectOption value="GET">GET</SelectOption>
          <SelectOption value="PUT">PUT</SelectOption>
        </Select>
      </div>

      <div class="form-item">
        <label class="form-label">Content-Type</label>
        <Input
          v-model:value="localConfig.content_type"
          placeholder="如：application/json"
        />
      </div>

      <div class="form-item">
        <label class="form-label">自定义请求头</label>
        <!-- eslint-disable vue/html-quotes -->
        <Textarea
          v-model:value="headersText"
          placeholder='JSON格式，如：{"Authorization": "Bearer token"}'
          :rows="3"
          @blur="handleHeadersChange"
        />
        <!-- eslint-enable vue/html-quotes -->
      </div>
    </template>
  </div>
</template>

<style scoped>
.webhook-config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ant-color-text);
}

.required {
  margin-right: 4px;
  color: var(--ant-color-error);
}

.error-text {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ant-color-error);
}

.help-text {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ant-color-text-secondary);
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
