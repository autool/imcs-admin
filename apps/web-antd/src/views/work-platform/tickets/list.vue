<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TicketsApi } from '#/api/operation/tickets';
import type { WorkflowApi } from '#/api/operation/workflow';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  DeleteOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons-vue';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Input,
  message,
  Modal,
  Select,
  Space,
  Steps,
  Tabs,
  Tag,
  Textarea,
  Timeline,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  assignTicketApi,
  createCommentApi,
  deleteTicketAttachmentApi,
  downloadTicketAttachmentApi,
  executeTicketSourceActionApi,
  getTicketClosureContextApi,
  getTicketsApi,
  updateTicketStatusApi,
  uploadAttachmentApi,
} from '#/api/operation/tickets';
import {
  completeNodeApi,
  getWorkflowStatsApi,
  getWorkflowTopologyApi,
} from '#/api/operation/workflow';
import { loadSystemUserOptions } from '#/utils/system-user-options';

import { useColumns, useFormSchema } from './data';
import {
  approveOpinionPresets,
  getSourceTypeLabel,
  priorityColor,
  rejectOpinionPresets,
  renderSourceValue,
  sourceActionHelp,
  sourceContextItems,
  statusActionHelp,
  statusText,
} from './detail-meta';

defineOptions({ name: 'WorkPlatformTickets' });

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { hasAccessByCodes } = useAccess();
const assignDialogVisible = ref(false);
const detailVisible = ref(false);
const detailLoading = ref(false);
const nodeActionLoading = ref(false);
const statusLoading = ref(false);
const commentLoading = ref(false);
const attachmentLoading = ref(false);
const attachmentInput = ref<HTMLInputElement>();
const sourceActionVisible = ref(false);
const sourceActionLoading = ref(false);
const userOptions = ref<any[]>([]);
const activeDetailTab = ref('handle');
const activeScope = ref('all');
const sourceFilter = ref('');
const statusFilter = ref('');
const assignForm = ref({ assigneeId: '', ticketId: '', ticketTitle: '' });
const currentTicket = ref<null | TicketsApi.Ticket>(null);
const closureContext = ref<null | TicketsApi.ClosureContext>(null);
const nodeComment = ref('');
const commentText = ref('');
const stats = ref<WorkflowApi.Stats>({
  my_pending: 0,
  my_processing: 0,
  my_overdue: 0,
  my_completed: 0,
  total_completed: 0,
  total_tickets: 0,
});
const topology = ref<WorkflowApi.Topology>({
  pool_count: 0,
  sources: [],
  status_distribution: {},
});
const sourceActionForm = ref({
  actionKey: '',
  actionLabel: '',
  assigned_user_id: '',
  comment: '',
  description: '',
  due_date: '',
  title: '',
});

async function ensureUserOptions() {
  if (userOptions.value.length > 0) {
    return;
  }
  try {
    const { options } = await loadSystemUserOptions({
      include_disabled: true,
    });
    userOptions.value = options;
  } catch (error: any) {
    message.error(error?.message || '加载用户列表失败');
  }
}

const scopeTabs = computed(() => [
  { key: 'all', label: `活跃工单 ${stats.value.total_tickets}` },
  { key: 'my_pending', label: `我的待办 ${stats.value.my_pending}` },
  { key: 'my_assigned', label: `我处理中 ${stats.value.my_processing}` },
  { key: 'unassigned', label: `工单池 ${topology.value.pool_count}` },
  { key: 'overdue', label: `逾期 ${stats.value.my_overdue}` },
  { key: 'closed', label: `已处理 ${stats.value.total_completed}` },
  { key: 'source_action', label: '来源闭环' },
]);

const activeFilterText = computed(() => {
  const parts = [];
  if (sourceFilter.value) parts.push(`来源：${sourceFilter.value}`);
  if (statusFilter.value) parts.push(`状态：${statusFilter.value}`);
  return parts.join(' / ');
});

const workflowRecords = computed(() => closureContext.value?.workflow || []);

