<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import ThirdPartyLogin from './third-party-login.vue';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const router = useRouter();
const authMode = ref<'ldap' | 'local'>('local');
const MFA_CHALLENGE_STORAGE_KEY = 'IMCS_MFA_CHALLENGE';

const loginSubtitle = computed(() =>
  authMode.value === 'ldap'
    ? '已切换为 LDAP 登录，请输入目录账号和密码'
    : $t('authentication.loginSubtitle'),
);

const submitButtonText = computed(() =>
  authMode.value === 'ldap' ? 'LDAP 登录' : '',
);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    // {
    //   component: 'VbenSelect',
    //   componentProps: {
    //     options: MOCK_USER_OPTIONS,
    //     placeholder: $t('authentication.selectAccount'),
    //   },
    //   fieldName: 'selectAccount',
    //   label: $t('authentication.selectAccount'),
    //   rules: z
    //     .string()
    //     .min(1, { message: $t('authentication.selectAccount') })
    //     .optional()
    //     .default('admin'),
    // },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      // dependencies: {
      //   trigger(values, form) {
      //     if (values.selectAccount) {
      //       const findUser = MOCK_USER_OPTIONS.find(
      //         (item) => item.value === values.selectAccount,
      //       );
      //       if (findUser) {
      //         form.setValues({
      //           username: findUser.value,
      //         });
      //       }
      //     }
      //   },
      //   triggerFields: ['selectAccount'],
      // },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  const result = await authStore.authLogin(values, authMode.value);
  if (result.mfaRequired && result.mfaChallenge) {
    sessionStorage.setItem(MFA_CHALLENGE_STORAGE_KEY, result.mfaChallenge);
    await router.push('/auth/mfa-login');
  }
}

function handleToggleLdapMode() {
  authMode.value = authMode.value === 'ldap' ? 'local' : 'ldap';
  if (authMode.value === 'ldap') {
    message.info('已切换为 LDAP 登录，请输入目录账号和密码');
    return;
  }
  message.info('已切换为本地登录');
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-third-party-login="true"
    :sub-title="loginSubtitle"
    :submit-button-text="submitButtonText"
    @submit="handleSubmit"
  >
    <template #third-party-login>
      <ThirdPartyLogin
        :current-mode="authMode"
        @toggle-ldap="handleToggleLdapMode"
      />
    </template>
  </AuthenticationLogin>
</template>
