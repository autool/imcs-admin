import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ion:settings-outline',
      order: 9997,
      title: $t('system.title'),
    },
    name: 'system',
    path: '/system',
    children: [
      {
        path: '/system/role',
        name: 'system_role',
        meta: {
          authority: ['system_role', 'system_role:view'],
          icon: 'mdi:account-group',
          title: $t('system.role.title'),
        },
        component: () => import('#/views/system/role/list.vue'),
      },
      {
        path: '/system/menu',
        name: 'system_menu',
        meta: {
          authority: ['system_menu', 'system_menu:view'],
          icon: 'mdi:menu',
          title: $t('system.menu.title'),
        },
        component: () => import('#/views/system/menu/list.vue'),
      },
      {
        path: '/system/dept',
        name: 'system_dept',
        meta: {
          authority: ['system_dept', 'system_dept:view'],
          icon: 'mdi:office-building',
          title: $t('system.dept.title'),
        },
        component: () => import('#/views/system/dept/list.vue'),
      },
      {
        path: '/system/user',
        name: 'system_user',
        meta: {
          authority: ['system_user', 'system_user:view'],
          icon: 'mdi:account',
          title: $t('system.user.title'),
        },
        component: () => import('#/views/system/user/list.vue'),
      },
      {
        path: '/system/settings',
        name: 'system_settings',
        meta: {
          authority: ['system_settings', 'system_settings:view'],
          icon: 'mdi:shield-account',
          title: '认证设置',
        },
        component: () => import('#/views/system/settings/index.vue'),
      },
      {
        path: '/system/ai',
        name: 'system_ai',
        meta: {
          authority: ['system_ai', 'system_ai:view'],
          icon: 'mdi:robot',
          title: 'AI管理',
        },
        component: () => import('#/views/system/ai/index.vue'),
      },
      {
        path: '/system/nodes',
        name: 'system_nodes',
        meta: {
          authority: ['system_nodes', 'system_nodes:view'],
          icon: 'mdi:server-network',
          title: '节点管理',
        },
        component: () => import('#/views/system/nodes/list.vue'),
      },
      {
        path: '/system/default-credentials',
        name: 'system_default_credentials',
        meta: {
          authority: [
            'system_default_credentials',
            'system_default_credentials:view',
          ],
          icon: 'mdi:key-chain',
          title: '凭证管理',
        },
        component: () => import('#/views/system/default-credentials/index.vue'),
      },
      {
        path: '/system/sms-gateway',
        name: 'sms_gateway',
        meta: {
          authority: ['sms_gateway', 'sms_gateway:view'],
          icon: 'lucide:send',
          title: '短信网关',
        },
        component: () => import('#/views/system/sms-gateway/list.vue'),
      },
    ],
  },
  {
    name: 'Profile',
    path: '/profile',
    component: () => import('#/views/_core/profile/index.vue'),
    meta: {
      icon: 'lucide:user',
      hideInMenu: true,
      title: '个人中心',
    },
  },
];

export default routes;
