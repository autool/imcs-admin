import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'docs',
    path: '/docs',
    component: () => import('#/views/docs/index.vue'),
    meta: {
      icon: 'lucide:book-open',
      title: '操作手册',
      hideInMenu: true,
    },
  },
];

export default routes;
