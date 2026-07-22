<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationConfigApi } from '#/api/system/notification-configs';
import type { NotificationPolicyApi } from '#/api/system/notification-policies';
import type { SystemUserApi } from '#/api/system/user';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  SelectOption,
  Switch,
  Tag,
  Textarea,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getNotificationConfigsApi } from '#/api/system/notification-configs';
import {
  createNotificationPolicyApi,
  deleteNotificationPolicyApi,
  getNotificationPoliciesApi,
  updateNotificationPolicyApi,
} from '#/api/system/notification-policies';
import { getAllUsers } from '#/api/system/user';

import {
  getNotificationTypeMeta,
  NOTIFICATION_TYPE_META,
} from '../templates/data';

const saving = ref(false);
const { hasAccessByCodes } = useAccess();
const modalVisible = ref(false);
const editingId = ref<string>();
const channels = ref<NotificationConfigApi.NotificationConfig[]>([]);
const users = ref<SystemUserApi.SystemUser[]>([]);

const formState = reactive<NotificationPolicyApi.PolicyPayload>({
  channel_ids: [],
  enabled: true,
  event_type: 'alert_triggered',
  name: '',
  recipient_emails: [],
  recipient_user_ids: [],
  severity: 'all',
});
const canCreatePolicy = computed(() =>
  hasAccessByCodes(['system_notification_policies:add']),
);
const canDeletePolicy = computed(() =>
  hasAccessByCodes(['system_notification_policies:delete']),
);
const canEditPolicy = computed(() =>
  hasAccessByCodes(['system_notification_policies:edit']),
);

const eventTypeOptions = [
  'alert_triggered',
  'alert_test',
  'node_timeout',
  'node_recovered',
  'task_failed',
  'task_completed',
  'system_alert',
  'work_ticket_assigned',
  'work_ticket_timeout',
  'work_ticket_resolved',
].map(
  (value) => NOTIFICATION_TYPE_META[value] || getNotificationTypeMeta(value),
);

const severityMap: Record<string, { color: string; label: string }> = {
  all: { color: 'default', label: '全部' },
  critical: { color: 'red', label: '致命' },
  error: { color: 'red', label: '错误' },
  info: { color: 'blue', label: '信息' },
  major: { color: 'volcano', label: '严重' },
  warning: { color: 'orange', label: '警告' },
};

const modalTitle = computed(() =>
  editingId.value ? '编辑通知策略' : '新建通知策略',
);

const channelMap = computed(() => {
  return new Map(channels.value.map((item) => [item.id, item]));
});

const userMap = computed(() => {
  return new Map(users.value.map((item) => [item.id, item]));
});

function splitValues(value?: string) {
  return (value || '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinValues(value?: string[]) {
  return (value || []).join('\n');
}

function getChannelLabel(channelId: string) {
  const channel = channelMap.value.get(channelId);
  if (!channel) {
    return channelId;
  }
  const typeLabels: Record<NotificationConfigApi.ConfigType, string> = {
    email: '邮件',
    webhook: 'Webhook',
    wecom: '企业微信',
  };
  const typeLabel = typeLabels[channel.config_type] || channel.config_type;
  return `${channel.name} / ${typeLabel}`;
}

function getUserLabel(userId: string) {
  const user = userMap.value.get(userId);
  if (!user) {
    return userId;
  }
  return user.full_name || user.username || userId;
}

function getRecipientLabels(
  record: NotificationPolicyApi.Policy | Record<string, any>,
) {
  return [
    ...(record.recipient_user_ids || []).map((userId: string) =>
      getUserLabel(userId),
    ),
    ...(record.recipient_emails || []),
  ];
}

function getEventTypeDisplay(type: string) {
  return getNotificationTypeMeta(type);
}

function getSeverityDisplay(severity: string) {
  return severityMap[severity] || { color: 'default', label: severity || '-' };
}

function visibleLabels(labels: string[], limit = 2) {
  return labels.slice(0, limit);
}

function renderEventType(type: string) {
  const meta = getEventTypeDisplay(type);
  return h(
    Tooltip,
    { title: `${meta.group} / ${type}` },
    {
      default: () => h(Tag, { color: meta.color }, () => meta.label),
    },
  );
}

function renderSeverity(severity: string) {
  const meta = getSeverityDisplay(severity);
  return h(Tag, { color: meta.color }, () => meta.label);
}

function renderEnabled(enabled: boolean) {
  return h(Tag, { color: enabled ? 'success' : 'default' }, () =>
    enabled ? '启用' : '停用',
  );
}

function renderLabels(labels: string[], emptyText: string) {
  if (labels.length === 0) {
    return h('span', { class: 'text-muted' }, emptyText);
  }
  const visible = visibleLabels(labels);
  const nodes = visible.map((label) =>
    h(Tag, { class: 'policy-compact-tag', key: label }, () => label),
  );
  if (labels.length > visible.length) {
    nodes.push(
      h(
        Tag,
        { color: 'blue', key: '__more' },
        () => `+${labels.length - visible.length}`,
      ),
    );
  }
  return h('div', { class: 'policy-tag-list' }, nodes);
}

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '搜索策略名称',
      },
      fieldName: 'search',
      label: '策略名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: eventTypeOptions.map((item) => ({
          label: item.label,
          value: item.value,
        })),
        placeholder: '请选择事件类型',
      },
      fieldName: 'event_type',
      label: '事件类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: true },
          { label: '停用', value: false },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'enabled',
      label: '状态',
    },
  ];
}

