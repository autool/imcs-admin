<script lang="ts" setup>
import type { NotificationTypeMeta } from './data';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { NotificationConfigApi } from '#/api/system/notification-configs';
import type { NotificationTemplate } from '#/api/system/notification-templates';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Button,
  Checkbox,
  Divider,
  Input,
  message,
  Modal,
  Select,
  SelectOption,
  Space,
  TabPane,
  Tabs,
  Tag,
  Textarea,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getNotificationConfigsApi } from '#/api/system/notification-configs';
import {
  createNotificationTemplateApi,
  deleteNotificationTemplateApi,
  getNotificationTemplateListApi,
  updateNotificationTemplateApi,
} from '#/api/system/notification-templates';

import {
  getNotificationTypeMeta,
  NOTIFICATION_TYPE_META,
  useColumns,
} from './data';

defineOptions({
  name: 'NotificationTemplates',
});

const editDialogVisible = ref(false);
const { hasAccessByCodes } = useAccess();
const createDialogVisible = ref(false);
const loading = ref(false);
const editForm = ref({
  id: '',
  name: '',
  type: '',
  title_template: '',
  content_template: '',
  variables: {} as Record<string, string>,
  notification_channels: [] as string[],
  use_external: true,
});

const createForm = ref({
  name: '',
  type: '',
  title_template: '',
  content_template: '',
  variables: {} as Record<string, string>,
  notification_channels: [] as string[],
  use_external: false,
});

// 变量管理
const variableKey = ref('');
const variableDesc = ref('');
const canCreateTemplate = hasAccessByCodes(['notifications_templates:add']);
const canEditTemplate = hasAccessByCodes(['notifications_templates:edit']);
const canDeleteTemplate = hasAccessByCodes(['notifications_templates:delete']);

// 常用模板类型
const preferredCommonTypes = [
  'alert_triggered',
  'node_timeout',
  'node_recovered',
  'task_completed',
  'task_failed',
  'work_ticket_assigned',
  'work_ticket_timeout',
  'work_ticket_resolved',
];

const commonTypes = [
  ...preferredCommonTypes
    .map((value) => NOTIFICATION_TYPE_META[value])
    .filter((item): item is NotificationTypeMeta => item !== undefined),
  { value: 'custom', label: '自定义类型', color: 'default', group: '自定义' },
];

// 模板示例
const templateExamples = {
  task_completed: {
    title: '任务完成: {task_name}',
    content:
      '任务 {task_name} 已完成。\n执行时间: {execution_time}\n执行状态: {status}\n执行结果: {result}',
    variables: {
      task_name: '任务名称',
      execution_time: '执行时间',
      status: '执行状态',
      result: '执行结果',
    },
  },
  task_failed: {
    title: '任务失败: {task_name}',
    content:
      '任务 {task_name} 执行失败。\n失败时间: {failure_time}\n错误信息: {error_message}',
    variables: {
      task_name: '任务名称',
      failure_time: '失败时间',
      error_message: '错误信息',
    },
  },
  system_alert: {
    title: '系统告警: {alert_title}',
    content:
      '告警类型: {alert_type}\n告警级别: {severity}\n告警内容: {alert_message}\n发生时间: {alert_time}',
    variables: {
      alert_title: '告警标题',
      alert_type: '告警类型',
      severity: '告警级别',
      alert_message: '告警内容',
      alert_time: '发生时间',
    },
  },
  node_timeout: {
    title: '节点心跳超时: {node_name}',
    content:
      '节点 {node_name} ({node_host}) 已超过 {timeout_minutes} 分钟未上报心跳。\n最后心跳时间: {last_heartbeat}',
    variables: {
      node_name: '节点名称',
      node_host: '节点主机地址',
      timeout_minutes: '超时分钟数',
      last_heartbeat: '最后心跳时间',
    },
  },
  node_recovered: {
    title: '节点状态恢复: {node_name}',
    content:
      '节点 {node_name} ({node_host}) 已恢复正常。\n当前状态: {status}\n恢复时间: {recovery_time}',
    variables: {
      node_name: '节点名称',
      node_host: '节点主机地址',
      status: '当前状态',
      recovery_time: '恢复时间',
    },
  },
};

// 通知配置列表
const notificationConfigs = ref<NotificationConfigApi.NotificationConfig[]>([]);

