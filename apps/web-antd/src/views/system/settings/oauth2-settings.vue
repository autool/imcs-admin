<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { SystemSettingsApi } from '#/api/system/settings';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Form, Input, message, Space, Switch } from 'ant-design-vue';

import {
  getOAuth2ConfigApi,
  MASKED_SECRET_VALUE,
  saveOAuth2ConfigApi,
  testOAuth2ConnectionApi,
} from '#/api/system/settings';

defineOptions({ name: 'OAuth2Settings' });

const formRef = ref();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const testing = ref(false);
const canManageSettings = hasAccessByCodes(['system_settings:config']);

const formState = ref<SystemSettingsApi.OAuth2Config>({
  enabled: false,
  clientId: '',
  clientSecret: '',
  authorizeUrl: '',
  tokenUrl: '',
  userinfoUrl: '',
  scope: '',
});

const rules: Record<string, Rule[]> = {
  clientId: [
    {
      required: true,
      message: '请输入 Client ID',
      trigger: 'blur',
      type: 'string',
    },
  ],
  clientSecret: [
    {
      required: true,
      message: '请输入 Client Secret',
      trigger: 'blur',
      type: 'string',
    },
  ],
  authorizeUrl: [
    {
      required: true,
      message: '请输入授权 URL',
      trigger: 'blur',
      type: 'string',
    },
  ],
  tokenUrl: [
    {
      required: true,
      message: '请输入 Token URL',
      trigger: 'blur',
      type: 'string',
    },
  ],
  userinfoUrl: [
    {
      required: true,
      message: '请输入用户信息 URL',
      trigger: 'blur',
      type: 'string',
    },
  ],
};

async function loadConfig() {
  try {
    loading.value = true;
    const response = await getOAuth2ConfigApi();
    if (response) {
      formState.value = response;
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!canManageSettings) {
    message.warning('无权限保存系统设置');
    return;
  }
  try {
    await formRef.value.validate();
    loading.value = true;
    await saveOAuth2ConfigApi(formState.value);
    message.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

async function handleTest() {
  if (!canManageSettings) {
    message.warning('无权限测试 OAuth2 连接');
    return;
  }
  try {
    testing.value = true;
    await testOAuth2ConnectionApi();
    message.success('连接测试成功');
  } catch (error) {
    console.error('测试失败:', error);
    message.error('连接测试失败');
  } finally {
    testing.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <div class="oauth2-settings">
    <Form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 14 }"
    >
      <Form.Item label="启用 OAuth2" name="enabled">
        <Switch v-model:checked="formState.enabled" />
      </Form.Item>

      <Form.Item label="Client ID" name="clientId">
        <Input
          v-model:value="formState.clientId"
          placeholder="请输入 OAuth2 Client ID"
        />
      </Form.Item>

      <Form.Item label="Client Secret" name="clientSecret">
        <Input.Password
          v-model:value="formState.clientSecret"
          placeholder="请输入新的 OAuth2 Client Secret"
        />
        <div class="secret-field-help">
          显示
          {{ MASKED_SECRET_VALUE }}
          表示已配置密钥；保持不变会继续使用原密钥，输入新值才会替换。
        </div>
      </Form.Item>

      <Form.Item label="授权 URL" name="authorizeUrl">
        <Input
          v-model:value="formState.authorizeUrl"
          placeholder="https://oauth2-provider.com/authorize"
        />
      </Form.Item>

      <Form.Item label="Token URL" name="tokenUrl">
        <Input
          v-model:value="formState.tokenUrl"
          placeholder="https://oauth2-provider.com/token"
        />
      </Form.Item>

      <Form.Item label="用户信息 URL" name="userinfoUrl">
        <Input
          v-model:value="formState.userinfoUrl"
          placeholder="https://oauth2-provider.com/userinfo"
        />
      </Form.Item>

      <Form.Item label="Scope" name="scope">
        <Input
          v-model:value="formState.scope"
          placeholder="可选，如: openid profile（留空则不传递 scope 参数）"
        />
      </Form.Item>

      <Form.Item :wrapper-col="{ offset: 6, span: 14 }">
        <Space>
          <Button
            v-access:code="['system_settings:config']"
            type="primary"
            :loading="loading"
            @click="handleSave"
          >
            保存配置
          </Button>
          <Button
            v-access:code="['system_settings:config']"
            :loading="testing"
            @click="handleTest"
          >
            测试连接
          </Button>
        </Space>
      </Form.Item>
    </Form>

    <div class="mt-4 rounded bg-muted p-4 dark:bg-gray-800">
      <h4 class="mb-2 font-semibold text-foreground">配置说明：</h4>
      <ul class="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        <li>Client ID 和 Client Secret 需要从 OAuth2 提供商处获取</li>
        <li>授权 URL 是用户授权的页面地址</li>
        <li>Token URL 是用于交换访问令牌的接口地址</li>
        <li>用户信息 URL 是获取用户详细信息的接口地址</li>
        <li>配置完成后，用户可以在登录页面使用 OAuth2 登录</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.oauth2-settings {
  max-width: 800px;
}

.secret-field-help {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ant-color-text-secondary);
}
</style>
