<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Profile } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { getMyProfile } from '#/api/system/user';

import ProfileBase from './base-setting.vue';
import ProfileNotificationSetting from './notification-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';
import ProfileSecuritySetting from './security-setting.vue';

const userStore = useUserStore();

const tabsValue = ref<string>('basic');
const authType = ref('local');

const isLdapUser = computed(() => authType.value === 'ldap');

function goToPassword() {
  if (isLdapUser.value) {
    return;
  }
  tabsValue.value = 'password';
}

const tabs = computed(() => {
  const items = [
    {
      label: '基本设置',
      value: 'basic',
    },
    {
      label: '安全设置',
      value: 'security',
    },
    {
      label: '新消息提醒',
      value: 'notice',
    },
  ];
  if (!isLdapUser.value) {
    items.splice(2, 0, {
      label: '修改密码',
      value: 'password',
    });
  }
  return items;
});

onMounted(async () => {
  try {
    const profile = await getMyProfile();
    authType.value = profile?.auth_type || 'local';
    userStore.setUserInfo({
      ...userStore.userInfo,
      auth_type: authType.value,
    } as any);
  } catch {
    authType.value = userStore.userInfo?.auth_type || 'local';
  }
});
</script>
<template>
  <Profile
    v-model:model-value="tabsValue"
    title="个人中心"
    :user-info="userStore.userInfo"
    :tabs="tabs"
  >
    <template #content>
      <ProfileBase v-if="tabsValue === 'basic'" />
      <ProfileSecuritySetting
        v-if="tabsValue === 'security'"
        @go-to-password="goToPassword"
      />
      <ProfilePasswordSetting v-if="tabsValue === 'password' && !isLdapUser" />
      <ProfileNotificationSetting v-if="tabsValue === 'notice'" />
    </template>
  </Profile>
</template>
