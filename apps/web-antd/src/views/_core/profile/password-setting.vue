<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { ProfilePasswordSetting, z } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { changePassword } from '#/api/system/user';

const router = useRouter();
const accessStore = useAccessStore();
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'old_password',
      label: '旧密码',
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请输入旧密码',
      },
      rules: 'required',
    },
    {
      fieldName: 'new_password',
      label: '新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码（至少6位）',
      },
      rules: z.string().min(6, { message: '密码至少6位' }),
    },
    {
      fieldName: 'confirm_password',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { new_password } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === new_password, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['new_password'],
      },
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  if (loading.value) return;
  loading.value = true;
  try {
    await changePassword({
      old_password: values.old_password,
      new_password: values.new_password,
    });
    message.success('密码修改成功，请重新登录');
    // 清除 token，跳转登录页
    accessStore.setAccessToken('');
    await router.replace({
      path: LOGIN_PATH,
    });
  } catch (error: any) {
    message.error(error?.message || '密码修改失败');
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
