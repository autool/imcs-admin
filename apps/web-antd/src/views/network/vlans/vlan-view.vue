<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
} from 'ant-design-vue';

const data = ref<Record<string, any>>({});

const [Drawer, drawerApi] = useVbenDrawer({
  closable: true,
  cancelText: '关闭',
  showCancelButton: true,
  showConfirmButton: false,
  onCancel() {
    drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const drawerData = drawerApi.getData<Record<string, any>>();
      data.value = drawerData?.values || {};
    } else {
      data.value = {};
    }
  },
});
</script>

<template>
  <Drawer class="w-1/2" title="VLAN详情">
    <div v-if="data" class="space-y-4 p-4">
      <!-- 基本信息 -->
      <div class="rounded-lg border p-4">
        <div class="mb-2 text-lg font-medium">基本信息</div>
        <ADescriptions :column="2" bordered size="small">
          <ADescriptionsItem label="VLAN ID">
            {{ data.vlan_id || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="VLAN名称">
            {{ data.vlan_name || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="网段">
            {{ data.network_segment || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="网关">
            {{ data.gateway || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="子网掩码">
            {{ data.subnet_mask || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="状态">
            {{
              data.status === 'active'
                ? '启用'
                : data.status === 'inactive'
                  ? '停用'
                  : data.status || '-'
            }}
          </ADescriptionsItem>
          <ADescriptionsItem label="使用IP数" :span="2">
            {{ data.ip_count || 0 }}
          </ADescriptionsItem>
        </ADescriptions>
      </div>

      <!-- 其他信息 -->
      <div class="rounded-lg border p-4">
        <div class="mb-2 text-lg font-medium">其他信息</div>
        <ADescriptions :column="1" bordered size="small">
          <ADescriptionsItem label="描述">
            {{ data.description || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="创建时间">
            {{ data.created_at || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="更新时间">
            {{ data.updated_at || '-' }}
          </ADescriptionsItem>
        </ADescriptions>
      </div>
    </div>
  </Drawer>
</template>