function useColumns(): VxeTableGridOptions<NotificationPolicyApi.Policy>['columns'] {
  return [
    {
      align: 'center',
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 70,
    },
    {
      field: 'name',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '策略名称',
    },
    {
      align: 'center',
      field: 'event_type',
      slots: {
        default: ({ row }) => renderEventType(row.event_type),
      },
      title: '事件类型',
      width: 150,
    },
    {
      align: 'center',
      field: 'severity',
      slots: {
        default: ({ row }) => renderSeverity(row.severity),
      },
      title: '级别',
      width: 90,
    },
    {
      align: 'center',
      field: 'enabled',
      slots: {
        default: ({ row }) => renderEnabled(row.enabled),
      },
      title: '状态',
      width: 90,
    },
    {
      field: 'channel_ids',
      minWidth: 180,
      slots: {
        default: ({ row }) =>
          renderLabels(
            row.channel_ids.map((channelId) => getChannelLabel(channelId)),
            '未配置',
          ),
      },
      title: '通知渠道',
    },
    {
      field: 'recipient_emails',
      minWidth: 180,
      slots: {
        default: ({ row }) =>
          renderLabels(getRecipientLabels(row), '仅外部渠道'),
      },
      title: '接收对象',
    },
    {
      align: 'center',
      field: 'updated_at',
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '',
      title: '更新时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 130,
    },
  ];
}

function resetForm() {
  editingId.value = undefined;
  Object.assign(formState, {
    channel_ids: [],
    description: undefined,
    enabled: true,
    event_type: 'alert_triggered',
    name: '',
    recipient_emails: [],
    recipient_user_ids: [],
    severity: 'all',
  });
}

async function loadOptions() {
  try {
    const [channelResult, userResult] = await Promise.all([
      getNotificationConfigsApi({ is_enabled: true, limit: 200 }),
      getAllUsers({ is_locked: false }),
    ]);
    channels.value = channelResult.list || [];
    users.value = userResult.list || [];
  } catch (error: any) {
    message.warning(error?.message || '通知渠道或接收用户加载失败');
  }
}

function handleCreate() {
  if (!canCreatePolicy.value) {
    message.warning('无权限新建通知策略');
    return;
  }
  resetForm();
  modalVisible.value = true;
}

