<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useAccessStore } from '@vben/stores';

import { notification } from 'ant-design-vue';

import { requestClient } from '#/api/request';

defineOptions({
  name: 'OAuth2Callback',
});

const router = useRouter();
const accessStore = useAccessStore();

onMounted(async () => {
  try {
    const response = await requestClient.post(
      '/auth/oauth2/result',
      {},
      { withCredentials: true },
    );

    if (response?.mfaRequired && response?.mfaChallenge) {
      sessionStorage.setItem('IMCS_MFA_CHALLENGE', response.mfaChallenge);
      await router.replace('/auth/mfa-login');
      return;
    }

    if (!response || !response.token) {
      throw new Error('获取令牌失败');
    }

    // 保存 token
    accessStore.setAccessToken(response.token);

    // 跳转到首页
    notification.success({
      message: '登录成功',
      description: 'OAuth2 认证成功',
      duration: 2,
    });

    await router.replace('/');
  } catch (error: any) {
    notification.error({
      message: '登录失败',
      description: error.message || 'OAuth2 认证失败',
      duration: 3,
    });

    // 跳转回登录页
    await router.replace('/auth/login');
  }
});
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <div class="text-center">
      <div class="mb-4 text-lg">正在处理 OAuth2 登录...</div>
      <div class="text-sm text-muted-foreground">请稍候</div>
    </div>
  </div>
</template>
