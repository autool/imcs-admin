<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Tabs } from 'ant-design-vue';

import LdapSettings from './ldap-settings.vue';
import OAuth2Settings from './oauth2-settings.vue';

defineOptions({ name: 'AuthSettings' });

const activeTab = ref('oauth2');
</script>

<template>
  <Page title="认证设置" description="配置第三方认证方式">
    <Card>
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane key="oauth2" tab="OAuth2 配置">
          <OAuth2Settings />
        </Tabs.TabPane>
        <Tabs.TabPane key="ldap" tab="LDAP 配置">
          <LdapSettings />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