function handleEdit(
  record: NotificationPolicyApi.Policy | Record<string, any>,
) {
  if (!canEditPolicy.value) {
    message.warning('无权限编辑通知策略');
    return;
  }
  resetForm();
  editingId.value = record.id;
  Object.assign(formState, {
    channel_ids: record.channel_ids,
    description: record.description,
    enabled: record.enabled,
    event_type: record.event_type,
    name: record.name,
    recipient_emails: record.recipient_emails,
    recipient_user_ids: record.recipient_user_ids,
    severity: record.severity,
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  const canSave = editingId.value ? canEditPolicy.value : canCreatePolicy.value;
  if (!canSave) {
    message.warning('无权限保存通知策略');
    return;
  }
  if (!formState.name || !formState.event_type) {
    message.warning('请填写策略名称和事件类型');
    return;
  }
  saving.value = true;
  try {
    const payload = { ...formState };
    if (editingId.value) {
      await updateNotificationPolicyApi(editingId.value, payload);
      message.success('更新成功');
    } else {
      await createNotificationPolicyApi(payload);
      message.success('创建成功');
    }
    modalVisible.value = false;
    gridApi.query();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(
  record: NotificationPolicyApi.Policy | Record<string, any>,
) {
  if (!canDeletePolicy.value) {
    message.warning('无权限删除通知策略');
    return;
  }
  try {
    await deleteNotificationPolicyApi(record.id);
    message.success('删除成功');
    gridApi.query();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getNotificationPoliciesApi({
            enabled: formValues.enabled,
            event_type: formValues.event_type,
            limit: page.pageSize,
            search: formValues.search || undefined,
            skip: (page.currentPage - 1) * page.pageSize,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    stripe: true,
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<NotificationPolicyApi.Policy>,
});

onMounted(() => {
  loadOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="['system_notification_policies:add']"
          type="primary"
          @click="handleCreate"
        >
          新建策略
        </Button>
      </template>
      <template #action="{ row }">
        <Button
          v-access:code="['system_notification_policies:edit']"
          size="small"
          type="link"
          @click="handleEdit(row)"
        >
          编辑
        </Button>
        <Popconfirm title="确认删除该通知策略？" @confirm="handleDelete(row)">
          <Button
            v-access:code="['system_notification_policies:delete']"
            danger
            size="small"
            type="link"
          >
            删除
          </Button>
        </Popconfirm>
      </template>
    </Grid>

    <Modal
      v-model:open="modalVisible"
      :confirm-loading="saving"
      :title="modalTitle"
      width="720px"
      @ok="handleSubmit"
    >
      <Form
        :label-col="{ span: 5 }"
        :model="formState"
        :wrapper-col="{ span: 18 }"
      >
        <FormItem label="策略名称" required>
          <Input
            v-model:value="formState.name"
            placeholder="例如：严重服务器告警通知"
          />
        </FormItem>
        <FormItem label="事件类型" required>
          <Select v-model:value="formState.event_type">
            <SelectOption
              v-for="item in eventTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="适用级别">
          <Select v-model:value="formState.severity">
            <SelectOption value="all">全部</SelectOption>
            <SelectOption value="critical">致命</SelectOption>
            <SelectOption value="major">严重</SelectOption>
            <SelectOption value="warning">警告</SelectOption>
            <SelectOption value="info">信息</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="启用">
          <Switch v-model:checked="formState.enabled" />
        </FormItem>
        <FormItem label="通知渠道">
          <Select
            v-model:value="formState.channel_ids"
            mode="multiple"
            option-filter-prop="label"
            placeholder="选择已启用的通知渠道"
            show-search
          >
            <SelectOption
              v-for="channel in channels"
              :key="channel.id"
              :label="getChannelLabel(channel.id)"
              :value="channel.id"
            >
              {{ getChannelLabel(channel.id) }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="接收用户">
          <Select
            v-model:value="formState.recipient_user_ids"
            mode="multiple"
            option-filter-prop="label"
            placeholder="选择系统用户"
            show-search
          >
            <SelectOption
              v-for="user in users"
              :key="user.id"
              :label="getUserLabel(user.id)"
              :value="user.id"
            >
              {{ getUserLabel(user.id) }}
              <span v-if="user.email" class="option-extra">
                {{ user.email }}
              </span>
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="接收邮箱">
          <Textarea
            :value="joinValues(formState.recipient_emails)"
            :rows="3"
            placeholder="填写邮箱，多个用换行、逗号或分号分隔"
            @change="
              (event: any) =>
                (formState.recipient_emails = splitValues(event.target.value))
            "
          />
        </FormItem>
        <FormItem label="说明">
          <Textarea v-model:value="formState.description" :rows="3" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style lang="scss" scoped>
.policy-compact-tag {
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.policy-tag-list {
  display: flex;
  gap: 4px;
  align-items: center;
}

.text-muted {
  font-size: 12px;
  opacity: 0.62;
}
</style>
