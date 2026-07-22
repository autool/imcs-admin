<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'MfaLogin' });

const MFA_CHALLENGE_STORAGE_KEY = 'IMCS_MFA_CHALLENGE';
const authStore = useAuthStore();
const router = useRouter();

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInput',
    componentProps: {
      autocomplete: 'one-time-code',
      maxlength: 16,
      placeholder: '请输入 6 位动态验证码或备用恢复码',
    },
    fieldName: 'code',
    label: '动态验证码或备用恢复码',
    rules: z
      .string()
      .min(6, { message: '请输入有效的动态验证码或备用恢复码' })
      .max(16, { message: '验证码长度不能超过 16 位' }),
  },
]);

async function handleVerify(values: Recordable<any>) {
  const challenge = sessionStorage.getItem(MFA_CHALLENGE_STORAGE_KEY);
  if (!challenge) {
    message.warning('登录验证已失效，请重新输入账号密码');
    await router.replace('/auth/login');
    return;
  }

  const code = String(values.code || '')
    .trim()
    .replaceAll(' ', '')
    .replaceAll('-', '');
  const userInfo = await authStore.verifyMfa(challenge, code);
  if (userInfo) {
    sessionStorage.removeItem(MFA_CHALLENGE_STORAGE_KEY);
  }
}

onMounted(async () => {
  if (!sessionStorage.getItem(MFA_CHALLENGE_STORAGE_KEY)) {
    await router.replace('/auth/login');
  }
});
</script>

<template>
  <AuthenticationCodeLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    sub-title="账号已启用多因素认证，请输入认证器动态码；也可以使用一条备用恢复码。"
    submit-button-text="验证并登录"
    title="多因素认证"
    @submit="handleVerify"
  />
</template>
