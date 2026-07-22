<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  ApartmentOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import {
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Tag,
  Typography,
} from 'ant-design-vue';

const data = ref<Record<string, any>>({});

const ipTypeMeta: Record<string, { color: string; label: string }> = {
  asset: { color: 'default', label: '资产地址' },
  business: { color: 'blue', label: '业务IP' },
  firewall: { color: 'volcano', label: '防火墙' },
  management: { color: 'green', label: '管理IP' },
  security: { color: 'purple', label: '安全设备' },
  service: { color: 'cyan', label: '服务地址' },
  storage: { color: 'orange', label: '存储IP' },
  switch: { color: 'geekblue', label: '交换机' },
  terminal: { color: 'magenta', label: '终端' },
};

const statusMeta: Record<string, { color: string; label: string }> = {
  active: { color: 'success', label: '使用中' },
  error: { color: 'error', label: '异常' },
  inactive: { color: 'default', label: '未使用' },
  reserved: { color: 'warning', label: '预留' },
};

const displayLabels: Record<string, string> = {
  computer: '办公机',
  desktop: '办公机',
  firewall: '防火墙',
  laptop: '笔记本',
  notebook: '笔记本',
  pc: '办公机',
  server: '服务器',
  storage: '存储',
  switch: '交换机',
  terminal: '终端',
  waf: '防火墙',
};

function displayText(value?: string) {
  if (!value) return '-';
  return displayLabels[String(value).toLowerCase()] || value;
}

function tagMeta(
  map: Record<string, { color: string; label: string }>,
  value?: string,
) {
  return map[value || ''] || { color: 'default', label: displayText(value) };
}

const ipType = computed(() => tagMeta(ipTypeMeta, data.value.ip_type));
const status = computed(() => tagMeta(statusMeta, data.value.status));
const sourceNames = computed(() =>
  (data.value.address_sources || [data.value.address_source])
    .filter(Boolean)
    .map((item: string) => displayText(item)),
);

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
  <Drawer
    class="w-[800px]"
    title="业务地址详情"
    :body-style="{ padding: '16px' }"
  >
    <div v-if="data?.ip_address">
      <Card class="mb-4" :bordered="false" :body-style="{ padding: '16px' }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <GlobalOutlined class="text-xl text-blue-500" />
              <Typography.Text
                :content="data.ip_address"
                class="!mb-0 text-lg font-bold text-gray-800 dark:text-white"
                copyable
              />
              <Tag :color="ipType.color" class="m-0 px-2">
                {{ ipType.label }}
              </Tag>
              <Tag :color="status.color" class="m-0 px-2">
                {{ status.label }}
              </Tag>
            </div>
            <Space size="middle" class="text-xs text-gray-500">
              <span>MAC：{{ data.mac_address || '-' }}</span>
              <span>VLAN：{{ data.vlan_id || '-' }}</span>
              <span>分组：{{ data.vlan_group_name || '-' }}</span>
            </Space>
          </div>
          <Tag v-if="data.is_fused" color="processing">融合地址</Tag>
          <Tag v-else color="success">手工登记</Tag>
        </div>
      </Card>

      <Row :gutter="16">
        <Col :span="12">
          <Card class="mb-4 h-full" :bordered="false" size="small">
            <template #title>
              <Space>
                <ApartmentOutlined />
                <span>网络定位</span>
              </Space>
            </template>
            <Descriptions
              :column="1"
              size="small"
              :label-style="{
                width: '92px',
                color: '#666',
                justifyContent: 'flex-end',
              }"
            >
              <Descriptions.Item label="网段">
                {{ data.network_segment || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="网关">
                {{ data.gateway || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="子网掩码">
                {{ data.subnet_mask || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="VLAN名称">
                {{ data.vlan_name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="VLAN分组">
                {{ data.vlan_group_name || '-' }}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col :span="12">
          <Card class="mb-4 h-full" :bordered="false" size="small">
            <template #title>
              <Space>
                <DatabaseOutlined />
                <span>来源与对象</span>
              </Space>
            </template>
            <Descriptions
              :column="1"
              size="small"
              :label-style="{
                width: '92px',
                color: '#666',
                justifyContent: 'flex-end',
              }"
            >
              <Descriptions.Item label="地址来源">
                <Space wrap>
                  <Tag
                    v-for="source in sourceNames"
                    :key="source"
                    color="processing"
                  >
                    {{ source }}
                  </Tag>
                  <span v-if="sourceNames.length === 0">-</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="关联对象">
                {{ displayText(data.source_name || data.usage_purpose) }}
              </Descriptions.Item>
              <Descriptions.Item label="对象类型">
                {{ displayText(data.source_category || data.server_brand) }}
              </Descriptions.Item>
              <Descriptions.Item label="型号/分类">
                {{ displayText(data.server_model) }}
              </Descriptions.Item>
              <Descriptions.Item label="来源数量">
                {{ data.source_count || 1 }}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Card class="mb-4 h-full" :bordered="false" size="small">
            <template #title>
              <Space>
                <UserOutlined />
                <span>责任信息</span>
              </Space>
            </template>
            <Descriptions
              :column="1"
              size="small"
              :label-style="{
                width: '92px',
                color: '#666',
                justifyContent: 'flex-end',
              }"
            >
              <Descriptions.Item label="地址负责人">
                {{ data.ip_person || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="资产负责人">
                {{ data.asset_person || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="服务器地址">
                {{ data.server_ip || '-' }}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col :span="12">
          <Card class="mb-4 h-full" :bordered="false" size="small">
            <template #title>
              <Space>
                <InfoCircleOutlined />
                <span>维护状态</span>
              </Space>
            </template>
            <Descriptions
              :column="1"
              size="small"
              :label-style="{
                width: '92px',
                color: '#666',
                justifyContent: 'flex-end',
              }"
            >
              <Descriptions.Item label="维护方式">
                <Tag v-if="data.is_editable !== false" color="success">
                  可在业务地址中维护
                </Tag>
                <Tag v-else color="processing">来源系统同步，只读展示</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {{ data.created_at || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {{ data.updated_at || '-' }}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card :bordered="false" size="small">
        <template #title>
          <Space>
            <FileTextOutlined />
            <span>用途与备注</span>
          </Space>
        </template>
        <div class="mb-3">
          <div class="mb-1 flex items-center text-xs font-medium text-gray-500">
            <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            用途说明
          </div>
          <div
            class="rounded border border-blue-100 bg-blue-50/50 p-3 text-sm text-gray-800 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-gray-200"
          >
            {{ data.usage_purpose || '-' }}
          </div>
        </div>
        <div>
          <div class="mb-1 flex items-center text-xs font-medium text-gray-500">
            <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-500"></span>
            备注
          </div>
          <div
            class="whitespace-pre-wrap break-all rounded border border-gray-200 p-3 text-sm leading-relaxed dark:border-gray-700"
          >
            {{ data.notes || '-' }}
          </div>
        </div>
      </Card>
    </div>
  </Drawer>
</template>

<style scoped>
:deep(.ant-card-head) {
  min-height: 40px;
  padding: 0 16px;
  font-size: 14px;
}

:deep(.ant-card-head-title) {
  padding: 12px 0;
}

:deep(.ant-card-body) {
  padding: 16px;
}
</style>
