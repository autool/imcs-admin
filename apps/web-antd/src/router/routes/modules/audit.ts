import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 9998,
      title: '审计',
    },
    name: 'audit',
    path: '/audit',
    redirect: '/audit/logs',
    children: [
      {
        component: () => import('#/views/audit/operation/index.vue'),
        meta: {
          authority: ['audit_logs', 'audit_logs:view'],
          icon: 'lucide:list-checks',
          title: '操作审计',
        },
        name: 'audit_logs',
        path: '/audit/logs',
      },
    ],
  },
];

export default routes;
