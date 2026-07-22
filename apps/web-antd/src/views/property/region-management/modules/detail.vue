<script lang="ts" setup>
import type { RegionManagementApi } from '#/api/assets/region-management';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { EnvironmentOutlined } from '@ant-design/icons-vue';
import {
  Card,
  Descriptions,
  Divider,
  Statistic,
  Tag,
  Typography,
} from 'ant-design-vue';

const regionData = ref<RegionManagementApi.Region>();
const fmtTime = (t?: string) => (t ? t.replace('T', ' ') : '-');

const getRegionTypeText = (type: string) => {
  const texts: Record<string, string> = {
    office: '办公场所',
    datacenter: '机房',
    other: '其他',
  };
  return texts[type] || type;
};

const getStatusColor = (status: string) => {
  return status === 'normal' ? 'success' : 'error';
};

const getStatusText = (status: string) => {
  return status === 'normal' ? '正常' : '锁定';
};

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<RegionManagementApi.Region>();
      regionData.value = data;
    }
  },
});
</script>

<template>
  <Drawer
    :title="regionData?.region_name || '区域详情'"
    :body-style="{ padding: '0' }"
  >
    <div v-if="regionData">
      <div class="p-4">
        <div class="rounded bg-gray-50 p-4 dark:bg-gray-900/20">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <EnvironmentOutlined class="text-2xl text-blue-500" />
              <div>
                <div
                  class="text-xl font-semibold text-gray-800 dark:text-white"
                >
                  {{ regionData.region_name }}
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <Tag color="blue">
                    {{ getRegionTypeText(regionData.region_type) }}
                  </Tag>
                  <Tag :color="getStatusColor(regionData.status)">
                    {{ getStatusText(regionData.status) }}
                  </Tag>
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  <Typography.Text
                    v-if="regionData.region_id"
                    copyable
                    :content="regionData.region_id"
                    class="!text-gray-400"
                    style="
                      display: inline-block;
                      max-width: 360px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    "
                  >
                    {{ regionData.region_id }}
                  </Typography.Text>
                  <span v-else>-</span>
                </div>
              </div>
            </div>
            <div class="flex items-center">
              <Statistic
                title="资产数量"
                :value="regionData.asset_count || 0"
                :value-style="{ fontSize: '28px', fontWeight: 700 }"
              />
            </div>
          </div>
          <div class="mt-3 text-xs text-gray-500">
            {{ regionData.location || '-' }}
          </div>
        </div>
      </div>

      <div class="px-4">
        <Card :bordered="false" class="mx-0 shadow-sm">
          <Descriptions
            :bordered="false"
            :column="1"
            size="small"
            :label-style="{
              width: '140px',
              justifyContent: 'flex-end',
            }"
          >
            <Descriptions.Item label="区域名称">
              {{ regionData.region_name }}
            </Descriptions.Item>
            <Descriptions.Item label="上级区域">
              {{ regionData.parent_region || '-' }}
            </Descriptions.Item>

            <Descriptions.Item label="区域类型">
              <Tag color="blue">
                {{ getRegionTypeText(regionData.region_type) }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag :color="getStatusColor(regionData.status)">
                {{ getStatusText(regionData.status) }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {{ regionData.responsible_person || '-' }}
            </Descriptions.Item>

            <Descriptions.Item label="联系方式">
              {{ regionData.contact || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {{ fmtTime(regionData.created_at) }}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {{ fmtTime(regionData.updated_at) }}
            </Descriptions.Item>
          </Descriptions>
        </Card>
        <Divider class="!my-3" />
        <Card size="small" :bordered="false" class="mb-4 shadow-sm">
          <Descriptions
            :bordered="false"
            :column="1"
            :label-style="{
              width: '120px',
              justifyContent: 'flex-end',
            }"
          >
            <Descriptions.Item label="位置">
              <Typography.Text class="whitespace-pre-wrap break-words">
                {{ regionData.location || '-' }}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
        <Card size="small" :bordered="false" class="shadow-sm">
          <Descriptions
            :bordered="false"
            :column="1"
            :label-style="{
              width: '120px',
              justifyContent: 'flex-end',
            }"
          >
            <Descriptions.Item label="描述">
              <Typography.Text class="whitespace-pre-wrap break-words">
                {{ regionData.description || '-' }}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  </Drawer>
</template>
