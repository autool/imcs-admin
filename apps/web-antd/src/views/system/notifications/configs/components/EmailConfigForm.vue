<script lang="ts" setup>
import type { NotificationConfigApi } from '#/api/system/notification-configs';

import { reactive, watch } from 'vue';

import { Checkbox, Input, InputNumber, InputPassword } from 'ant-design-vue';

interface Props {
  config: NotificationConfigApi.EmailConfig;
}

interface Emits {
  (e: 'update:config', value: NotificationConfigApi.EmailConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localConfig = reactive<NotificationConfigApi.EmailConfig>({
  smtp_host: '',
  smtp_port: 465,
  smtp_user: '',
  smtp_password: '',
  from_email: '',
  from_name: '',
  use_tls: false,
  use_ssl: true,
});

// 邮箱验证
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email);
}

// 监听配置变化
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig && Object.keys(newConfig).length > 0) {
      Object.assign(localConfig, newConfig);
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
</script>

<template>
  <div class="email-config-form">
    <div class="form-item">
      <label class="form-label">
        <span class="required">*</span> SMTP服务器
      </label>
      <Input
        v-model:value="localConfig.smtp_host"
        placeholder="如：smtp.example.com"
      />
      <div v-if="!localConfig.smtp_host" class="error-text">
        请输入SMTP服务器地址
      </div>
    </div>

    <div class="form-item">
      <label class="form-label"><span class="required">*</span> SMTP端口</label>
      <InputNumber
        v-model:value="localConfig.smtp_port"
        :min="1"
        :max="65535"
        placeholder="如：465"
        class="w-full"
      />
      <div v-if="!localConfig.smtp_port" class="error-text">请输入SMTP端口</div>
    </div>

    <div class="form-item">
      <label class="form-label">
        <span class="required">*</span> SMTP用户名
      </label>
      <Input
        v-model:value="localConfig.smtp_user"
        placeholder="SMTP登录用户名"
      />
      <div v-if="!localConfig.smtp_user" class="error-text">
        请输入SMTP用户名
      </div>
    </div>

    <div class="form-item">
      <label class="form-label"><span class="required">*</span> SMTP密码</label>
      <InputPassword
        v-model:value="localConfig.smtp_password"
        placeholder="SMTP登录密码"
      />
      <div v-if="!localConfig.smtp_password" class="error-text">
        请输入SMTP密码
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">
        <span class="required">*</span> 发件人邮箱
      </label>
      <Input
        v-model:value="localConfig.from_email"
        placeholder="如：noreply@example.com"
      />
      <div v-if="!localConfig.from_email" class="error-text">
        请输入发件人邮箱
      </div>
      <div v-else-if="!isValidEmail(localConfig.from_email)" class="error-text">
        请输入有效的邮箱地址
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">发件人名称</label>
      <Input v-model:value="localConfig.from_name" placeholder="如：IMCS系统" />
    </div>

    <div class="form-item">
      <Checkbox v-model:checked="localConfig.use_tls">使用TLS加密</Checkbox>
    </div>

    <div class="form-item">
      <Checkbox v-model:checked="localConfig.use_ssl">使用SSL加密</Checkbox>
    </div>
  </div>
</template>

<style scoped>
.email-config-form {
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
</style>
