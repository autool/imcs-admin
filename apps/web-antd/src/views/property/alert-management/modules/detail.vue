<script lang="ts" setup>
import type { AlertManagementApi } from '#/api/assets/alert-management';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  AlertOutlined,
  CodeOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
} from 'ant-design-vue';

import { getAlertDetail } from '#/api/assets/alert-management';

import { useAlertManagementActions } from '../data';

const emits = defineEmits<{
  assign: [AlertManagementApi.Alert];
  close: [AlertManagementApi.Alert];
  handle: [AlertManagementApi.Alert];
  ticket: [AlertManagementApi.Alert];
}>();

const actions = useAlertManagementActions();

const alertData = ref<AlertManagementApi.Alert>();

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<AlertManagementApi.Alert>();
      alertData.value = data;
      if (data?.alert_id) {
        getAlertDetail(data.alert_id)
          .then((res: any) => {
            const detail =
              res && typeof res === 'object'
                ? ('code' in res && (res.data?.data ?? res.data)) ||
                  (res.data ?? res)
                : res;
            let dHandleNote = detail.handle_note || '';
            let dHandleResult = detail.handle_result || '';
            let dCloseReasonType = detail.close_reason_type || '';
            let dCloseReasonNote = detail.close_reason_note || '';
            let dCloseReason = detail.close_reason || '';
            const dActionNote =
              detail.action_note || dCloseReasonNote || dHandleNote || '';
            if (!dHandleNote || !dCloseReasonNote) {
              try {
                const parsed =
                  typeof detail.details === 'string'
                    ? JSON.parse(detail.details)
                    : detail.details || {};
                dHandleNote = dHandleNote || parsed?.handle_note || '';
                dHandleResult = dHandleResult || parsed?.handle_result || '';
                dCloseReasonType =
                  dCloseReasonType || parsed?.close_reason_type || '';
                dCloseReasonNote =
                  dCloseReasonNote || parsed?.close_reason_note || '';
                dCloseReason = dCloseReason || parsed?.close_reason || '';
              } catch {}
            }
            alertData.value = {
              alert_id: detail.alert_id,
              device_ip: detail.device_ip,
              alert_code: detail.alert_code,
              alert_name: detail.alert_name,
              alert_type: detail.alert_type,
              severity: detail.severity,
              source: detail.source,
              description: detail.message,
              assignee: detail.assignee,
              handler: detail.handler,
              status: detail.status,
              alert_time: detail.alert_time,
              handle_time: detail.acknowledged_at || '',
              // 处理/关闭说明
              action_note: dActionNote,
              handle_note: dHandleNote,
              handle_result: dHandleResult,
              close_reason_type: dCloseReasonType,
              close_reason_note: dCloseReasonNote,
              close_reason: dCloseReason,
              ticket: detail.ticket || null,
              // 兼容设备信息字段（可能为空）
              device_model: (data as any).device_model || '',
              device_sn: (data as any).device_sn || '',
              asset_location: (data as any).asset_location || '',
            } as unknown as AlertManagementApi.Alert;
          })
          .catch((error) => {
            console.warn('获取告警详情失败，使用回退数据:', error);
            // 保留传入数据作为回退
            alertData.value = data;
          });
      }
    }
  },
});

defineExpose({
  drawerApi,
});

const currentStep = computed(() => {
  const status = alertData.value?.status;
  if (status === 'resolved' || status === 'closed') return 2;
  if (status === 'processing') return 1;
  return 0;
});

const stepStatus = computed(() => {
  const status = alertData.value?.status;
  // 步骤1：告警产生 - 总是完成
  // 步骤2：处理中
  let step2 = 'wait';
  if (status === 'processing') step2 = 'process';
  else if (status === 'resolved' || status === 'closed') step2 = 'finish';

  // 步骤3：已解决
  let step3 = 'wait';
  if (status === 'resolved' || status === 'closed') step3 = 'finish';

  return { step2, step3 };
});

const relatedTicket = computed(() => alertData.value?.ticket || null);

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    critical: 'error',
    major: 'magenta',
    minor: 'orange',
    warning: 'cyan',
    info: 'default',
  };
  return colors[severity] || 'default';
};

const getSeverityText = (severity: string) => {
  const texts: Record<string, string> = {
    critical: '严重',
    major: '重要',
    minor: '次要',
    warning: '警告',
    info: '信息',
  };
  return texts[severity] || severity;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'default',
    processing: 'processing',
    resolved: 'success',
    closed: 'default',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已处理',
    closed: '已关闭',
  };
  return texts[status] || status;
};

const getAlertTypeText = (type: string) => {
  const texts: Record<string, string> = {
    hardware: '硬件告警',
    performance: '性能告警',
    security: '安全告警',
    network: '网络告警',
  };
  return texts[type] || type;
};

const getTicketStatusText = (status: string) => {
  const texts: Record<string, string> = {
    closed: '已关闭',
    in_progress: '处理中',
    open: '待处理',
    pending: '待处理',
    resolved: '已完成',
  };
  return texts[status] || status;
};

const getTicketStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    closed: 'default',
    in_progress: 'processing',
    open: 'blue',
    pending: 'warning',
    resolved: 'success',
  };
  return colors[status] || 'default';
};
</script>

<template>
  <Drawer class="w-[800px]" title="告警详情" :body-style="{ padding: '16px' }">
    <div v-if="alertData">
      <!-- 顶部标题区 -->
      <Card class="mb-4" :bordered="false" :body-style="{ padding: '16px' }">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="mb-2 flex items-center gap-2">
              <AlertOutlined class="text-xl text-red-500" />
              <span class="text-lg font-bold text-gray-800 dark:text-white">{{
                alertData.alert_name
              }}</span>
              <Tag
                :color="getSeverityColor(alertData.severity)"
                class="m-0 px-2"
              >
                {{ getSeverityText(alertData.severity) }}
              </Tag>
              <Tag :color="getStatusColor(alertData.status)" class="m-0 px-2">
                {{ getStatusText(alertData.status) }}
              </Tag>
            </div>
            <Space size="middle" class="text-xs text-gray-500">
              <span class="flex items-center">
                <CodeOutlined class="mr-1" />{{ alertData.alert_code }}
              </span>
              <Divider type="vertical" />
              <span class="flex items-center">
                <GlobalOutlined class="mr-1" />{{ alertData.device_ip }}
              </span>
              <Divider type="vertical" />
              <span class="flex items-center" :title="alertData.alert_id">
                <Typography.Text
                  v-if="alertData.alert_id"
                  :content="alertData.alert_id"
                  class="ml-1 !text-gray-400"
                  style="display: inline-flex"
                >
                  <template #copyableIcon>
                    <span aria-label="copy" class="anticon anticon-copy">
                      <svg
                        viewBox="64 64 896 896"
                        data-icon="copy"
                        width="1em"
                        height="1em"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v6.2H352c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h352c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"
                        />
                      </svg>
                    </span>
                  </template>
                  <template #text><span></span></template>
                </Typography.Text>
              </span>
            </Space>
          </div>
        </div>
      </Card>

      <!-- 处理流程 -->
      <Card class="mb-4" :bordered="false" size="small">
        <template #title>
          <Space>
            <HistoryOutlined />
            <span>处理记录</span>
          </Space>
        </template>
        <template #extra>
          <InfoCircleOutlined class="text-gray-400" />
        </template>
        <div class="py-2">
          <Steps :current="currentStep" :items="[]" size="small">
            <Steps.Step title="告警产生" status="finish">
              <template #description>
                <div class="mt-1 text-xs text-gray-500">
                  {{ alertData.alert_time }}
                </div>
              </template>
            </Steps.Step>

            <Steps.Step title="处理中" :status="stepStatus.step2">
              <template #description>
                <div
                  v-if="
                    alertData.handle_time ||
                    alertData.status === 'processing' ||
                    alertData.status === 'resolved' ||
                    alertData.status === 'closed'
                  "
                >
                  <div class="mt-1 text-xs text-gray-500">
                    {{ alertData.handle_time }}
                  </div>
                  <div class="mt-1 text-xs">
                    <UserOutlined class="mr-1" />{{
                      alertData.handler || '未知'
                    }}
                  </div>
                </div>
                <div v-else class="mt-1 text-xs text-gray-400">待分配</div>
              </template>
            </Steps.Step>

            <Steps.Step title="已解决" :status="stepStatus.step3">
              <template #description>
                <div
                  v-if="
                    alertData.status === 'resolved' ||
                    alertData.status === 'closed'
                  "
                  class="mt-1 text-xs text-gray-500"
                >
                  处理完成
                </div>
              </template>
            </Steps.Step>
          </Steps>
        </div>
      </Card>

      <!-- 详细信息区：双栏布局 -->
      <Row :gutter="16">
        <Col :span="12">
          <Card class="mb-4 h-full" :bordered="false" size="small">
            <template #title>
              <Space>
                <InfoCircleOutlined />
                <span>基本信息</span>
              </Space>
            </template>
            <Descriptions
              :column="1"
              size="small"
              :label-style="{
                width: '80px',
                color: '#666',
                justifyContent: 'flex-end',
              }"
            >
              <Descriptions.Item label="告警类型">
                <Tag color="blue">
                  {{ getAlertTypeText(alertData.alert_type) }}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级分组">
                <Tag v-if="alertData.group_priority === 10" color="red">
                  {{ alertData.group_priority_name || '重大业务' }}
                </Tag>
                <Tag v-else-if="alertData.group_priority === 30" color="orange">
                  {{ alertData.group_priority_name || '重要业务' }}
                </Tag>
                <Tag v-else-if="alertData.group_priority === 50" color="blue">
                  {{ alertData.group_priority_name || '普通业务' }}
                </Tag>
                <Tag
                  v-else-if="alertData.group_priority === 80"
                  color="default"
                >
                  {{ alertData.group_priority_name || '测试备用' }}
                </Tag>
                <Tag v-else>-</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="告警源">
                <Tag v-if="alertData.source === 'eventservice'" color="cyan">
                  事件推送
                </Tag>
                <Tag v-else-if="alertData.source === 'polling'" color="blue">
                  定时轮询
                </Tag>
                <Tag v-else>{{ alertData.source }}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="告警时间">
                {{ alertData.alert_time }}
              </Descriptions.Item>
              <Descriptions.Item label="处置说明">
                <div
                  class="whitespace-pre-wrap break-words text-sm leading-relaxed"
                >
                  {{
                    (alertData as any).action_note ||
                    (alertData as any).close_reason_note ||
                    (alertData as any).handle_note ||
                    '-'
                  }}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col :span="12">
          <Card class="mb-4 h-full" :bordered="false" size="small">
            <template #title>
              <Space>
                <EnvironmentOutlined />
                <span>位置与责任人</span>
              </Space>
            </template>
            <Descriptions
              :column="1"
              size="small"
              :label-style="{
                width: '80px',
                color: '#666',
                justifyContent: 'flex-end',
              }"
            >
              <Descriptions.Item label="资产位置">
                {{ alertData.asset_location || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="设备信息">
                <div v-if="alertData.device_model || alertData.device_sn">
                  <div>{{ alertData.device_model }}</div>
                  <div class="text-xs text-gray-400">
                    SN: {{ alertData.device_sn }}
                  </div>
                </div>
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item label="责任人">
                <span v-if="alertData.assignee">
                  <UserOutlined class="mr-1" />{{ alertData.assignee }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                <span v-if="alertData.handler">
                  <UserOutlined class="mr-1" />{{ alertData.handler }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card class="mb-4" :bordered="false" size="small">
        <template #title>
          <Space>
            <FileTextOutlined />
            <span>关联工单</span>
          </Space>
        </template>
        <div
          v-if="relatedTicket"
          class="flex items-center justify-between gap-3"
        >
          <div class="min-w-0">
            <div class="truncate text-sm font-medium">
              {{ relatedTicket.title }}
            </div>
            <div class="mt-1 text-xs text-gray-400">
              {{ relatedTicket.id }}
            </div>
          </div>
          <Space>
            <Tag :color="getTicketStatusColor(relatedTicket.status)">
              {{ getTicketStatusText(relatedTicket.status) }}
            </Tag>
            <Button size="small" @click="emits('ticket', alertData)">
              打开
            </Button>
          </Space>
        </div>
        <div v-else class="flex items-center justify-between gap-3">
          <span class="text-sm text-gray-500">
            当前告警还没有关联工单，可按策略或人工转入运维闭环。
          </span>
          <Button
            size="small"
            type="primary"
            @click="emits('ticket', alertData)"
          >
            转工单
          </Button>
        </div>
      </Card>

      <!-- 告警日志 -->
      <Card :bordered="false" size="small">
        <template #title>
          <Space>
            <FileTextOutlined />
            <span>告警日志</span>
          </Space>
        </template>

        <!-- 翻译日志 -->
        <div class="mb-3">
          <div class="mb-1 flex items-center text-xs font-medium text-gray-500">
            <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            翻译日志
          </div>
          <div
            class="rounded border border-blue-100 bg-blue-50/50 p-3 text-sm text-gray-800 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-gray-200"
          >
            {{ alertData.alert_name }}
          </div>
        </div>

        <!-- 原始日志 -->
        <div class="group relative">
          <div class="mb-1 flex items-center text-xs font-medium text-gray-500">
            <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-500"></span>
            原始日志
          </div>
          <div
            class="overflow-x-auto rounded border border-gray-800 p-4 font-mono text-xs leading-relaxed shadow-inner"
          >
            <div class="mb-2 flex border-b border-gray-700 pb-2 text-gray-500">
              <span class="mr-4">Time: {{ alertData.alert_time }}</span>
              <span>Level: {{ alertData.severity.toUpperCase() }}</span>
            </div>
            <div class="whitespace-pre-wrap break-all">
              {{ alertData.description }}
            </div>
          </div>
          <div
            class="absolute right-2 top-8 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Typography.Text
              copyable
              :content="alertData.description"
              class="rounded bg-black/50 p-1 !text-gray-400"
            >
              <template #copyableIcon>
                <span aria-label="copy" class="anticon anticon-copy text-white">
                  <svg
                    viewBox="64 64 896 896"
                    data-icon="copy"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v6.2H352c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h352c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"
                    />
                  </svg>
                </span>
              </template>
              <template #text><span></span></template>
            </Typography.Text>
          </div>
        </div>
      </Card>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2" v-if="alertData">
        <Button
          v-if="
            actions.canHandle &&
            alertData.status !== 'closed' &&
            alertData.status !== 'resolved'
          "
          type="primary"
          @click="emits('handle', alertData)"
        >
          处理
        </Button>
        <Button
          v-if="
            actions.canAssign &&
            alertData.status !== 'closed' &&
            alertData.status !== 'resolved'
          "
          @click="emits('assign', alertData)"
        >
          分配
        </Button>
        <Button
          v-if="actions.canClose"
          danger
          :disabled="
            alertData.status === 'resolved' || alertData.status === 'closed'
          "
          @click="emits('close', alertData)"
        >
          关闭
        </Button>
        <Button @click="drawerApi.close()">取消</Button>
      </div>
    </template>
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
