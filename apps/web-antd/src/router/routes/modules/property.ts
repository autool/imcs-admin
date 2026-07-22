import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:notebook',
      order: 1001,
      title: '资产',
    },
    name: 'property',
    path: '/property',
    children: [
      {
        name: 'property_servers',
        path: '/property/servers',
        component: () => import('#/views/property/servers/index.vue'),
        meta: {
          authority: ['property_servers', 'property_servers:view'],
          icon: 'lucide:server',
          title: '服务器管理',
        },
      },
      {
        name: 'property_server_adapters',
        path: '/property/server-adapters',
        component: () => import('#/views/property/server-adapters/index.vue'),
        meta: {
          authority: [
            'property_server_adapters',
            'property_server_adapters:view',
          ],
          icon: 'lucide:puzzle',
          title: '服务器适配器',
        },
      },
      {
        name: 'servers-import-history',
        path: '/property/servers/import-history',
        component: () => import('#/views/property/servers/import-history.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:history',
          title: '导入历史',
        },
      },
      {
        name: 'property_infra',
        path: '/property/infra',
        component: () => import('#/views/property/infra/index.vue'),
        meta: {
          authority: ['property_infra', 'property_infra:view'],
          icon: 'mdi:server-network',
          title: '基础设施资产',
        },
      },
      {
        name: 'property_terminal',
        path: '/property/terminal',
        component: () => import('#/views/property/terminal/index.vue'),
        meta: {
          authority: ['property_terminal', 'property_terminal:view'],
          icon: 'lucide:computer',
          title: '终端资产',
        },
      },
      {
        name: 'property_alert_config',
        path: '/property/alert-config',
        component: () => import('#/views/property/alert-config/index.vue'),
        meta: {
          authority: ['property_alert_config', 'property_alert_config:view'],
          icon: 'lucide:bell-ring',
          title: '告警配置',
        },
      },
      {
        name: 'property_alert_management',
        path: '/property/alert-management',
        component: () => import('#/views/property/alert-management/index.vue'),
        meta: {
          authority: [
            'property_alert_management',
            'property_alert_management:view',
          ],
          icon: 'lucide:alert-triangle',
          title: '告警管理',
        },
      },
      {
        name: 'property_region_management',
        path: '/property/region-management',
        component: () => import('#/views/property/region-management/index.vue'),
        meta: {
          authority: [
            'property_region_management',
            'property_region_management:view',
          ],
          icon: 'lucide:map-pin',
          title: '区域管理',
        },
      },
      {
        name: 'property_priority_group',
        path: '/property/priority-group',
        component: () => import('#/views/property/priority-group/index.vue'),
        meta: {
          authority: [
            'property_priority_group',
            'property_priority_group:view',
          ],
          icon: 'lucide:layers',
          title: '优先级分组',
        },
      },
    ],
  },
];

export default routes;
