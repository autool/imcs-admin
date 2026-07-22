<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationConfigApi } from '#/api/system/notification-configs';

import { h, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Button,
  Input,
  message,
  Modal,
  Popconfirm,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotificationConfigApi,
  getNotificationConfigsApi,
  testNotificationConfigApi,
} from '#/api/system/notification-configs';

import ConfigFormDrawer from './components/ConfigFormDrawer.vue';

const drawerVisible = ref(false);
const { hasAccessByCodes } = useAccess();
const editingConfig = ref<any>(null);
const isCreating = ref(false);

// 测试相关
const testModalVisible = ref(false);
const testingConfig = ref<any>(null);
const testContent = ref('这是一条来自IMCS系统的测试通知');
const testEmail = ref('');
const testing = ref(false);
const canCreateConfig = hasAccessByCodes(['system_notification_configs:add']);
const canEditConfig = hasAccessByCodes(['system_notification_configs:edit']);
const canDeleteConfig = hasAccessByCodes([
  'system_notification_configs:delete',
]);
const canTestConfig = hasAccessByCodes(['system_notification_configs:test']);

// 新建配置
function handleCreate() {
  if (!canCreateConfig) {
    message.warning('无权限新建通知配置');
    return;
  }
  isCreating.value = true;
  editingConfig.value = null;
  drawerVisible.value = true;
}

// 编辑配置
function handleEdit(config: any) {
  if (!canEditConfig) {
    message.warning('无权限编辑通知配置');
    return;
  }
  isCreating.value = false;
  editingConfig.value = config;
  drawerVisible.value = true;
}

// 测试配置
function handleTest(config: any) {
  if (!canTestConfig) {
    message.warning('无权限测试通知配置');
    return;
  }
  testingConfig.value = config;
  testContent.value = `这是一条来自IMCS系统的测试通知\n\n配置名称: ${config.name}\n配置类型: ${getTypeName(config.config_type)}\n测试时间: ${new Date().toLocaleString()}`;
  testEmail.value = ''; // 清空测试邮箱
  testModalVisible.value = true;
}

// 执行测试
async function executeTest() {
  if (!testingConfig.value) return;
  if (!canTestConfig) {
    message.warning('无权限测试通知配置');
    return;
  }

  // 如果是邮箱类型，验证测试邮箱地址
  if (testingConfig.value.config_type === 'email') {
    if (!testEmail.value) {
      message.error('请输入测试邮箱地址');
      return;
    }
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
    if (!emailRegex.test(testEmail.value)) {
      message.error('请输入有效的邮箱地址');
      return;
    }
  }

  try {
    testing.value = true;
    const response = await testNotificationConfigApi({
      config_id: testingConfig.value.id,
      test_content: testContent.value,
      test_email: testEmail.value || undefined,
    });

    if (response.success) {
      message.success(response.detail || '测试消息已发送，请检查是否收到');
      testModalVisible.value = false;
    } else {
      message.error(response.detail || '测试失败，请检查配置');
    }
  } catch (error: any) {
    message.error(error.message || '测试失败');
  } finally {
    testing.value = false;
  }
}

// 删除配置
async function handleDelete(config: any) {
  if (!canDeleteConfig) {
    message.warning('无权限删除通知配置');
    return;
  }
  try {
    await deleteNotificationConfigApi(config.id);
    message.success('删除成功');
    gridApi.query();
  } catch (error: any) {
    message.error(error.message || '删除失败');
  }
}

// 表单成功回调
function handleFormSuccess() {
  drawerVisible.value = false;
  gridApi.query();
}

// 获取类型名称
function getTypeName(type: string): string {
  const names: Record<string, string> = {
    email: '邮箱',
    wecom: '企业微信',
    webhook: 'Webhook',
  };
  return names[type] || type;
}

// 获取类型颜色
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    email: 'blue',
    wecom: 'green',
    webhook: 'orange',
  };
  return colors[type] || 'default';
}

