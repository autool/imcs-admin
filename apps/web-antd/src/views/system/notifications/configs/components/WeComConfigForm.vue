<script lang="ts" setup>
import type { NotificationConfigApi } from '#/api/system/notification-configs';

import { reactive, watch } from 'vue';

import { Alert, Input, InputPassword } from 'ant-design-vue';

interface Props {
  config: NotificationConfigApi.WeComConfig;
}

interface Emits {
  (e: 'update:config', value: NotificationConfigApi.WeComConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localConfig = reactive<NotificationConfigApi.WeComConfig>({
  corp_id: '',
  agent_id: '',
  secret: '',
  to_user: '@all',
  to_party: '',
  to_tag: '',
});

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
  <div class="wecom-config-form">
    <Alert
      message="企业微信应用配置说明"
      description="需要在企业微信管理后台创建应用，获取企业ID、应用AgentId和Secret"
      type="info"
      show-icon
      class="mb-4"
    />

    <div class="form-item">
      <label class="form-label"><span class="required">*</span> 企业ID</label>
      <Input v-model:value="localConfig.corp_id" placeholder="企业微信企业ID" />
      <div v-if="!localConfig.corp_id" class="error-text">请输入企业ID</div>
    </div>

    <div class="form-item">
      <label class="form-label">
        <span class="required">*</span> 应用AgentId
      </label>
      <Input v-model:value="localConfig.agent_id" placeholder="应用的AgentId" />
      <div v-if="!localConfig.agent_id" class="error-text">
        请输入应用AgentId
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">
        <span class="required">*</span> 应用Secret
      </label>
      <InputPassword
        v-model:value="localConfig.secret"
        placeholder="应用的Secret密钥"
      />
      <div v-if="!localConfig.secret" class="error-text">请输入应用Secret</div>
    </div>

    <div class="form-item">
      <label class="form-label">接收人</label>
      <Input
        v-model:value="localConfig.to_user"
        placeholder="用户ID，多个用|分隔，@all表示全部"
      />
      <div class="help-text">默认@all表示发送给全部成员</div>
    </div>

    <div class="form-item">
      <label class="form-label">接收部门</label>
      <Input
        v-model:value="localConfig.to_party"
        placeholder="部门ID，多个用|分隔"
      />
    </div>

    <div class="form-item">
      <label class="form-label">接收标签</label>
      <Input
        v-model:value="localConfig.to_tag"
        placeholder="标签ID，多个用|分隔"
      />
    </div>
  </div>
</template>

<style scoped>
.wecom-config-form {
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