// 加载通知配置
async function loadNotificationConfigs() {
  try {
    const response = await getNotificationConfigsApi({
      is_enabled: true,
      limit: 100,
    });
    notificationConfigs.value = response.list;
  } catch (error: any) {
    console.error('加载通知配置失败:', error);
  }
}

onMounted(() => {
  loadNotificationConfigs();
});

// 辅助函数
function getConfigTypeName(type: string): string {
  const names: Record<string, string> = {
    email: '邮箱',
    wecom: '企业微信',
    webhook: 'Webhook',
  };
  return names[type] || type;
}

function getTypeDisplay(type: string) {
  return getNotificationTypeMeta(type);
}

function onActionClick(e: OnActionClickParams<NotificationTemplate>) {
  switch (e.code) {
    case 'delete': {
      handleDelete(e.row);
      break;
    }
    case 'edit': {
      handleEdit(e.row);
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
        query: async () => {
          return await getNotificationTemplateListApi();
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
  } as VxeTableGridOptions<NotificationTemplate>,
});

function handleEdit(row: NotificationTemplate) {
  if (!canEditTemplate) {
    message.warning('无权限编辑通知模板');
    return;
  }
  editForm.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    title_template: row.title_template,
    content_template: row.content_template,
    variables: row.variables || {},
    notification_channels: row.notification_channels || [],
    use_external: row.use_external !== false,
  };
  editDialogVisible.value = true;
}

async function handleEditConfirm() {
  if (!canEditTemplate) {
    message.warning('无权限保存通知模板');
    return;
  }
  if (!editForm.value.title_template) {
    message.error('请输入标题模板');
    return;
  }
  if (!editForm.value.content_template) {
    message.error('请输入内容模板');
    return;
  }

  try {
    loading.value = true;
    await updateNotificationTemplateApi(editForm.value.id, {
      title_template: editForm.value.title_template,
      content_template: editForm.value.content_template,
      notification_channels: editForm.value.notification_channels,
      use_external: editForm.value.use_external,
    });
    message.success('更新成功');
    editDialogVisible.value = false;
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '更新失败');
  } finally {
    loading.value = false;
  }
}

function handleCreate() {
  if (!canCreateTemplate) {
    message.warning('无权限新增通知模板');
    return;
  }
  createForm.value = {
    name: '',
    type: '',
    title_template: '',
    content_template: '',
    variables: {},
    notification_channels: [],
    use_external: false,
  };
  variableKey.value = '';
  variableDesc.value = '';
  createDialogVisible.value = true;
}

// 应用模板示例
function applyTemplateExample(type: string) {
  const example = templateExamples[type as keyof typeof templateExamples];
  if (example) {
    createForm.value.title_template = example.title;
    createForm.value.content_template = example.content;
    createForm.value.variables = { ...example.variables };
    message.success('已应用模板示例');
  }
}

// 添加变量
function addVariable() {
  if (!variableKey.value) {
    message.warning('请输入变量名');
    return;
  }
  if (!variableDesc.value) {
    message.warning('请输入变量描述');
    return;
  }
  if (createForm.value.variables[variableKey.value]) {
    message.warning('变量名已存在');
    return;
  }

  createForm.value.variables[variableKey.value] = variableDesc.value;
  variableKey.value = '';
  variableDesc.value = '';
  message.success('变量添加成功');
}

// 删除变量
function removeVariable(key: string) {
  delete createForm.value.variables[key];
  message.success('变量删除成功');
}

// 插入变量到模板
function insertVariable(key: string, field: 'content' | 'title') {
  const variable = `{${key}}`;
  if (field === 'title') {
    createForm.value.title_template += variable;
  } else {
    createForm.value.content_template += variable;
  }
}

