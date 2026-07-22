<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  message,
} from 'ant-design-vue';

import { getCabinetServers } from '#/api/infra';
import { getServerDetailsApi } from '#/api/servers';
import {
  resolveServerModelImage,
  resolveServerUPositionImage,
} from '#/utils/server-model-assets';

const data = ref<Record<string, any>>({});
const selectedServer = ref<null | Record<string, any>>(null);
const selectedServerDetails = ref<null | Record<string, any>>(null);
const cabinetServers = ref<Array<Record<string, any>>>([]);

// 生成42U机柜的U位数组
const uPositions = Array.from({ length: 42 }, (_, i) => 42 - i);

// 加载机柜中的服务器
async function loadCabinetServers(cabinetId: string) {
  try {
    const res = await getCabinetServers(cabinetId);

    cabinetServers.value = Array.isArray(res) ? res : [];

    // 如果当前有选中的服务器，确保它在列表中被正确识别
    if (selectedServer.value && selectedServer.value.id) {
      const found = cabinetServers.value.find(
        (s) => s.id === selectedServer.value?.id,
      );
      if (found) {
        // 更新selectedServer为机柜列表中的对象，确保引用一致
        selectedServer.value = found;
      }
    }
  } catch (error) {
    console.error('Failed to load cabinet servers:', error);
    message.error('加载机柜服务器失败');
  }
}

// 加载服务器详细信息
async function loadServerDetails(serverId: string) {
  try {
    const res = await getServerDetailsApi(serverId);

    // requestClient已经提取了data字段
    const detailsData = res?.data || res;
    selectedServerDetails.value = detailsData;
  } catch (error) {
    console.error('Failed to load server details:', error);
    message.error('加载服务器详情失败');
  }
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
      data.value = drawerData?.values || {};

      // 初始化
      selectedServer.value = null;
      selectedServerDetails.value = null;
      cabinetServers.value = [];

      const currentProductId = data.value.product_id;

      // 先加载机柜中的所有服务器
      if (data.value.cabinet_id) {
        loadCabinetServers(data.value.cabinet_id).then(() => {
          // 机柜加载完成后，查找并选中当前服务器
          if (currentProductId) {
            const currentServer = cabinetServers.value.find(
              (s) => s.id === currentProductId,
            );
            if (currentServer) {
              selectedServer.value = currentServer;
              loadServerDetails(currentProductId);
            } else {
              console.warn('Current server not found in cabinet list');
              // 如果在机柜列表中找不到，创建临时对象
              const tempServer = {
                id: currentProductId,
                ip_address: data.value.ip_address,
                uPosition: data.value.uPosition,
                brand_name: data.value.brand_name,
                model_name: data.value.model_name,
              };
              cabinetServers.value.push(tempServer);
              selectedServer.value = tempServer;
              loadServerDetails(currentProductId);
            }
          }
        });
      } else if (currentProductId) {
        // 如果没有机柜信息，创建一个临时服务器对象
        const tempServer = {
          id: currentProductId,
          ip_address: data.value.ip_address,
          uPosition: data.value.uPosition,
          brand_name: data.value.brand_name,
          model_name: data.value.model_name,
        };
        cabinetServers.value = [tempServer];
        selectedServer.value = tempServer;
        loadServerDetails(currentProductId);
      }
    }
  },
});

// 获取指定U位的服务器
function getServerAtPosition(uPos: number) {
  const server = cabinetServers.value.find((s) => {
    const pos = s.uPosition;
    if (!pos) return false;

    const posStr = String(pos).trim();

    // 处理U位范围，例如 "21-22" 表示占用21到22号U位
    if (posStr.includes('-')) {
      const parts = posStr.split('-').map((p) => Number(p.trim()));
      if (
        parts.length === 2 &&
        !Number.isNaN(parts[0]) &&
        !Number.isNaN(parts[1])
      ) {
        const [start = 0, end = 0] = parts;
        const isInRange =
          uPos >= Math.min(start, end) && uPos <= Math.max(start, end);
        return isInRange;
      }
    }

    // 单个U位
    const posNum = Number(posStr);
    return !Number.isNaN(posNum) && posNum === uPos;
  });

  return server;
}

// 判断当前U位是否是服务器占用范围的起始位置（用于显示）
function isServerStartPosition(uPos: number) {
  const server = getServerAtPosition(uPos);
  if (!server || !server.uPosition) return false;

  const posStr = String(server.uPosition).trim();
  if (posStr.includes('-')) {
    const parts = posStr.split('-').map((p) => Number(p.trim()));
    if (
      parts.length === 2 &&
      !Number.isNaN(parts[0]) &&
      !Number.isNaN(parts[1])
    ) {
      // U位从上到下递减（42在顶部，1在底部）
      // 所以对于"21-22"，起始显示位置应该是22（较大的数）
      const [rangeStart = 0, rangeEnd = 0] = parts;
      const start = Math.max(rangeStart, rangeEnd);
      const isStart = uPos === start;
      return isStart;
    }
  }

  // 单个U位
  const posNum = Number(posStr);
  return !Number.isNaN(posNum) && posNum === uPos;
}

