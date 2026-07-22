import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:list-todo',
      order: 1003,
      title: '任务',
    },
    name: 'tasks',
    path: '/tasks',
    redirect: '/tasks/scheduled',
    children: [
      {
        component: () => import('#/views/tasks/scheduled/list.vue'),
        meta: {
          authority: ['tasks_scheduled', 'tasks_scheduled:view'],
          icon: 'lucide:clock',
          title: '定时任务',
        },
        name: 'tasks_scheduled',
        path: '/tasks/scheduled',
      },
      {
        component: () => import('#/views/tasks/queue/index.vue'),
        meta: {
          authority: ['tasks_queue', 'tasks_queue:view'],
          icon: 'lucide:list-tree',
          title: '任务队列',
        },
        name: 'tasks_queue',
        path: '/tasks/queue',
      },
      {
        component: () => import('#/views/tasks/execution/list.vue'),
        meta: {
          authority: ['tasks_execution', 'tasks_execution:view'],
          icon: 'lucide:history',
          title: '执行记录',
        },
        name: 'tasks_execution',
        path: '/tasks/execution',
      },
    ],
  },
];

export default routes;