const activeWorkflowRecord = computed(() => {
  const currentNodeId = currentTicket.value?.current_node_id;
  return (
    workflowRecords.value.find(
      (record: any) =>
        record.node_id === currentNodeId &&
        ['pending', 'processing'].includes(record.status),
    ) ||
    workflowRecords.value.find((record: any) =>
      ['pending', 'processing'].includes(record.status),
    ) ||
    null
  );
});

const currentStepIndex = computed(() => {
  if (workflowRecords.value.length === 0) return 0;
  const activeIndex = workflowRecords.value.findIndex(
    (record: any) => record.id === activeWorkflowRecord.value?.id,
  );
  if (activeIndex !== -1) return activeIndex;
  return ['closed', 'resolved'].includes(currentTicket.value?.status || '')
    ? workflowRecords.value.length
    : 0;
});

const currentNodeName = computed(() => {
  if (!currentTicket.value?.current_node_id) return '暂无活动节点';
  return (
    activeWorkflowRecord.value?.node_name ||
    activeWorkflowRecord.value?.node_type ||
    currentTicket.value.current_node_id
  );
});

const currentAssignee = computed(() => {
  return (
    activeWorkflowRecord.value?.assignee_name ||
    activeWorkflowRecord.value?.assignee_id ||
    currentTicket.value?.assignee_id ||
    '-'
  );
});

const currentUserId = computed(
  () => userStore.userInfo?.userId || userStore.userInfo?.id || '',
);

const canAssignTicket = computed(() => hasAccessByCodes(['wp_tickets:assign']));
const canChangeTicketStatus = computed(() =>
  hasAccessByCodes(['wp_tickets:status', 'wp_my_tickets:handle']),
);
const canCommentTicket = computed(() =>
  hasAccessByCodes(['wp_tickets:comment', 'wp_my_tickets:handle']),
);
const canHandleWorkflowAction = computed(() =>
  hasAccessByCodes(['wp_my_tickets:handle', 'wp_tickets:status']),
);
const canRunSourceAction = computed(() =>
  hasAccessByCodes(['wp_tickets:source_action']),
);

const canHandleCurrentNode = computed(() => {
  if (!canHandleWorkflowAction.value) return false;
  const currentNodeId = currentTicket.value?.current_node_id;
  const userId = currentUserId.value;
  if (!currentNodeId || !userId) return false;
  return workflowRecords.value.some(
    (record: any) =>
      record.node_id === currentNodeId &&
      record.assignee_id === userId &&
      ['pending', 'processing'].includes(record.status),
  );
});

const workflowStatusLabel = computed(() => {
  const status = currentTicket.value?.status || '';
  if (!currentTicket.value?.template_id) return '未匹配流程';
  if (!currentTicket.value?.current_node_id && status === 'resolved')
    return '流程已归档';
  if (!currentTicket.value?.current_node_id && status === 'closed')
    return '流程已关闭';
  if (!currentTicket.value?.current_node_id) return '等待派发';
  return '流程处理中';
});

const isClosedTicket = computed(() =>
  ['closed', 'resolved'].includes(currentTicket.value?.status || ''),
);

function workflowStepStatus(record: any, index: number) {
  if (record.status === 'completed') return 'finish';
  if (record.status === 'timeout') return 'error';
  if (['pending', 'processing'].includes(record.status)) return 'process';
  if (index < currentStepIndex.value) return 'finish';
  return 'wait';
}

function onActionClick(e: OnActionClickParams<any>) {
  switch (e.code) {
    case 'assign': {
      openAssign(e.row);
      break;
    }
    case 'detail': {
      openDetail(e.row);
      break;
    }
  }
}

async function openAssign(row: any) {
  if (!canAssignTicket.value) {
    message.warning('无权限调整处理人');
    return;
  }
  if (['closed', 'resolved'].includes(row.status)) {
    message.warning('已完成/已关闭工单不可调整处理人');
    return;
  }
  await ensureUserOptions();
  assignForm.value = {
    assigneeId: row.assignee_id || '',
    ticketId: row.id,
    ticketTitle: row.title,
  };
  assignDialogVisible.value = true;
}