function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '邮箱', value: 'email' },
          { label: '企业微信', value: 'wecom' },
          { label: 'Webhook', value: 'webhook' },
        ],
        placeholder: '请选择配置类型',
      },
      fieldName: 'config_type',
      label: '配置类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: true },
          { label: '停用', value: false },
        ],
        placeholder: '请选择启用状态',
      },
      fieldName: 'is_enabled',
      label: '启用状态',
    },
  ];
}

function useColumns(): VxeTableGridOptions<NotificationConfigApi.NotificationConfig>['columns'] {
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
      title: '配置名称',
    },
    {
      align: 'center',
      field: 'config_type',
      slots: {
        default: ({ row }) =>
          h(Tag, { color: getTypeColor(row.config_type) }, () =>
            getTypeName(row.config_type),
          ),
      },
      title: '配置类型',
      width: 120,
    },
    {
      field: 'description',
      minWidth: 220,
      showOverflow: 'tooltip',
      title: '描述',
    },
    {
      align: 'center',
      field: 'is_enabled',
      slots: {
        default: ({ row }) =>
          h(Tag, { color: row.is_enabled ? 'success' : 'default' }, () =>
            row.is_enabled ? '启用' : '停用',
          ),
      },
      title: '启用状态',
      width: 100,
    },
    {
      align: 'center',
      field: 'is_default',
      slots: {
        default: ({ row }) =>
          row.is_default
            ? h(Tag, { color: 'success' }, () => '默认')
            : h('span', '-'),
      },
      title: '默认配置',
      width: 100,
    },
    {
      align: 'center',
      field: 'create_time',
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '',
      title: '创建时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ];
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
          return await getNotificationConfigsApi({
            config_type: formValues.config_type,
            is_enabled: formValues.is_enabled,
            limit: page.pageSize,
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
  } as VxeTableGridOptions<NotificationConfigApi.NotificationConfig>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="['system_notification_configs:add']"
          type="primary"
          @click="handleCreate"
        >
          新建配置
        </Button>
      </template>
      <template #action="{ row }">
        <Button
          v-access:code="['system_notification_configs:test']"
          size="small"
          type="link"
          @click="handleTest(row)"
        >
          测试
        </Button>
        <Button
          v-access:code="['system_notification_configs:edit']"
          size="small"
          type="link"
          @click="handleEdit(row)"
        >
          编辑
        </Button>
        <Popconfirm title="确定要删除这个配置吗？" @confirm="handleDelete(row)">
          <Button
            v-access:code="['system_notification_configs:delete']"
            danger
            size="small"
            type="link"
          >
            删除
          </Button>
        </Popconfirm>
      </template>
    </Grid>

    <!-- 配置表单抽屉 -->
    <ConfigFormDrawer
      v-model:visible="drawerVisible"
      :config="editingConfig"
      :is-creating="isCreating"
      :can-manage="isCreating ? canCreateConfig : canEditConfig"
      @success="handleFormSuccess"
    />

    <!-- 测试对话框 -->
    <Modal
      v-model:open="testModalVisible"
      title="测试通知配置"
      :confirm-loading="testing"
      @ok="executeTest"
    >
      <div class="test-modal-content">
        <div class="mb-4">
          <div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
            配置信息
          </div>
          <div class="space-y-1 rounded bg-gray-50 p-3 dark:bg-gray-800">
            <div><strong>配置名称:</strong> {{ testingConfig?.name }}</div>
            <div>
              <strong>配置类型:</strong>
              {{ testingConfig ? getTypeName(testingConfig.config_type) : '' }}
            </div>
          </div>
        </div>

        <!-- 邮箱类型需要输入测试邮箱地址 -->
        <div v-if="testingConfig?.config_type === 'email'" class="mb-4">
          <div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
            测试邮箱地址 <span class="text-red-500">*</span>
          </div>
          <Input
            v-model:value="testEmail"
            placeholder="请输入接收测试邮件的邮箱地址"
            type="email"
          />
        </div>

        <div>
          <div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
            测试内容
          </div>
          <Textarea
            v-model:value="testContent"
            :rows="6"
            placeholder="请输入测试消息内容"
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.test-modal-content {
  padding: 16px 0;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.text-sm {
  font-size: 14px;
}

.text-gray-600 {
  color: var(--ant-color-text-secondary);
}
</style>
