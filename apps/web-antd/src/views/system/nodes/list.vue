<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Button,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createNodeApi,
  deleteNodeApi,
  getNodeHealthHistoryApi,
  getNodeListApi,
  updateNodeApi,
} from '#/api/system/nodes';

import { useColumns, useFormSchema } from './data';

defineOptions({
  name: 'SystemNodes',
});

const { hasAccessByCodes } = useAccess();
const canAdd = hasAccessByCodes(['system_nodes:add']);
const canDelete = hasAccessByCodes(['system_nodes:delete']);
const canEdit = hasAccessByCodes(['system_nodes:edit']);

const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const historyDialogVisible = ref(false);
const loading = ref(false);
const historyLoading = ref(false);
const currentNodeName = ref('');
const historyTotal = ref(0);
const historyData = ref<any[]>([]);
const createForm = ref({
  name: '',
  host: '',
  port: 0,
  node_type: 'servers',
  status: 'active',
  description: '',
});
const editForm = ref({
  id: '',
  name: '',
  host: '',
  port: 0,
  node_type: 'servers',
  status: 'active',
  description: '',
});

const nodeTypeOptions = [
  { label: '服务器 Agent', value: 'servers' },
  { label: '安全 Agent', value: 'security' },
  { label: '通用 Agent', value: 'agent' },
  { label: 'Worker节点', value: 'worker' },
  { label: '报表节点', value: 'report' },
];

const nodeStatusOptions = [
  { label: '活跃', value: 'active' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
  { label: '离线', value: 'offline' },
  { label: '维护中', value: 'maintenance' },
];

function onActionClick(e: OnActionClickParams<any>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      handleEdit(e.row);
      break;
    }
    case 'history': {
      handleViewHistory(e.row);
      break;
    }
  }
}

