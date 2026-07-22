<script setup lang="ts">
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createNotificationApi,
  getNotificationListApi,
  markAllReadApi,
  markNotificationReadApi,
} from '#/api/system/notifications';
import { getAllUsers } from '#/api/system/user';

import { useColumns } from './data';

defineOptions({
  name: 'SystemNotifications',
});

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const canSendNotification = hasAccessByCodes(['notifications_list:send']);

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  content: string;
  level: string;
  data?: any;
  created_at: string;
  is_read: boolean;
}

interface NotificationDataItem {
  key: string;
  label: string;
  value: any;
}

// 详情对话框
const detailVisible = ref(false);
const currentNotification = ref<NotificationRow | null>(null);
const sendVisible = ref(false);
const sendSubmitting = ref(false);
const usersLoading = ref(false);
const users = ref<SystemUserApi.SystemUser[]>([]);
const sendForm = reactive({
  content: '',
  expires_days: 7,
  level: 'info' as 'error' | 'info' | 'success' | 'warning',
  notification_type: 'manual',
  title: '',
  user_ids: [] as string[],
});

const notificationDataLabels: Record<string, string> = {
  node_id: '节点ID',
  record_id: '流程记录ID',
  report_id: '报表ID',
  route: '跳转路径',
  source_ref_id: '来源ID',
  source_type: '来源类型',
  task_id: '任务ID',
  ticket_id: '工单ID',
  workflow_record_id: '流程记录ID',
};

const notificationSourceTypeLabels: Record<string, string> = {
  alarm: '服务器告警',
  feedback: '用户反馈',
  manual: '手工录入',
  node_timeout: '节点超时',
  task_failure: '任务失败',
  workflow_timeout: '流程超时',
};

// 先声明 onActionClick
function onActionClick(e: OnActionClickParams<NotificationRow>) {
  switch (e.code) {
    case 'go': {
      handleGoToRelated(e.row);
      break;
    }
    case 'read': {
      handleMarkRead(e.row);
      break;
    }
    case 'view': {
      handleViewDetail(e.row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const params: any = {
            skip: (page.currentPage - 1) * page.pageSize,
            limit: page.pageSize,
          };

          return await getNotificationListApi(params);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions<NotificationRow>,
});

// 标记已读
async function handleMarkRead(row: NotificationRow) {
  try {
    await markNotificationReadApi(row.id);
    message.success('标记成功');
    onRefresh();
  } catch (error: any) {
    message.error(error.message || '标记失败');
  }
}

function resetSendForm() {
  sendForm.content = '';
  sendForm.expires_days = 7;
  sendForm.level = 'info';
  sendForm.notification_type = 'manual';
  sendForm.title = '';
  sendForm.user_ids = [];
}

function getUserLabel(user: SystemUserApi.SystemUser) {
  return user.full_name || user.username || user.id;
}

async function loadUsers() {
  if (users.value.length > 0 || usersLoading.value) return;
  usersLoading.value = true;
  try {
    const userResponse = await getAllUsers();
    users.value = userResponse.list || [];
  } catch (error: any) {
    message.error(error.message || '加载用户列表失败');
  } finally {
    usersLoading.value = false;
  }
}

async function openSendModal() {
  if (!canSendNotification) {
    message.warning('无权限发送系统通知');
    return;
  }
  resetSendForm();
  sendVisible.value = true;
  await loadUsers();
}

async function handleSendNotification() {
  if (!canSendNotification) {
    message.warning('无权限发送系统通知');
    return;
  }
  const title = sendForm.title.trim();
  const content = sendForm.content.trim();
  if (!title || !content) {
    message.warning('请填写通知标题和内容');
    return;
  }
  sendSubmitting.value = true;
  try {
    await createNotificationApi({
      content,
      expires_days: sendForm.expires_days,
      level: sendForm.level,
      notification_type: sendForm.notification_type.trim() || 'manual',
      title,
      user_ids: sendForm.user_ids,
    });
    message.success('通知发送成功');
    sendVisible.value = false;
    onRefresh();
  } catch (error: any) {
    message.error(error.message || '通知发送失败');
  } finally {
    sendSubmitting.value = false;
  }
}

// 查看详情
function handleViewDetail(row: NotificationRow) {
  currentNotification.value = row;
  detailVisible.value = true;

  // 如果未读，自动标记为已读
  if (!row.is_read) {
    markNotificationReadApi(row.id).then(() => {
      onRefresh();
    });
  }
}

// 获取通知类型名称
function getNotificationTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    node_timeout: '节点超时',
    node_recovered: '节点恢复',
    system_alert: '系统告警',
    task_completed: '任务完成',
    task_failed: '任务失败',
    work_ticket: '工单通知',
    work_ticket_assigned: '工单分配',
    work_ticket_auto_recovered: '工单自修复',
    work_ticket_completed: '工单完成',
    work_ticket_rejected: '工单驳回',
    work_ticket_resolved: '工单解决',
    work_ticket_timeout: '工单超时',
    work_ticket_timeout_rejected: '超时驳回',
    work_ticket_todo: '流程待办',
  };
  return typeMap[type] || type;
}

// 获取级别标签颜色
function getLevelColor(level: string): string {
  const colorMap: Record<string, string> = {
    success: 'green',
    info: 'blue',
    warning: 'orange',
    error: 'red',
  };
  return colorMap[level] || 'default';
}

// 获取级别名称
function getLevelName(level: string): string {
  const nameMap: Record<string, string> = {
    success: '成功',
    info: '信息',
    warning: '警告',
    error: '错误',
  };
  return nameMap[level] || level;
}

