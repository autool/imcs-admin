<script lang="ts" setup>
import type { AIModel } from './data';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AIModelApi } from '#/api/system/ai';

import { computed } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAIModelApi,
  getAIModelsApi,
  updateAIModelApi,
} from '#/api/system/ai';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import TestDialog from './modules/test-dialog.vue';

defineOptions({ name: 'SystemAIModelList' });

const { hasAccessByCodes } = useAccess();
const canConfigAi = computed(() => hasAccessByCodes(['system_ai:config']));
const canTestAi = computed(() => hasAccessByCodes(['system_ai:test']));

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [TestModal, testModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: TestDialog,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, onStatusChange, undefined, {
      canConfig: canConfigAi.value,
      canTest: canTestAi.value,
    }),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          const list = await getAIModelsApi();

          // 确保布尔值正确转换
          const normalizedList = (list || []).map((item: any) => ({
            ...item,
            enabled:
              item.enabled === true ||
              item.enabled === 1 ||
              item.enabled === '1',
            is_default:
              item.is_default === true ||
              item.is_default === 1 ||
              item.is_default === '1',
          }));

          // 前端过滤
          let filteredList = normalizedList;
          if (formValues.name) {
            filteredList = filteredList.filter((item: AIModelApi.AIModel) =>
              item.name.includes(formValues.name),
            );
          }
          if (formValues.provider) {
            filteredList = filteredList.filter(
              (item: AIModelApi.AIModel) =>
                item.provider === formValues.provider,
            );
          }
          if (formValues.enabled !== undefined && formValues.enabled !== null) {
            filteredList = filteredList.filter(
              (item: AIModelApi.AIModel) => item.enabled === formValues.enabled,
            );
          }

          return {
            list: filteredList,
            total: filteredList.length,
          };
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
  } as VxeTableGridOptions<AIModel>,
});

function onActionClick(e: OnActionClickParams<AIModel>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
    case 'test': {
      onTest(e.row);
      break;
    }
  }
}

function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}

async function onStatusChange(newStatus: boolean, row: AIModel) {
  if (!canConfigAi.value) {
    message.warning('无权限配置 AI 模型');
    return false;
  }
  const currentStatusText = row.enabled ? '启用' : '禁用';
  const newStatusText = newStatus ? '启用' : '禁用';
  if (!row.id) {
    message.error('缺少 AI 模型标识');
    return false;
  }
  try {
    await confirm(
      `当前状态：${currentStatusText}，确定要切换为【${newStatusText}】吗？`,
      '切换状态',
    );
    await updateAIModelApi(row.id, { enabled: newStatus });
    message.success('状态更新成功');
    return true;
  } catch {
    return false;
  }
}

function onEdit(row: AIModel) {
  if (!canConfigAi.value) {
    message.warning('无权限编辑 AI 模型');
    return;
  }
  formDrawerApi.setData(row).open();
}

function onDelete(row: AIModel) {
  if (!canConfigAi.value) {
    message.warning('无权限删除 AI 模型');
    return;
  }
  if (!row.id) {
    message.error('缺少 AI 模型标识');
    return;
  }
  const modelId = row.id;
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除模型"${row.name}"吗？此操作不可恢复。`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteAIModelApi(modelId);
        message.success(`${row.name} 删除成功`);
        onRefresh();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}

function onTest(row: AIModel) {
  if (!canTestAi.value) {
    message.warning('无权限测试 AI 模型');
    return;
  }
  testModalApi.setData(row).open();
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  if (!canConfigAi.value) {
    message.warning('无权限创建 AI 模型');
    return;
  }
  formDrawerApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <TestModal />
    <Grid table-title="AI模型管理">
      <template #toolbar-tools>
        <Button v-if="canConfigAi" type="primary" @click="onCreate">
          <Plus class="size-5" />
          创建模型
        </Button>
      </template>
    </Grid>
  </Page>
</template>
