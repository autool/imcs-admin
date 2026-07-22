<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { Button, message, Tooltip } from 'ant-design-vue';
import { CloudCog, Network } from 'lucide-vue-next';

import { getPublicAuthMethodsApi } from '#/api/system/settings';

defineOptions({
  name: 'ThirdPartyLogin',
});

withDefaults(
  defineProps<{
    currentMode?: 'ldap' | 'local';
  }>(),
  {
    currentMode: 'local',
  },
);

const emit = defineEmits<{
  toggleLdap: [];
}>();

const oauth2Enabled = ref(false);
const ldapEnabled = ref(false);
const loading = ref(true);

// OAuth2 登录
async function handleOAuth2Login() {
  try {
    const result = await getPublicAuthMethodsApi();
    if (!result?.oauth2) {
      message.error('OAuth2 未启用');
      return;
    }
    window.location.href = '/api/v1/auth/oauth2/authorize';
  } catch (error) {
    console.error('OAuth2 登录失败:', error);
    message.error('OAuth2 登录失败');
  }
}

// LDAP 登录
function handleLdapLogin() {
  emit('toggleLdap');
}

// 加载配置
async function loadConfig() {
  try {
    loading.value = true;

    // 调用公开API获取认证方式配置
    const result = await getPublicAuthMethodsApi();

    if (result) {
      oauth2Enabled.value = result.oauth2 || false;
      ldapEnabled.value = result.ldap || false;
    }
  } catch {
    // 发生错误时，默认不显示第三方登录按钮
    oauth2Enabled.value = false;
    ldapEnabled.value = false;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <!-- 只有当至少有一个第三方登录方式启用时才显示整个区域 -->
  <div
    v-if="!loading && (oauth2Enabled || ldapEnabled)"
    class="w-full sm:mx-auto md:max-w-md"
  >
    <div class="mt-4 flex items-center justify-between">
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
      <span class="text-center text-xs uppercase text-muted-foreground">
        {{ $t('authentication.thirdPartyLogin') }}
      </span>
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
    </div>

    <div class="mt-4 flex flex-wrap justify-center gap-3">
      <Tooltip v-if="oauth2Enabled" title="OAuth2 登录" placement="top">
        <Button
          type="default"
          shape="circle"
          size="large"
          @click="handleOAuth2Login"
        >
          <template #icon>
            <CloudCog class="size-5" />
          </template>
        </Button>
      </Tooltip>
      <Tooltip v-if="ldapEnabled" title="LDAP 登录" placement="top">
        <Button
          :type="currentMode === 'ldap' ? 'primary' : 'default'"
          shape="circle"
          size="large"
          @click="handleLdapLogin"
        >
          <template #icon>
            <Network class="size-5" />
          </template>
        </Button>
      </Tooltip>
    </div>
  </div>
  <!-- 如果没有启用任何第三方登录，不显示任何内容 -->
</template>