function renderNotificationValue(key: string, value: any) {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'source_type') {
    return notificationSourceTypeLabels[value] || value;
  }
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getNotificationDataItems(data?: Record<string, any>) {
  if (!data) return [];
  const preferredKeys = [
    'ticket_id',
    'source_type',
    'source_ref_id',
    'node_id',
    'record_id',
    'workflow_record_id',
    'task_id',
    'report_id',
    'route',
  ];
  const usedKeys = new Set<string>();
  const items: NotificationDataItem[] = [];

  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      usedKeys.add(key);
      items.push({
        key,
        label: notificationDataLabels[key] || key,
        value: data[key],
      });
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (usedKeys.has(key)) continue;
    items.push({
      key,
      label: notificationDataLabels[key] || key.replaceAll('_', ' '),
      value,
    });
  }

  return items;
}

// 跳转到相关页面
function handleGoToRelated(row?: NotificationRow) {
  const notification = row || currentNotification.value;
  if (!notification) return;
  detailVisible.value = false;

  // 根据通知类型和数据跳转到相应页面
  if (notification.data?.route) {
    router.push(notification.data.route);
  } else if (notification.data?.ticket_id) {
    router.push({
      path: '/work-platform/tickets',
      query: { ticketId: notification.data.ticket_id },
    });
  } else if (notification.data?.node_id) {
    router.push({
      path: '/system/nodes',
      query: { highlight: notification.data.node_id },
    });
  } else if (notification.data?.task_id) {
    router.push({
      path: '/tasks/execution',
      query: { task_id: notification.data.task_id },
    });
  } else {
    message.info('该通知没有关联的详情页面');
  }
}

// 全部标记已读
async function handleMarkAllRead() {
  try {
    const result = await markAllReadApi();
    if (result.count === 0) {
      message.info('没有未读通知');
    } else {
      message.success(`已标记 ${result.count} 条通知为已读`);
    }
    onRefresh();
  } catch (error: any) {
    message.error(error.message || '操作失败');
  }
}

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Space>
          <Button
            v-access:code="['notifications_list:send']"
            type="primary"
            @click="openSendModal"
          >
            发送通知
          </Button>
          <Button @click="handleMarkAllRead">全部标记已读</Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="sendVisible"
      :confirm-loading="sendSubmitting"
      title="发送系统通知"
      width="640px"
      @ok="handleSendNotification"
    >
      <Form layout="vertical">
        <Form.Item label="通知标题" required>
          <Input
            v-model:value="sendForm.title"
            :maxlength="100"
            placeholder="请输入通知标题"
            show-count
          />
        </Form.Item>
        <Form.Item label="通知内容" required>
          <Textarea
            v-model:value="sendForm.content"
            :maxlength="500"
            :rows="5"
            placeholder="请输入通知内容"
            show-count
          />
        </Form.Item>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Item label="通知级别">
            <Select v-model:value="sendForm.level">
              <Select.Option value="info">信息</Select.Option>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="warning">警告</Select.Option>
              <Select.Option value="error">错误</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="通知类型">
            <Input v-model:value="sendForm.notification_type" />
          </Form.Item>
          <Form.Item label="过期天数">
            <InputNumber
              v-model:value="sendForm.expires_days"
              class="w-full"
              :max="365"
              :min="1"
            />
          </Form.Item>
        </div>
        <Form.Item label="接收用户">
          <Select
            v-model:value="sendForm.user_ids"
            :loading="usersLoading"
            mode="multiple"
            option-filter-prop="label"
            placeholder="不选择则发送给所有用户"
            show-search
          >
            <Select.Option
              v-for="user in users"
              :key="user.id"
              :label="getUserLabel(user)"
              :value="user.id"
            >
              {{ getUserLabel(user) }}
              <span v-if="user.email" class="ml-2 text-xs opacity-60">
                {{ user.email }}
              </span>
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 通知详情对话框 -->
    <Modal
      v-model:open="detailVisible"
      title="通知详情"
      width="700px"
      :footer="null"
    >
      <div v-if="currentNotification" class="p-4">
        <Descriptions :column="1" bordered>
          <DescriptionsItem label="通知类型">
            <Tag color="blue">
              {{ getNotificationTypeName(currentNotification.type) }}
            </Tag>
          </DescriptionsItem>

          <DescriptionsItem label="级别">
            <Tag :color="getLevelColor(currentNotification.level)">
              {{ getLevelName(currentNotification.level) }}
            </Tag>
          </DescriptionsItem>

          <DescriptionsItem label="标题">
            <strong>{{ currentNotification.title }}</strong>
          </DescriptionsItem>

          <DescriptionsItem label="内容">
            <div class="whitespace-pre-wrap">
              {{ currentNotification.content }}
            </div>
          </DescriptionsItem>

          <DescriptionsItem label="时间">
            {{
              new Date(currentNotification.created_at).toLocaleString('zh-CN')
            }}
          </DescriptionsItem>

          <DescriptionsItem v-if="currentNotification.data" label="相关信息">
            <div class="space-y-1">
              <div
                v-for="item in getNotificationDataItems(
                  currentNotification.data,
                )"
                :key="item.key"
                class="text-sm"
              >
                <span class="text-gray-500 dark:text-gray-400">
                  {{ item.label }}:
                </span>
                <span class="ml-2">
                  {{ renderNotificationValue(item.key, item.value) }}
                </span>
              </div>
            </div>
          </DescriptionsItem>
        </Descriptions>

        <div class="mt-6 flex justify-end">
          <Space>
            <Button @click="detailVisible = false">关闭</Button>
            <Button
              v-if="
                currentNotification.data &&
                (currentNotification.data.route ||
                  currentNotification.data.ticket_id ||
                  currentNotification.data.node_id ||
                  currentNotification.data.task_id ||
                  currentNotification.data.report_id)
              "
              type="primary"
              @click="() => handleGoToRelated()"
            >
              去查看
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  </Page>
</template>