// 获取服务器占用的U位数量
function getServerUCount(server: any) {
  if (!server || !server.uPosition) return 1;

  const posStr = String(server.uPosition).trim();
  if (posStr.includes('-')) {
    const parts = posStr.split('-').map((p) => Number(p.trim()));
    if (
      parts.length === 2 &&
      !Number.isNaN(parts[0]) &&
      !Number.isNaN(parts[1])
    ) {
      // 例如 "21-22" 应该返回 2（占用2个U位）
      const [rangeStart = 0, rangeEnd = 0] = parts;
      const count = Math.abs(rangeEnd - rangeStart) + 1;
      return count;
    }
  }

  return 1;
}

function getServerSlotImage(server?: null | Record<string, any>) {
  return (
    resolveServerUPositionImage(server) ||
    resolveServerModelImage(selectedServerDetails.value) ||
    '/assets/brand/default.png'
  );
}

// 选择服务器
async function selectServer(server: Record<string, any>) {
  selectedServer.value = server;
  selectedServerDetails.value = null;

  // 加载选中服务器的详细信息
  if (server.id) {
    await loadServerDetails(server.id);
  }
}

// 判断U位是否被占用
function isOccupied(uPos: number) {
  return !!getServerAtPosition(uPos);
}
</script>

<template>
  <Drawer class="w-1/2" title="机柜视图">
    <div class="drawer-content">
      <!-- 左侧：42U机柜图腾 -->
      <div class="cabinet-section">
        <div class="cabinet-header">
          {{ data.loc || '机柜位置' }}
        </div>
        <div class="cabinet-wrapper">
          <!-- 机柜左侧图片 -->
          <img
            src="/assets/cab/42U_left.jpg"
            alt="机柜左侧"
            class="cabinet-side-image cabinet-left"
          />

          <!-- 机柜中间U位列表 -->
          <div class="cabinet-container">
            <template v-for="uPos in uPositions" :key="uPos">
              <div
                v-if="!getServerAtPosition(uPos) || isServerStartPosition(uPos)"
                class="u-slot"
                :class="{
                  occupied: isOccupied(uPos),
                  selected:
                    getServerAtPosition(uPos)?.id === selectedServer?.id,
                }"
                :style="
                  isServerStartPosition(uPos)
                    ? {
                        flex: `${getServerUCount(getServerAtPosition(uPos))} 1 0`,
                      }
                    : {}
                "
                @click="
                  () => {
                    const server = getServerAtPosition(uPos);
                    if (server) selectServer(server);
                  }
                "
              >
                <div v-if="getServerAtPosition(uPos)" class="server-slot">
                  <!-- 服务器图片 -->
                  <div class="server-image-container">
                    <img
                      :src="getServerSlotImage(getServerAtPosition(uPos))"
                      :alt="getServerAtPosition(uPos)?.model_name"
                      class="server-image"
                    />
                    <!-- IP地址遮罩 -->
                    <div class="server-overlay">
                      <span class="server-ip">{{
                        getServerAtPosition(uPos)?.ip_address
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 机柜右侧图片 -->
          <img
            src="/assets/cab/42U_right.jpg"
            alt="机柜右侧"
            class="cabinet-side-image cabinet-right"
          />
        </div>
      </div>

      <!-- 右侧：选中服务器的详细信息 -->
      <div class="server-details">
        <div v-if="selectedServerDetails" class="space-y-4">
          <!-- 基本信息 -->
          <div class="rounded-lg border p-4">
            <div class="mb-2 text-lg font-medium">基本信息</div>
            <ADescriptions :column="2" bordered size="small">
              <ADescriptionsItem label="IP地址">
                {{ selectedServerDetails.ip || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="型号">
                {{
                  selectedServerDetails.brand && selectedServerDetails.modelName
                    ? `${selectedServerDetails.brand} ${selectedServerDetails.modelName}`
                    : selectedServerDetails.modelName || '-'
                }}
              </ADescriptionsItem>
              <ADescriptionsItem label="序列号">
                {{ selectedServerDetails.serialNumber || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="BIOS版本">
                {{ selectedServerDetails.biosVersion || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="BMC版本">
                {{ selectedServerDetails.bmcVersion || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="电源状态">
                {{ selectedServerDetails.status || '-' }}
              </ADescriptionsItem>
            </ADescriptions>
          </div>

          <!-- 资产信息 -->
          <div class="rounded-lg border p-4">
            <div class="mb-2 text-lg font-medium">资产信息</div>
            <ADescriptions :column="2" bordered size="small">
              <ADescriptionsItem label="资产号">
                {{ selectedServerDetails.tag_number || data.tag_number || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="资产位置">
                {{ selectedServerDetails.location || data.loc || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="U位">
                {{
                  selectedServer?.uPosition
                    ? `U${selectedServer.uPosition}`
                    : '-'
                }}
              </ADescriptionsItem>
              <ADescriptionsItem label="责任人">
                {{ data.asset_person || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="采购日期">
                {{ data.purchase_date || '-' }}
              </ADescriptionsItem>
              <ADescriptionsItem label="备注">
                {{ data.notes || '-' }}
              </ADescriptionsItem>
            </ADescriptions>
          </div>

          <!-- 硬件统计 -->
          <div class="rounded-lg border p-4">
            <div class="mb-2 text-lg font-medium">硬件统计</div>
            <ADescriptions :column="2" bordered size="small">
              <ADescriptionsItem label="CPU">
                {{ selectedServerDetails.cpu_installed || 0 }} /
                {{ selectedServerDetails.cpu_total || 0 }}
              </ADescriptionsItem>
              <ADescriptionsItem label="内存">
                {{ selectedServerDetails.memory_capacity || 0 }} GB
              </ADescriptionsItem>
              <ADescriptionsItem label="存储">
                {{ selectedServerDetails.storage_physical_drives || 0 }} 块硬盘
              </ADescriptionsItem>
              <ADescriptionsItem label="网卡">
                {{ selectedServerDetails.network_installed || 0 }} /
                {{ selectedServerDetails.network_total || 0 }}
              </ADescriptionsItem>
            </ADescriptions>
          </div>

          <!-- 告警统计 -->
          <div class="rounded-lg border p-4">
            <div class="mb-2 text-lg font-medium">告警统计</div>
            <div class="flex gap-4">
              <div class="flex-1 rounded-lg bg-red-50 p-3 text-center">
                <div class="text-2xl font-bold text-red-600">
                  {{ selectedServerDetails.critical_count || 0 }}
                </div>
                <div class="text-sm text-gray-600">严重告警</div>
              </div>
              <div class="flex-1 rounded-lg bg-orange-50 p-3 text-center">
                <div class="text-2xl font-bold text-orange-600">
                  {{ selectedServerDetails.important_count || 0 }}
                </div>
                <div class="text-sm text-gray-600">重要告警</div>
              </div>
              <div class="flex-1 rounded-lg bg-yellow-50 p-3 text-center">
                <div class="text-2xl font-bold text-yellow-600">
                  {{ selectedServerDetails.minor_count || 0 }}
                </div>
                <div class="text-sm text-gray-600">次要告警</div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex h-full items-center justify-center text-gray-400"
        >
          请在左侧机柜中选择一台服务器
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.drawer-content {
  display: flex;
  gap: 1rem;
  height: calc(100vh - 120px);
  overflow: hidden;
}

.cabinet-section {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 320px;
  padding: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

:deep([data-theme='dark']) .cabinet-section {
  border-color: #374151;
}

.cabinet-header {
  flex-shrink: 0;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.cabinet-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  gap: 0;
  align-items: stretch;
  overflow: hidden;
}

.cabinet-side-image {
  display: block;
  flex-shrink: 0;
  width: auto;
  height: 100%;
  vertical-align: top;
  object-fit: contain;
}

.cabinet-left {
  border-radius: 0;
}

.cabinet-right {
  border-radius: 0;
}

.cabinet-container {
  @apply bg-transparent;

  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

:deep([data-theme='dark']) .cabinet-container {
  @apply bg-transparent;
}

.u-slot {
  @apply cursor-pointer bg-transparent transition-all;

  position: relative;
  box-sizing: border-box;
  display: flex;
  flex: 1 1 0;
  align-items: stretch;
  min-height: 0;
  padding: 0;
  margin: 0;
  font-size: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.u-slot:first-child {
  border-top: 1px solid #e5e7eb;
}

.u-slot:hover {
  @apply bg-blue-50/50;
}

:deep([data-theme='dark']) .u-slot {
  border-color: #374151;
}

:deep([data-theme='dark']) .u-slot:hover {
  @apply bg-blue-900/20;
}

.u-slot.occupied:hover {
  @apply bg-blue-100/50;
}

:deep([data-theme='dark']) .u-slot.occupied:hover {
  @apply bg-blue-900/30;
}

.u-slot.selected {
  position: relative;
  z-index: 10;
  outline: 4px solid #10b981 !important;
  outline-offset: -4px;
  background: rgb(16 185 129 / 25%) !important;
  box-shadow:
    0 0 0 2px #10b981,
    0 0 12px rgb(16 185 129 / 50%) !important;
}

:deep([data-theme='dark']) .u-slot.selected {
  outline: 4px solid #34d399 !important;
  outline-offset: -4px;
  background: rgb(52 211 153 / 30%) !important;
  box-shadow:
    0 0 0 2px #34d399,
    0 0 12px rgb(52 211 153 / 50%) !important;
}

.server-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.server-image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  background: transparent;
}

:deep([data-theme='dark']) .server-image-container {
  background: transparent;
}

.server-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.server-overlay {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 18px;
  padding: 2px 6px;
  background: rgb(0 0 0 / 15%);
}

.server-ip {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  text-shadow:
    0 1px 4px rgb(0 0 0 / 100%),
    0 0 2px rgb(0 0 0 / 100%);
}

.server-details {
  flex: 1;
  overflow: hidden auto;
}

.ant-descriptions-item-label {
  @apply w-[100px] font-bold;
}
</style>
