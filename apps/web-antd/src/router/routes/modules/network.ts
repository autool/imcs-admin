import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:network',
      order: 1000,
      title: '网络',
    },
    name: 'Network',
    path: '/network',
    children: [
      {
        name: 'business-ips',
        path: '/network/business-ips',
        component: () => import('#/views/network/business-ips/index.vue'),
        meta: {
          authority: ['network_business_ips', 'network_business_ips:view'],
          icon: 'lucide:globe',
          title: '业务地址',
        },
      },
      {
        name: 'vlans',
        path: '/network/vlans',
        component: () => import('#/views/network/vlans/index.vue'),
        meta: {
          authority: ['network_vlans', 'network_vlans:view'],
          icon: 'lucide:layers',
          title: 'VLAN管理',
        },
      },
      {
        name: 'vlan-groups',
        path: '/network/vlan-groups',
        component: () => import('#/views/network/vlan-groups/index.vue'),
        meta: {
          authority: ['network_vlan_groups', 'network_vlan_groups:view'],
          icon: 'lucide:folder',
          title: 'VLAN分组',
        },
      },
    ],
  },
];

export default routes;
