<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleFilled,
  GlobalOutlined,
  LaptopOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import {
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Spin as ASpin,
  TabPane as ATabPane,
  Tabs as ATabs,
  Tag as ATag,
  Timeline as ATimeline,
  TimelineItem as ATimelineItem,
  message,
} from 'ant-design-vue';

import {
  getTerminalAssetDetailApi,
  getTerminalAssetHistoryApi,
} from '#/api/terminal';

const data = ref<Record<string, any>>({});
const historyData = ref<Array<Record<string, any>>>([]);
const activeTab = ref('info');
const loading = ref(false);
const historyLoading = ref(false);

// 加载资产详情
async function loadAssetDetail(assetId: string) {
  try {
    loading.value = true;
    const response = await getTerminalAssetDetailApi(assetId);
    data.value = response;
  } catch (error) {
    console.error('Failed to load asset detail:', error);
    message.error('加载资产详情失败');
  } finally {
    loading.value = false;
  }
}

// 加载资产历史记录
async function loadHistory(assetId: string) {
  try {
    historyLoading.value = true;
    const response = await getTerminalAssetHistoryApi(assetId);
    historyData.value = response;
  } catch (error) {
    console.error('Failed to load history:', error);
    message.error('加载历史记录失败');
  } finally {
    historyLoading.value = false;
  }
}

// 获取变更类型标签
function getChangeTypeTag(type: string) {
  const typeMap: Record<string, { color: string; text: string }> = {
    create: { color: 'green', text: '创建' },
    update: { color: 'blue', text: '更新' },
    transfer: { color: 'orange', text: '转移' },
    retire: { color: 'red', text: '报废' },
  };
  return typeMap[type] || { color: 'default', text: type };
}

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
      const assetId = drawerData?.id;

      // 初始化
      data.value = {};
      historyData.value = [];
      activeTab.value = 'info';

      // 加载资产详情
      if (assetId) {
        loadAssetDetail(assetId);
      }
    }
  },
});

// 监听标签页切换，加载历史记录
function handleTabChange(key: unknown) {
  if (
    String(key) === 'history' &&
    historyData.value.length === 0 &&
    data.value.id
  ) {
    loadHistory(data.value.id);
  }
}

// 获取类型文字
function getAssetTypeText(type: string) {
  const map: Record<string, string> = {
    computer: '台式机',
    laptop: '笔记本',
    monitor: '显示器',
    printer: '打印机',
    scanner: '扫描仪',
  };
  return map[type] || type || '-';
}

// 获取状态文字
function getStatusText(status: string) {
  const map: Record<string, string> = {
    active: '正常',
    maintenance: '维护中',
    inactive: '停用',
    retired: '报废',
  };
  return map[status] || status || '-';
}

// 暴露open方法
defineExpose({
  open: (params: { id: string }) => {
    drawerApi.setData(params);
    drawerApi.open();
  },
});
</script>