function onDelete(row: any) {
  if (!canDelete) {
    message.warning('无权限删除节点');
    return;
  }
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除节点"${row.name}"吗？`,
    async onOk() {
      try {
        await deleteNodeApi(row.id);
        message.success('删除成功');
        gridApi.reload();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}

function handleCreate() {
  if (!canAdd) {
    message.warning('无权限新建节点');
    return;
  }
  createForm.value = {
    name: '',
    host: '',
    port: 0,
    node_type: 'servers',
    status: 'active',
    description: '',
  };
  createDialogVisible.value = true;
}

async function handleCreateConfirm() {
  if (!canAdd) {
    message.warning('无权限新建节点');
    return;
  }
  if (!createForm.value.name) {
    message.error('请输入节点名称');
    return;
  }
  if (!createForm.value.host) {
    message.error('请输入主机地址');
    return;
  }

  try {
    loading.value = true;
    await createNodeApi(createForm.value);
    message.success('创建成功');
    createDialogVisible.value = false;
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

function handleEdit(row: any) {
  if (!canEdit) {
    message.warning('无权限编辑节点');
    return;
  }
  editForm.value = {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    node_type: row.node_type,
    status: row.status,
    description: row.description || '',
  };
  editDialogVisible.value = true;
}

function parseHealthDetails(record: any) {
  if (!record?.error_message) {
    return { issues: [], service_checks: {}, task_summary: {} };
  }
  try {
    const parsed = JSON.parse(record.error_message);
    return {
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      service_checks: parsed.service_checks || {},
      task_summary: parsed.task_summary || {},
    };
  } catch {
    return {
      issues: [record.error_message],
      service_checks: {},
      task_summary: {},
    };
  }
}

function taskBusinessFailedCount(taskSummary: any) {
  return Number(
    taskSummary?.business_failed_recent ?? taskSummary?.failed_recent ?? 0,
  );
}

function taskCleanupCount(taskSummary: any) {
  return Number(taskSummary?.cleanup_recent ?? 0);
}

function taskRawFailedCount(taskSummary: any) {
  return Number(
    taskSummary?.raw_failed_recent ??
      taskBusinessFailedCount(taskSummary) + taskCleanupCount(taskSummary),
  );
}

function serviceStatusColor(status?: string) {
  if (status === 'ok' || status === 'healthy') return 'success';
  if (status === 'skipped') return 'default';
  if (status === 'warning') return 'warning';
  return 'error';
}

function serviceStatusText(status?: string) {
  const map: Record<string, string> = {
    error: '异常',
    healthy: '正常',
    ok: '正常',
    skipped: '跳过',
    warning: '警告',
  };
  return map[status || ''] || '异常';
}

async function handleEditConfirm() {
  if (!canEdit) {
    message.warning('无权限编辑节点');
    return;
  }
  if (!editForm.value.name) {
    message.error('请输入节点名称');
    return;
  }
  if (!editForm.value.host) {
    message.error('请输入主机地址');
    return;
  }

  try {
    loading.value = true;
    const { id, ...data } = editForm.value;
    await updateNodeApi(id, data);
    message.success('更新成功');
    editDialogVisible.value = false;
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '更新失败');
  } finally {
    loading.value = false;
  }
}

async function handleViewHistory(row: any) {
  currentNodeName.value = row.name;
  historyDialogVisible.value = true;
  historyLoading.value = true;

  try {
    const res = await getNodeHealthHistoryApi(row.id, { limit: 100 });
    historyData.value = res.list || [];
    historyTotal.value = res.total || 0;
  } catch (error: any) {
    message.error(error.message || '获取历史记录失败');
    historyData.value = [];
    historyTotal.value = 0;
  } finally {
    historyLoading.value = false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params: any = {
            skip: (page.currentPage - 1) * page.pageSize,
            limit: page.pageSize,
          };

          if (formValues.status) params.status = formValues.status;
          if (formValues.node_type) params.node_type = formValues.node_type;
          if (formValues.search) params.search = formValues.search;

          return await getNodeListApi(params);
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
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button v-if="canAdd" type="primary" @click="handleCreate">
          新建节点
        </Button>
      </template>
    </Grid>

    <!-- 创建节点对话框 -->
    <Modal
      v-model:open="createDialogVisible"
      title="新建节点"
      :confirm-loading="loading"
      @ok="handleCreateConfirm"
    >
      <div style="padding: 16px 0">
        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            节点名称 <span style="color: #ff4d4f">*</span>
          </label>
          <Input v-model:value="createForm.name" placeholder="请输入节点名称" />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            主机地址 <span style="color: #ff4d4f">*</span>
          </label>
          <Input
            v-model:value="createForm.host"
            placeholder="请输入主机地址或IP"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            端口
          </label>
          <Input
            v-model:value="createForm.port"
            type="number"
            placeholder="请输入端口号"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            节点类型
          </label>
          <Select
            v-model:value="createForm.node_type"
            :options="nodeTypeOptions"
            style="width: 100%"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            状态
          </label>
          <Select
            v-model:value="createForm.status"
            :options="nodeStatusOptions"
            style="width: 100%"
          />
        </div>

        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            描述
          </label>
          <Textarea
            v-model:value="createForm.description"
            :rows="3"
            placeholder="请输入节点描述"
          />
        </div>
      </div>
    </Modal>

    <!-- 编辑节点对话框 -->
    <Modal
      v-model:open="editDialogVisible"
      title="编辑节点"
      :confirm-loading="loading"
      @ok="handleEditConfirm"
    >
      <div style="padding: 16px 0">
        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            节点名称 <span style="color: #ff4d4f">*</span>
          </label>
          <Input v-model:value="editForm.name" placeholder="请输入节点名称" />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            主机地址 <span style="color: #ff4d4f">*</span>
          </label>
          <Input
            v-model:value="editForm.host"
            placeholder="请输入主机地址或IP"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            端口
          </label>
          <Input
            v-model:value="editForm.port"
            type="number"
            placeholder="请输入端口号"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            节点类型
          </label>
          <Select
            v-model:value="editForm.node_type"
            :options="nodeTypeOptions"
            style="width: 100%"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            状态
          </label>
          <Select
            v-model:value="editForm.status"
            :options="nodeStatusOptions"
            style="width: 100%"
          />
        </div>

        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            描述
          </label>
          <Textarea
            v-model:value="editForm.description"
            :rows="3"
            placeholder="请输入节点描述"
          />
        </div>
      </div>
    </Modal>

    <!-- 健康状态历史对话框 -->
    <Modal
      v-model:open="historyDialogVisible"
      :title="`节点健康状态历史 - ${currentNodeName} (共 ${historyTotal} 条记录)`"
      width="1100px"
      :footer="null"
    >
      <Table
        :columns="[
          {
            title: '检查时间',
            dataIndex: 'check_time',
            key: 'check_time',
            width: 180,
          },
          { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
          {
            title: 'CPU使用率',
            dataIndex: 'cpu_usage',
            key: 'cpu_usage',
            width: 120,
          },
          {
            title: '内存使用率',
            dataIndex: 'memory_usage',
            key: 'memory_usage',
            width: 120,
          },
          {
            title: '磁盘使用率',
            dataIndex: 'disk_usage',
            key: 'disk_usage',
            width: 120,
          },
          {
            title: '响应时间(ms)',
            dataIndex: 'response_time',
            key: 'response_time',
            width: 120,
          },
          {
            title: '服务状态',
            dataIndex: 'error_message',
            key: 'service_checks',
            width: 190,
          },
          {
            title: '任务摘要',
            dataIndex: 'error_message',
            key: 'task_summary',
            width: 180,
          },
          {
            title: '问题',
            dataIndex: 'error_message',
            key: 'issues',
            ellipsis: true,
          },
        ]"
        :data-source="historyData"
        :loading="historyLoading"
        :pagination="{
          pageSize: 20,
          total: historyTotal,
          showTotal: (total: number) => `共 ${total} 条记录`,
          showSizeChanger: true,
          showQuickJumper: true,
        }"
        :scroll="{ y: 500 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'check_time'">
            {{ new Date(record.check_time).toLocaleString('zh-CN') }}
          </template>
          <template v-if="column.key === 'status'">
            <Tag
              :color="
                record.status === 'healthy' || record.status === 'active'
                  ? 'success'
                  : record.status === 'warning'
                    ? 'warning'
                    : 'error'
              "
            >
              {{
                record.status === 'healthy' || record.status === 'active'
                  ? '健康'
                  : record.status === 'warning'
                    ? '警告'
                    : '错误'
              }}
            </Tag>
          </template>
          <template v-if="column.key === 'cpu_usage'">
            {{
              record.cpu_usage === null || record.cpu_usage === undefined
                ? '-'
                : `${record.cpu_usage}%`
            }}
          </template>
          <template v-if="column.key === 'memory_usage'">
            {{
              record.memory_usage === null || record.memory_usage === undefined
                ? '-'
                : `${record.memory_usage}%`
            }}
          </template>
          <template v-if="column.key === 'disk_usage'">
            {{
              record.disk_usage === null || record.disk_usage === undefined
                ? '-'
                : `${record.disk_usage}%`
            }}
          </template>
          <template v-if="column.key === 'response_time'">
            {{
              record.response_time === null ||
              record.response_time === undefined
                ? '-'
                : record.response_time
            }}
          </template>
          <template v-if="column.key === 'service_checks'">
            <div class="health-tags">
              <Tag
                v-for="(item, key) in parseHealthDetails(record).service_checks"
                :key="key"
                :color="serviceStatusColor(item?.status)"
              >
                {{ key }} {{ serviceStatusText(item?.status) }}
              </Tag>
              <span
                v-if="
                  Object.keys(parseHealthDetails(record).service_checks)
                    .length === 0
                "
              >
                -
              </span>
            </div>
          </template>
          <template v-if="column.key === 'task_summary'">
            <div class="health-summary">
              <span>
                执行中
                {{ parseHealthDetails(record).task_summary.running || 0 }}
              </span>
              <span>
                业务失败
                {{
                  taskBusinessFailedCount(
                    parseHealthDetails(record).task_summary,
                  )
                }}
              </span>
              <span>
                收口
                {{ taskCleanupCount(parseHealthDetails(record).task_summary) }}
              </span>
              <span>
                原始失败
                {{
                  taskRawFailedCount(parseHealthDetails(record).task_summary)
                }}
              </span>
              <span>
                成功
                {{
                  parseHealthDetails(record).task_summary.success_recent || 0
                }}
              </span>
            </div>
          </template>
          <template v-if="column.key === 'issues'">
            <div class="health-issues">
              <Tag
                v-for="issue in parseHealthDetails(record).issues.slice(0, 2)"
                :key="issue"
                color="warning"
              >
                {{ issue }}
              </Tag>
              <span v-if="parseHealthDetails(record).issues.length === 0">
                {{ '-' }}
              </span>
            </div>
          </template>
        </template>
      </Table>
    </Modal>
  </Page>
</template>

<style scoped>
.health-tags,
.health-issues,
.health-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.health-summary {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
</style>