async function handleCreateConfirm() {
  if (!canCreateTemplate) {
    message.warning('无权限保存通知模板');
    return;
  }
  if (!createForm.value.name) {
    message.error('请输入模板名称');
    return;
  }
  if (!createForm.value.type) {
    message.error('请输入通知类型');
    return;
  }
  if (!createForm.value.title_template) {
    message.error('请输入标题模板');
    return;
  }
  if (!createForm.value.content_template) {
    message.error('请输入内容模板');
    return;
  }

  try {
    loading.value = true;
    await createNotificationTemplateApi(createForm.value);
    message.success('创建成功');
    createDialogVisible.value = false;
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

function handleDelete(row: NotificationTemplate) {
  if (!canDeleteTemplate) {
    message.warning('无权限删除通知模板');
    return;
  }
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除通知模板"${row.name}"吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteNotificationTemplateApi(row.id);
        message.success('删除成功');
        gridApi.reload();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="['notifications_templates:add']"
          type="primary"
          @click="handleCreate"
        >
          新增模板
        </Button>
      </template>
    </Grid>

    <!-- 编辑模板对话框 -->
    <Modal
      v-model:open="editDialogVisible"
      title="编辑通知模板"
      width="800px"
      :confirm-loading="loading"
      @ok="handleEditConfirm"
    >
      <div class="p-4">
        <div class="mb-4">
          <label class="mb-2 block font-medium"> 模板名称 </label>
          <Input v-model:value="editForm.name" placeholder="请输入模板名称" />
        </div>

        <div class="mb-4">
          <label class="mb-2 block font-medium"> 通知类型 </label>
          <Tooltip
            :title="`${getTypeDisplay(editForm.type).group} / ${editForm.type}`"
          >
            <Tag :color="getTypeDisplay(editForm.type).color">
              {{ getTypeDisplay(editForm.type).label }}
            </Tag>
          </Tooltip>
        </div>

        <div class="mb-4">
          <label class="mb-2 block font-medium"> 可用变量 </label>
          <div class="flex flex-wrap gap-2">
            <Tag
              v-for="(desc, key) in editForm.variables"
              :key="key"
              color="blue"
            >
              &#123;{{ key }}&#125; - {{ desc }}
            </Tag>
          </div>
        </div>

        <div class="mb-4">
          <label class="mb-2 block font-medium">
            标题模板 <span class="text-red-500">*</span>
          </label>
          <Input
            v-model:value="editForm.title_template"
            placeholder="使用 {变量名} 格式引用变量"
          />
        </div>

        <div class="mb-4">
          <label class="mb-2 block font-medium">
            内容模板 <span class="text-red-500">*</span>
          </label>
          <Textarea
            v-model:value="editForm.content_template"
            :rows="4"
            placeholder="使用 {变量名} 格式引用变量"
          />
        </div>

        <div class="border-t pt-6">
          <h4 class="mb-4 text-sm font-semibold">通知渠道配置</h4>

          <div class="mb-4">
            <Checkbox v-model:checked="editForm.use_external">
              启用外部通知渠道
            </Checkbox>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              启用后将通过配置的外部渠道（邮箱、企业微信、Webhook）发送通知，同时保留系统内部通知
            </div>
          </div>

          <div v-if="editForm.use_external">
            <label class="mb-2 block font-medium"> 选择通知渠道 </label>
            <Select
              v-model:value="editForm.notification_channels"
              mode="multiple"
              placeholder="选择要使用的通知渠道（不选则使用所有启用的渠道）"
              class="w-full"
              allow-clear
            >
              <SelectOption
                v-for="config in notificationConfigs"
                :key="config.id"
                :value="config.id"
              >
                {{ config.name }} ({{ getConfigTypeName(config.config_type) }})
              </SelectOption>
            </Select>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              不选择则使用所有启用的通知渠道
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- 新增模板对话框 -->
    <Modal
      v-model:open="createDialogVisible"
      title="新增通知模板"
      width="800px"
      :confirm-loading="loading"
      @ok="handleCreateConfirm"
    >
      <Tabs default-active-key="1">
        <!-- 基本信息 -->
        <TabPane key="1" tab="基本信息">
          <div class="p-4">
            <div class="mb-4">
              <label class="mb-2 block font-medium">
                模板名称 <span class="text-red-500">*</span>
              </label>
              <Input
                v-model:value="createForm.name"
                placeholder="请输入模板名称，如：任务完成通知"
                size="large"
              />
            </div>

            <div class="mb-4">
              <label class="mb-2 block font-medium">
                通知类型 <span class="text-red-500">*</span>
              </label>
              <div class="mb-4">
                <Space wrap class="w-full">
                  <Tag
                    v-for="item in commonTypes"
                    :key="item.value"
                    :color="
                      createForm.type === item.value ? 'blue' : item.color
                    "
                    class="cursor-pointer px-3 py-1 text-sm"
                    @click="
                      createForm.type =
                        item.value === 'custom' ? '' : item.value;
                      item.value !== 'custom' &&
                        applyTemplateExample(item.value);
                    "
                  >
                    {{ item.label }}
                  </Tag>
                </Space>
              </div>
              <Input
                v-model:value="createForm.type"
                placeholder="请输入或选择通知类型标识，如：task_completed"
              />
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                提示：点击上方标签快速选择常用类型并应用示例模板
              </div>
            </div>
          </div>
        </TabPane>

        <!-- 模板内容 -->
        <TabPane key="2" tab="模板内容">
          <div class="p-4">
            <div class="mb-4">
              <label class="mb-2 block font-medium">
                标题模板 <span class="text-red-500">*</span>
              </label>
              <Input
                v-model:value="createForm.title_template"
                placeholder="使用 {变量名} 格式引用变量，如：任务 {task_name} 已完成"
                size="large"
              />
            </div>

            <div>
              <label class="mb-2 block font-medium">
                内容模板 <span class="text-red-500">*</span>
              </label>
              <Textarea
                v-model:value="createForm.content_template"
                :rows="8"
                placeholder="使用 {变量名} 格式引用变量，支持多行文本"
              />
            </div>

            <!-- 已添加的变量快捷插入 -->
            <div
              v-if="Object.keys(createForm.variables).length > 0"
              class="mt-3"
            >
              <Divider class="my-3">点击变量快速插入</Divider>
              <Space wrap>
                <Tooltip
                  v-for="(desc, key) in createForm.variables"
                  :key="key"
                  :title="`点击插入 {${key}}`"
                >
                  <Tag
                    color="blue"
                    class="cursor-pointer"
                    @click="insertVariable(key as string, 'content')"
                  >
                    &#123;{{ key }}&#125; - {{ desc }}
                  </Tag>
                </Tooltip>
              </Space>
            </div>
          </div>
        </TabPane>

        <!-- 变量管理 -->
        <TabPane key="3" tab="变量管理">
          <div class="p-4">
            <div class="mb-4">
              <Space class="w-full">
                <Input
                  v-model:value="variableKey"
                  placeholder="变量名（英文）"
                  class="w-48"
                  @press-enter="addVariable"
                />
                <Input
                  v-model:value="variableDesc"
                  placeholder="变量描述（中文）"
                  class="w-60"
                  @press-enter="addVariable"
                />
                <Button type="primary" @click="addVariable">添加</Button>
              </Space>
              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                提示：添加变量后可以在模板中使用 {变量名} 引用
              </div>
            </div>

            <Divider class="my-4">已添加的变量</Divider>

            <div v-if="Object.keys(createForm.variables).length > 0">
              <Space wrap>
                <Tag
                  v-for="(desc, key) in createForm.variables"
                  :key="key"
                  color="blue"
                  closable
                  class="mb-2 px-3 py-1"
                  @close="removeVariable(key as string)"
                >
                  <strong>&#123;{{ key }}&#125;</strong> - {{ desc }}
                </Tag>
              </Space>
            </div>
            <div
              v-else
              class="rounded bg-gray-50 py-10 text-center text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            >
              暂无变量，请添加变量以便在模板中使用
            </div>
          </div>
        </TabPane>

        <!-- 通知渠道 -->
        <TabPane key="4" tab="通知渠道">
          <div class="p-4">
            <div class="mb-4">
              <Checkbox v-model:checked="createForm.use_external">
                启用外部通知渠道
              </Checkbox>
              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                启用后将通过配置的外部渠道（邮箱、企业微信、Webhook）发送通知，同时保留系统内部通知
              </div>
            </div>

            <div v-if="createForm.use_external">
              <label class="mb-2 block font-medium"> 选择通知渠道 </label>
              <Select
                v-model:value="createForm.notification_channels"
                mode="multiple"
                placeholder="选择要使用的通知渠道"
                class="w-full"
                allow-clear
              >
                <SelectOption
                  v-for="config in notificationConfigs"
                  :key="config.id"
                  :value="config.id"
                >
                  {{ config.name }} ({{
                    getConfigTypeName(config.config_type)
                  }})
                </SelectOption>
              </Select>
              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                提示：不选择则使用所有启用的通知渠道
              </div>
            </div>
            <div
              v-else
              class="rounded bg-gray-50 py-10 text-center text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            >
              未启用外部通知渠道，仅使用系统内部通知
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  </Page>
</template>

<style lang="scss">
.notification-type-tag {
  max-width: 128px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