async function openDetail(row: string | TicketsApi.Ticket) {
  detailVisible.value = true;
  detailLoading.value = true;
  currentTicket.value = typeof row === 'string' ? null : row;
  closureContext.value = null;
  try {
    const ticketId = typeof row === 'string' ? row : row.id;
    const context = await getTicketClosureContextApi(ticketId);
    closureContext.value = context;
    currentTicket.value = context.ticket;
    commentText.value = '';
    activeDetailTab.value = 'handle';
  } catch (error: any) {
    message.error(error.message || '加载工单详情失败');
  } finally {
    detailLoading.value = false;
  }
}

async function handleSourceAction(actionKey: string) {
  if (!currentTicket.value) return;
  if (!canRunSourceAction.value) {
    message.warning('无权限执行来源联动');
    return;
  }
  if (isClosedTicket.value) {
    message.warning('已完成/已关闭工单不可执行来源联动');
    return;
  }
  await ensureUserOptions();
  const actionText =
    closureContext.value?.actions.find((item) => item.key === actionKey)
      ?.label || '执行动作';
  sourceActionForm.value = {
    actionKey,
    actionLabel: actionText,
    assigned_user_id: currentTicket.value.assignee_id || '',
    comment: '',
    description: currentTicket.value.description || '',
    due_date: '',
    title:
      actionKey === 'create_followup_task'
        ? `跟进工单：${currentTicket.value.title}`
        : '',
  };
  sourceActionVisible.value = true;
}

async function submitSourceAction() {
  if (!currentTicket.value) return;
  if (!canRunSourceAction.value) {
    message.warning('无权限执行来源联动');
    return;
  }
  const { actionKey, assigned_user_id, comment, description, due_date, title } =
    sourceActionForm.value;
  if (actionKey === 'create_followup_task' && !title.trim()) {
    message.error('请输入后续任务标题');
    return;
  }
  sourceActionLoading.value = true;
  try {
    const result = await executeTicketSourceActionApi(
      currentTicket.value.id,
      actionKey,
      comment || sourceActionForm.value.actionLabel,
      actionKey === 'create_followup_task'
        ? { assigned_user_id, description, due_date, title }
        : {},
    );
    message.success(result.message || '动作已执行');
    sourceActionVisible.value = false;
    await openDetail(currentTicket.value.id);
    await refreshGrid();
  } catch (error: any) {
    message.error(error.message || '动作执行失败');
  } finally {
    sourceActionLoading.value = false;
  }
}

async function handleNodeAction(action: 'approve' | 'reject') {
  if (!currentTicket.value) return;
  if (!canHandleWorkflowAction.value) {
    message.warning('无权限处理当前流程节点');
    return;
  }
  if (action === 'reject' && !nodeComment.value.trim()) {
    message.error('驳回时请选择或填写处理意见');
    return;
  }
  nodeActionLoading.value = true;
  try {
    await completeNodeApi(currentTicket.value.id, action, nodeComment.value);
    message.success(action === 'approve' ? '节点已通过' : '节点已驳回');
    nodeComment.value = '';
    await openDetail(currentTicket.value.id);
    await refreshGrid();
  } catch (error: any) {
    message.error(error.message || '节点处置失败');
  } finally {
    nodeActionLoading.value = false;
  }
}

function applyOpinion(text: string) {
  nodeComment.value = text;
}

async function handleStatusChange(status: string) {
  if (!currentTicket.value) return;
  if (!canChangeTicketStatus.value) {
    message.warning('无权限调整工单状态');
    return;
  }
  if (isClosedTicket.value) {
    message.warning('已完成/已关闭工单不可调整状态');
    return;
  }
  statusLoading.value = true;
  try {
    await updateTicketStatusApi(currentTicket.value.id, status);
    message.success('状态已更新');
    await openDetail(currentTicket.value.id);
    await refreshGrid();
  } catch (error: any) {
    message.error(error.message || '状态更新失败');
  } finally {
    statusLoading.value = false;
  }
}

