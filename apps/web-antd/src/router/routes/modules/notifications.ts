import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:bell-outline',
      order: 9996,
      title: '通知',
    },
    name: 'notifications',
    path: '/notifications',
    children: [
      {
        path: '/notifications/list',
        name: 'notifications_list',
        meta: {
          authority: ['notifications_list', 'notifications_list:view'],
          icon: 'mdi:bell-ring-outline',
          title: '系统通知',
        },
        component: () => import('#/views/system/notifications/list.vue'),
      },
      {
        path: '/notifications/templates',
        name: 'notifications_templates',
        meta: {
          authority: [
            'notifications_templates',
            'notifications_templates:view',
          ],
          icon: 'mdi:file-document-edit-outline',
          title: '通知模板',
        },
        component: () =>
          import('#/views/system/notifications/templates/list.vue'),
      },
      {
        path: '/notifications/configs',
        name: 'system_notification_configs',
        meta: {
          authority: [
            'system_notification_configs',
            'system_notification_configs:view',
          ],
          icon: 'lucide:bell',
          title: '通知配置',
        },
        component: () =>
          import('#/views/system/notifications/configs/index.vue'),
      },
      {
        path: '/notifications/policies',
        name: 'system_notification_policies',
        meta: {
          authority: [
            'system_notification_policies',
            'system_notification_policies:view',
          ],
          icon: 'lucide:bell-ring',
          title: '通知策略',
        },
        component: () =>
          import('#/views/system/notifications/policies/index.vue'),
      },
    ],
  },
];

export default routes;
