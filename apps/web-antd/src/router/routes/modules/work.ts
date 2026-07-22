import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    redirect: '/work-platform/center',
    meta: {
      icon: 'lucide:workflow',
      order: 1005,
      title: '工作',
    },
    name: 'work_platform',
    path: '/work-platform',
    children: [
      {
        component: () => import('#/views/work-platform/center/index.vue'),
        meta: {
          authority: ['work_platform_center', 'wp_workbench:view'],
          icon: 'lucide:layout-dashboard',
          title: '工作中心',
        },
        name: 'work_platform_center',
        path: '/work-platform/center',
      },
      {
        component: () => import('#/views/work-platform/tickets/list.vue'),
        meta: {
          authority: ['work_platform_tickets', 'wp_tickets:view'],
          icon: 'lucide:ticket',
          title: '工单处理',
        },
        name: 'work_platform_tickets',
        path: '/work-platform/tickets',
      },
      {
        component: () => import('#/views/work-platform/tickets/my.vue'),
        meta: {
          authority: ['work_platform_my_tickets', 'wp_my_tickets:view'],
          icon: 'lucide:user-check',
          title: '我的工单',
        },
        name: 'work_platform_my_tickets',
        path: '/work-platform/my-tickets',
      },
      {
        component: () => import('#/views/work-platform/intake/index.vue'),
        meta: {
          authority: ['work_platform_intake', 'wp_intake:create'],
          icon: 'lucide:inbox',
          title: '工单入口',
        },
        name: 'work_platform_intake',
        path: '/work-platform/intake',
      },
      {
        component: () => import('#/views/work-platform/feedback/index.vue'),
        meta: {
          authority: ['work_platform_feedback', 'wp_feedback:view'],
          icon: 'lucide:message-square-plus',
          title: '反馈建议',
        },
        name: 'work_platform_feedback',
        path: '/work-platform/feedback',
      },
      {
        component: () => import('#/views/work-platform/templates/index.vue'),
        meta: {
          authority: ['work_platform_templates', 'wp_template:view'],
          icon: 'lucide:workflow',
          title: '流程配置',
        },
        name: 'work_platform_templates',
        path: '/work-platform/templates',
      },
    ],
  },
];

export default routes;