async function submitComment() {
  if (!canCommentTicket.value) {
    message.warning('无权限记录工单评论');
    return;
  }
  if (isClosedTicket.value) {
    message.warning('已完成/已关闭工单不可继续评论');
    return;
  }
  if (!currentTicket.value || !commentText.value.trim()) {
    message.error('请输入评论内容');
    return;
  }
  commentLoading.value = true;
  try {
    await createCommentApi(
      currentTicket.value.id,
      commentText.value.trim(),
      true,
    );
    message.success('评论已记录');
    commentText.value = '';
    await openDetail(currentTicket.value.id);
  } catch (error: any) {
    message.error(error.message || '评论失败');
  } finally {
    commentLoading.value = false;
  }
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function triggerAttachmentUpload() {
  if (!canCommentTicket.value || isClosedTicket.value) return;
  attachmentInput.value?.click();
}

async function handleAttachmentSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !currentTicket.value) return;
  if (file.size > 20 * 1024 * 1024) {
    message.error('附件不能超过 20MB');
    return;
  }
  attachmentLoading.value = true;
  try {
    await uploadAttachmentApi(currentTicket.value.id, file);
    message.success('附件上传成功');
    await openDetail(currentTicket.value.id);
  } catch (error: any) {
    message.error(error.message || '附件上传失败');
  } finally {
    attachmentLoading.value = false;
  }
}

async function downloadAttachment(attachment: TicketsApi.TicketAttachment) {
  if (!currentTicket.value) return;
  try {
    const response: any = await downloadTicketAttachmentApi(
      currentTicket.value.id,
      attachment.id,
    );
    const blob = response instanceof Blob ? response : response?.data;
    if (!(blob instanceof Blob)) throw new TypeError('附件响应格式错误');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error: any) {
    message.error(error.message || '附件下载失败');
  }
}

function canDeleteAttachment(attachment: TicketsApi.TicketAttachment) {
  const userId = userStore.userInfo?.userId || userStore.userInfo?.id;
  return (
    hasAccessByCodes(['wp_tickets:comment']) || attachment.user_id === userId
  );
}

async function removeAttachment(attachment: TicketsApi.TicketAttachment) {
  if (!currentTicket.value) return;
  const ticketId = currentTicket.value.id;
  Modal.confirm({
    cancelText: '取消',
    content: `确认删除附件“${attachment.filename}”吗？`,
    okText: '删除',
    okType: 'danger',
    title: '删除附件',
    onOk: async () => {
      await deleteTicketAttachmentApi(ticketId, attachment.id);
      message.success('附件已删除');
      await openDetail(ticketId);
    },
  });
}

async function handleAssignConfirm() {
  if (!canAssignTicket.value) {
    message.warning('无权限调整处理人');
    return;
  }
  if (!assignForm.value.assigneeId.trim()) {
    message.error('请选择处理人');
    return;
  }
  try {
    await assignTicketApi(
      assignForm.value.ticketId,
      assignForm.value.assigneeId.trim(),
    );
    message.success('分配成功');
    assignDialogVisible.value = false;
    await refreshGrid();
  } catch (error: any) {
    message.error(error.message || '分配失败');
  }
}

async function loadSummary() {
  try {
    const [statsRes, topologyRes] = await Promise.all([
      getWorkflowStatsApi(),
      getWorkflowTopologyApi(),
    ]);
    stats.value = statsRes;
    topology.value = topologyRes;
  } catch (error: any) {
    message.error(error.message || '加载工单汇总失败');
  }
}

async function refreshGrid() {
  await Promise.all([loadSummary(), gridApi.query()]);
}

function handleScopeChange(scope: string) {
  activeScope.value = scope;
  sourceFilter.value = '';
  statusFilter.value = '';
  gridApi.query();
}

function applyRouteFilters() {
  const scope = route.query.scope;
  const sourceType = route.query.source_type;
  const status = route.query.status;
  activeScope.value = typeof scope === 'string' && scope ? scope : 'all';
  sourceFilter.value = typeof sourceType === 'string' ? sourceType : '';
  statusFilter.value = typeof status === 'string' ? status : '';
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useFormSchema(), submitOnChange: true },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      response: {
        list: 'list',
        result: 'list',
        total: 'total',
      },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getTicketsApi({
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
            scope: activeScope.value === 'all' ? undefined : activeScope.value,
            source_type: sourceFilter.value || formValues.source_type,
            status: statusFilter.value || formValues.status,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, refresh: true, search: true, zoom: true },
  } as VxeTableGridOptions,
});