<template>
  <Drawer class="w-1/2" title="终端资产详情">
    <ASpin :spinning="loading">
      <div v-if="data.id" class="flex flex-col gap-4">
        <!-- 顶部标题行 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <LaptopOutlined class="text-2xl text-blue-500" />
            <div>
              <span class="text-lg font-medium">{{
                data.tag_number || '未知资产号'
              }}</span>
              <ATag
                :color="
                  getAssetTypeText(data.asset_type) === '笔记本'
                    ? 'purple'
                    : 'blue'
                "
                class="ml-2"
              >
                {{ getAssetTypeText(data.asset_type) }}
              </ATag>
            </div>
          </div>
          <ATag
            :color="
              data.status === 'active' || data.status === '正常'
                ? 'green'
                : data.status === 'maintenance'
                  ? 'orange'
                  : 'red'
            "
          >
            {{ getStatusText(data.status) }}
          </ATag>
        </div>

        <ATabs
          v-model:active-key="activeTab"
          size="small"
          @change="handleTabChange"
        >
          <!-- 基本信息 -->
          <ATabPane key="info" tab="基本信息">
            <div class="space-y-3">
              <!-- 资产信息 -->
              <div class="rounded-lg border p-3">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ClockCircleOutlined class="text-blue-500" />
                  资产信息
                </div>
                <ADescriptions :column="2" bordered size="small">
                  <ADescriptionsItem label="资产号">
                    {{ data.tag_number || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="品牌">
                    {{ data.brand_name || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="型号">
                    {{ data.model_name || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="序列号">
                    {{ data.serial_number || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="责任人">
                    {{ data.asset_person || '-' }}
                  </ADescriptionsItem>
                </ADescriptions>
              </div>

              <!-- 网络信息 -->
              <div class="rounded-lg border p-3">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <GlobalOutlined class="text-green-500" />
                  网络信息
                </div>
                <ADescriptions :column="3" bordered size="small">
                  <ADescriptionsItem label="IP地址">
                    {{ data.ip_address || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="MAC地址">
                    {{ data.mac_address || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="主机名">
                    {{ data.hostname || '-' }}
                  </ADescriptionsItem>
                </ADescriptions>
              </div>

              <!-- 硬件信息 -->
              <div class="rounded-lg border p-3">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <LaptopOutlined class="text-purple-500" />
                  硬件信息
                </div>
                <ADescriptions :column="2" bordered size="small">
                  <ADescriptionsItem label="CPU">
                    {{ data.cpu_model || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="内存">
                    {{ data.memory_size ? `${data.memory_size} GB` : '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="硬盘">
                    {{ data.disk_size ? `${data.disk_size} GB` : '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="操作系统">
                    {{ data.os_type || '-' }}
                  </ADescriptionsItem>
                </ADescriptions>
              </div>

              <!-- 使用信息 -->
              <div class="rounded-lg border p-3">
                <div class="mb-2 flex items-center gap-2 text-sm font-medium">
                  <UserOutlined class="text-orange-500" />
                  使用信息
                </div>
                <ADescriptions :column="2" bordered size="small">
                  <ADescriptionsItem label="使用人">
                    {{ data.user_name || '-' }}
                  </ADescriptionsItem>
                  <ADescriptionsItem label="使用部门">
                    {{ data.user_dept || '-' }}
                  </ADescriptionsItem>
                </ADescriptions>
              </div>
            </div>
          </ATabPane>

          <!-- 变更记录 -->
          <ATabPane key="history" tab="变更记录">
            <ASpin :spinning="historyLoading">
              <div v-if="historyData.length > 0" class="rounded-lg border p-4">
                <ATimeline>
                  <ATimelineItem
                    v-for="item in historyData"
                    :key="item.id"
                    :color="getChangeTypeTag(item.change_type).color"
                  >
                    <div class="mb-1 flex items-center gap-2">
                      <ATag
                        :color="getChangeTypeTag(item.change_type).color"
                        size="small"
                      >
                        {{ getChangeTypeTag(item.change_type).text }}
                      </ATag>
                      <span class="text-xs text-gray-400">{{
                        item.created_at
                      }}</span>
                    </div>
                    <div class="space-y-1 text-sm">
                      <div v-if="item.user_name || item.user_dept">
                        <UserOutlined class="mr-1 text-gray-400" />
                        <span class="font-medium">{{ item.user_name }}</span>
                        <span v-if="item.user_dept" class="ml-1 text-gray-500">
                          ({{ item.user_dept }})
                        </span>
                      </div>
                      <div v-if="item.ip_address">
                        <GlobalOutlined class="mr-1 text-gray-400" />
                        <span class="font-medium">{{ item.ip_address }}</span>
                      </div>
                      <div v-if="item.location">
                        <EnvironmentOutlined class="mr-1 text-gray-400" />
                        <span class="font-medium">{{ item.location }}</span>
                      </div>
                      <div v-if="item.change_reason" class="text-gray-600">
                        <ExclamationCircleFilled class="mr-1 text-gray-400" />
                        <span class="font-medium">{{
                          item.change_reason
                        }}</span>
                      </div>
                      <div v-if="item.operator" class="text-xs text-gray-400">
                        操作人：{{ item.operator }}
                      </div>
                    </div>
                  </ATimelineItem>
                </ATimeline>
              </div>
              <div v-else class="py-12 text-center text-gray-400">
                暂无变更记录
              </div>
            </ASpin>
          </ATabPane>
        </ATabs>
      </div>
    </ASpin>
  </Drawer>
</template>