onMounted(() => {
  applyRouteFilters();
  loadSummary();
  const ticketId = route.query.ticketId;
  if (typeof ticketId === 'string' && ticketId) {
    openDetail(ticketId);
  }
});

watch(
  () => route.query,
  (query) => {
    applyRouteFilters();
    gridApi.query();
    const ticketId = query.ticketId;
    if (typeof ticketId === 'string' && ticketId) {
      openDetail(ticketId);
    }
  },
);
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-lg font-semibold">工单处理</h2>
          <div class="mt-1 text-sm text-muted-foreground">
            派发、推进、反写来源和记录处理结果
            <span v-if="activeFilterText"> · {{ activeFilterText }}</span>
          </div>
        </div>
        <Space>
          <Button @click="refreshGrid">
            <ReloadOutlined />
            刷新
          </Button>
          <Button
            v-access:code="['wp_tickets:add']"
            type="primary"
            @click="router.push('/work-platform/intake')"
          >
            <PlusOutlined />
            新建工单
          </Button>
        </Space>
      </div>

      <Tabs
        v-model:active-key="activeScope"
        size="small"
        @change="(key) => handleScopeChange(String(key))"
      >
        <Tabs.TabPane
          v-for="item in scopeTabs"
          :key="item.key"
          :tab="item.label"
        />
      </Tabs>

      <Grid class="min-h-0 flex-1" />
    </div>

    <Modal
      v-model:open="assignDialogVisible"
      title="分配工单"
      @ok="handleAssignConfirm"
    >
      <div class="space-y-4 py-2">
        <div>
          <div class="mb-2 text-sm text-muted-foreground">工单</div>
          <Input :value="assignForm.ticketTitle" disabled />
        </div>
        <div>
          <div class="mb-2 text-sm text-muted-foreground">处理人</div>
          <Select
            v-model:value="assignForm.assigneeId"
            :allow-clear="true"
            :options="userOptions"
            :show-search="true"
            placeholder="请选择处理人"
            style="width: 100%"
          >
            <template #suffixIcon>
              <UserSwitchOutlined />
            </template>
          </Select>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="sourceActionVisible"
      :confirm-loading="sourceActionLoading"
      :title="sourceActionForm.actionLabel"
      @ok="submitSourceAction"
    >
      <div class="space-y-4 py-2">
        <div
          v-if="sourceActionForm.actionKey === 'create_followup_task'"
          class="space-y-4"
        >
          <div>
            <div class="mb-2 text-sm text-muted-foreground">任务标题</div>
            <Input
              v-model:value="sourceActionForm.title"
              placeholder="请输入后续任务标题"
            />
          </div>
          <div>
            <div class="mb-2 text-sm text-muted-foreground">指派给</div>
            <Select
              v-model:value="sourceActionForm.assigned_user_id"
              :allow-clear="true"
              :options="userOptions"
              :show-search="true"
              placeholder="请选择负责人，可留空"
              style="width: 100%"
            />
          </div>
          <div>
            <div class="mb-2 text-sm text-muted-foreground">截止时间</div>
            <Input
              v-model:value="sourceActionForm.due_date"
              placeholder="YYYY-MM-DD HH:mm:ss，可留空"
            />
          </div>
          <div>
            <div class="mb-2 text-sm text-muted-foreground">任务说明</div>
            <Textarea
              v-model:value="sourceActionForm.description"
              :rows="3"
              placeholder="请输入任务说明"
            />
          </div>
        </div>
        <div>
          <div class="mb-2 text-sm text-muted-foreground">处置说明</div>
          <Textarea
            v-model:value="sourceActionForm.comment"
            :rows="4"
            placeholder="记录本次闭环动作的处置说明"
          />
        </div>
      </div>
    </Modal>

    <Drawer
      v-model:open="detailVisible"
      :width="880"
      destroy-on-close
      title="工单详情"
    >
      <div v-if="currentTicket" class="space-y-5">
        <div class="rounded-lg border border-border bg-background p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-base font-semibold">
                {{ currentTicket.title }}
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                <Tag
                  :color="
                    priorityColor[currentTicket.priority || ''] || 'default'
                  "
                >
                  {{ currentTicket.priority || '-' }}
                </Tag>
                <Tag color="processing">
                  {{ statusText[currentTicket.status] || currentTicket.status }}
                </Tag>
                <Tag>{{ currentTicket.source_type || 'manual' }}</Tag>
              </div>
            </div>
            <Button
              v-if="!isClosedTicket && canAssignTicket"
              size="small"
              @click="openAssign(currentTicket)"
            >
              调整处理人
            </Button>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div class="rounded-md bg-muted/40 px-3 py-2">
              <div class="text-xs text-muted-foreground">流程状态</div>
              <div class="mt-1 text-sm font-medium">
                {{ workflowStatusLabel }}
              </div>
            </div>
            <div class="rounded-md bg-muted/40 px-3 py-2">
              <div class="text-xs text-muted-foreground">当前节点</div>
              <div class="mt-1 text-sm font-medium">{{ currentNodeName }}</div>
            </div>
            <div class="rounded-md bg-muted/40 px-3 py-2">
              <div class="text-xs text-muted-foreground">节点处理人</div>
              <div class="mt-1 text-sm font-medium">{{ currentAssignee }}</div>
            </div>
          </div>

          <div class="mt-4">
            <Steps
              v-if="workflowRecords.length > 0"
              :current="currentStepIndex"
              :items="[]"
              size="small"
            >
              <Steps.Step
                v-for="(record, index) in workflowRecords"
                :key="record.id"
                :status="workflowStepStatus(record, index)"
                :title="record.node_name || record.node_type"
              >
                <template #description>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ record.assignee_name || record.assignee_id || '-' }}
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ record.completed_at || record.started_at || '-' }}
                  </div>
                </template>
              </Steps.Step>
            </Steps>
            <Alert
              v-else
              message="当前工单还没有流程记录，请先分配处理人或检查来源模板配置。"
              show-icon
              type="warning"
            />
          </div>
        </div>

        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="类型">
            {{ currentTicket.type }}
          </Descriptions.Item>
          <Descriptions.Item label="来源">
            {{ currentTicket.source_type || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="提交人">
            {{ currentTicket.requester_id }}
          </Descriptions.Item>
          <Descriptions.Item label="处理人">
            {{ currentTicket.assignee_id || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="部门">
            {{ currentTicket.department || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {{ currentTicket.category || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{ currentTicket.created_at }}
          </Descriptions.Item>
          <Descriptions.Item label="截止时间">
            {{ currentTicket.due_date || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <Alert
          v-if="isClosedTicket"
          message="该工单已完成或已关闭，只能查看流程、上下文和历史记录，不能再调整处理人、执行来源联动、评论或变更状态。"
          show-icon
          type="success"
        />

        <Tabs v-model:active-key="activeDetailTab" size="small">
          <Tabs.TabPane key="handle" tab="当前处理">
            <div class="space-y-4">
              <div
                v-if="
                  !isClosedTicket &&
                  currentTicket.current_node_id &&
                  canHandleCurrentNode
                "
                class="rounded-md border border-border p-3"
              >
                <div class="mb-2 text-sm font-medium">
                  处理当前节点：{{ currentNodeName }}
                </div>
                <div class="mb-3 text-xs text-muted-foreground">
                  当前节点由
                  {{ currentAssignee }}
                  处理。通过后进入下一节点；驳回会结束当前流程并退回补充。
                </div>
                <div class="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <div class="mb-2 text-xs text-muted-foreground">
                      通过意见预设
                    </div>
                    <Select
                      class="w-full"
                      :options="
                        approveOpinionPresets.map((item) => ({
                          label: item,
                          value: item,
                        }))
                      "
                      placeholder="选择通过意见"
                      @change="(value) => applyOpinion(String(value))"
                    />
                  </div>
                  <div>
                    <div class="mb-2 text-xs text-muted-foreground">
                      驳回意见预设
                    </div>
                    <Select
                      class="w-full"
                      :options="
                        rejectOpinionPresets.map((item) => ({
                          label: item,
                          value: item,
                        }))
                      "
                      placeholder="选择驳回原因"
                      @change="(value) => applyOpinion(String(value))"
                    />
                  </div>
                </div>
                <Textarea
                  v-model:value="nodeComment"
                  :rows="3"
                  class="mb-3"
                  placeholder="处理意见、审批结论或驳回原因"
                />
                <Space wrap>
                  <Button
                    :loading="nodeActionLoading"
                    type="primary"
                    @click="handleNodeAction('approve')"
                  >
                    通过并推进
                  </Button>
                  <Button
                    :loading="nodeActionLoading"
                    danger
                    @click="handleNodeAction('reject')"
                  >
                    驳回
                  </Button>
                </Space>
              </div>

              <Alert
                v-else-if="
                  !isClosedTicket &&
                  currentTicket.current_node_id &&
                  activeWorkflowRecord
                "
                :message="`当前节点由 ${currentAssignee} 处理，你可以查看流程和上下文，但不能推进该节点。`"
                show-icon
                type="info"
              />

              <Alert
                v-else-if="!isClosedTicket"
                message="当前工单没有可推进的活动节点。可查看流程记录，或在特殊情况下使用人工状态调整。"
                show-icon
                type="info"
              />

              <div
                v-if="!isClosedTicket && closureContext?.actions.length"
                class="rounded-md border border-border p-3"
              >
                <div class="mb-1 text-sm font-medium">来源联动</div>
                <div class="mb-3 text-xs text-muted-foreground">
                  只处理与原始来源系统有关的动作，例如关闭告警、重跑失败任务或创建后续任务。
                </div>
                <div class="space-y-2">
                  <div
                    v-for="action in closureContext.actions"
                    :key="action.key"
                    class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
                  >
                    <div>
                      <div class="text-sm font-medium">{{ action.label }}</div>
                      <div class="mt-1 text-xs text-muted-foreground">
                        {{
                          sourceActionHelp[action.key]?.desc ||
                          '执行关联来源系统的闭环动作。'
                        }}
                      </div>
                    </div>
                    <Button
                      v-access:code="['wp_tickets:source_action']"
                      size="small"
                      @click="handleSourceAction(action.key)"
                    >
                      执行
                    </Button>
                  </div>
                </div>
              </div>

              <div
                v-if="!isClosedTicket"
                class="rounded-md border border-border p-3"
              >
                <div class="mb-1 text-sm font-medium">人工状态调整</div>
                <div class="mb-3 text-xs text-muted-foreground">
                  用于流程外的特殊情况。正常协作优先使用上面的“通过并推进/驳回”。
                </div>
                <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <button
                    v-for="(item, key) in statusActionHelp"
                    :key="key"
                    v-show="canChangeTicketStatus"
                    class="rounded-md border border-border bg-background p-3 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    :class="item.danger ? 'hover:border-red-500' : ''"
                    :disabled="statusLoading"
                    type="button"
                    @click="handleStatusChange(String(key))"
                  >
                    <div class="text-sm font-medium">{{ item.label }}</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ item.desc }}
                    </div>
                  </button>
                </div>
              </div>

              <div
                v-if="!isClosedTicket"
                class="rounded-md border border-border p-3"
              >
                <div class="mb-3 text-sm font-medium">记录评论</div>
                <Textarea
                  v-model:value="commentText"
                  :rows="3"
                  placeholder="处置过程、排查结论或协作信息"
                />
                <div class="mt-3 flex justify-end">
                  <Button
                    v-if="canCommentTicket"
                    :loading="commentLoading"
                    type="primary"
                    @click="submitComment"
                  >
                    保存评论
                  </Button>
                </div>
              </div>

              <div
                v-if="isClosedTicket"
                class="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
              >
                已完成/已关闭工单没有可执行动作。请在“上下文”和“记录”中查看归档信息。
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="context" tab="上下文">
            <div class="space-y-4">
              <div>
                <div class="mb-2 text-sm font-medium">描述</div>
                <div
                  class="min-h-20 whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm"
                >
                  {{ currentTicket.description || '无' }}
                </div>
              </div>

              <div
                v-if="closureContext?.source"
                class="rounded-md border border-border p-3"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-sm font-medium">来源上下文</span>
                  <Tag
                    :color="closureContext.source.found ? 'success' : 'default'"
                  >
                    {{ getSourceTypeLabel(closureContext.source.type) }}
                  </Tag>
                </div>
                <Descriptions :column="2" size="small">
                  <Descriptions.Item
                    v-for="item in sourceContextItems(closureContext.source)"
                    :key="item.key"
                    :label="item.label"
                  >
                    {{ renderSourceValue(item.value) }}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="records" tab="记录">
            <div class="space-y-5">
              <div>
                <div class="mb-3 text-sm font-medium">流程记录</div>
                <Timeline v-if="closureContext?.workflow.length">
                  <Timeline.Item
                    v-for="record in closureContext.workflow"
                    :key="record.id"
                  >
                    <div class="text-sm font-medium">
                      {{ record.node_name || record.node_type }} ·
                      {{ record.status }}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ record.assignee_name || record.assignee_id }} /
                      {{ record.started_at || '-' }}
                    </div>
                    <div v-if="record.comment" class="mt-1 text-sm">
                      {{ record.comment }}
                    </div>
                  </Timeline.Item>
                </Timeline>
                <div
                  v-else
                  class="rounded-md border border-border p-4 text-center text-sm text-muted-foreground"
                >
                  暂无流程记录
                </div>
              </div>

              <div>
                <div class="mb-3 text-sm font-medium">评论与系统记录</div>
                <Timeline v-if="closureContext?.comments.length">
                  <Timeline.Item
                    v-for="comment in closureContext.comments"
                    :key="comment.id"
                  >
                    <div class="text-sm">{{ comment.content }}</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ comment.user_id }} / {{ comment.created_at }}
                    </div>
                  </Timeline.Item>
                </Timeline>
                <div
                  v-else
                  class="rounded-md border border-border p-4 text-center text-sm text-muted-foreground"
                >
                  暂无评论
                </div>
              </div>

              <div>
                <div class="mb-3 flex items-center justify-between">
                  <div class="text-sm font-medium">附件</div>
                  <Button
                    v-if="canCommentTicket && !isClosedTicket"
                    :loading="attachmentLoading"
                    size="small"
                    @click="triggerAttachmentUpload"
                  >
                    <template #icon><PaperClipOutlined /></template>
                    上传附件
                  </Button>
                  <input
                    ref="attachmentInput"
                    accept=".doc,.docx,.gif,.jpeg,.jpg,.log,.pdf,.png,.txt,.xls,.xlsx,.zip"
                    class="hidden"
                    type="file"
                    @change="handleAttachmentSelect"
                  />
                </div>
                <div
                  v-if="closureContext?.attachments?.length"
                  class="divide-border rounded-md border"
                >
                  <div
                    v-for="attachment in closureContext.attachments"
                    :key="attachment.id"
                    class="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div class="min-w-0">
                      <div class="truncate text-sm">
                        {{ attachment.filename }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ formatFileSize(attachment.file_size) }} ·
                        {{ attachment.created_at }}
                      </div>
                    </div>
                    <Space>
                      <Button
                        size="small"
                        type="text"
                        @click="downloadAttachment(attachment)"
                      >
                        <template #icon><DownloadOutlined /></template>
                      </Button>
                      <Button
                        v-if="canDeleteAttachment(attachment)"
                        danger
                        size="small"
                        type="text"
                        @click="removeAttachment(attachment)"
                      >
                        <template #icon><DeleteOutlined /></template>
                      </Button>
                    </Space>
                  </div>
                </div>
                <div
                  v-else
                  class="rounded-md border border-border p-4 text-center text-sm text-muted-foreground"
                >
                  暂无附件
                </div>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
      <div
        v-else-if="detailLoading"
        class="py-10 text-center text-muted-foreground"
      >
        加载中
      </div>
    </Drawer>
  </Page>
</template>
