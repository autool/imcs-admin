<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SmsGatewayApi } from '#/api/system/sms-gateway';

import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Input as AInput, Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSmsGateway,
  getSmsGatewayList,
  testSmsGateway,
} from '#/api/system/sms-gateway';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'SmsGatewayList' });

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});
const { hasAccessByCodes } = useAccess();
const canAddGateway = hasAccessByCodes(['sms_gateway:add']);
const canDeleteGateway = hasAccessByCodes(['sms_gateway:delete']);
const canEditGateway = hasAccessByCodes(['sms_gateway:edit']);
const canTestGateway = hasAccessByCodes(['sms_gateway:test']);

// 测试短信弹窗
const testModalOpen = ref(false);
const testLoading = ref(false);
const testPhone = ref('');
const testConfigId = ref('');

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, onTest),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSmsGatewayList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SmsGatewayApi.SmsGateway>,
});

function onActionClick(e: OnActionClickParams<SmsGatewayApi.SmsGateway>) {
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

function onEdit(row: SmsGatewayApi.SmsGateway) {
  if (!canEditGateway) {
    message.warning('无权限编辑短信网关');
    return;
  }
  formDrawerApi.setData(row).open();
}

function onDelete(row: SmsGatewayApi.SmsGateway) {
  if (!canDeleteGateway) {
    message.warning('无权限删除短信网关');
    return;
  }
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteSmsGateway(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      gridApi.query();
    })
    .catch(() => {
      hideLoading();
      message.error('删除失败，请稍后重试');
    });
}

function onTest(row: SmsGatewayApi.SmsGateway) {
  if (!canTestGateway) {
    message.warning('无权限测试短信网关');
    return;
  }
  testConfigId.value = row.id;
  testPhone.value = '';
  testModalOpen.value = true;
}

async function handleTestSend() {
  if (!canTestGateway) {
    message.warning('无权限测试短信网关');
    return;
  }
  if (!testPhone.value) {
    message.error('请输入手机号');
    return;
  }
  testLoading.value = true;
  try {
    await testSmsGateway(testConfigId.value, testPhone.value);
    message.success('测试短信已发送（验证码: 123456）');
    testModalOpen.value = false;
  } catch (error: any) {
    message.error(error?.message || '发送失败');
  } finally {
    testLoading.value = false;
  }
}

function onCreate() {
  if (!canAddGateway) {
    message.warning('无权限新增短信网关');
    return;
  }
  formDrawerApi.setData({}).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="gridApi.query()" />
    <Grid table-title="短信网关配置">
      <template #toolbar-tools>
        <Button
          v-access:code="['sms_gateway:add']"
          type="primary"
          @click="onCreate"
        >
          <Plus class="size-5" />
          新增配置
        </Button>
      </template>
    </Grid>

    <!-- 测试短信弹窗 -->
    <Modal
      v-model:open="testModalOpen"
      title="测试短信发送"
      :confirm-loading="testLoading"
      @ok="handleTestSend"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          将发送测试验证码 123456 到以下手机号
        </p>
        <AInput
          v-model:value="testPhone"
          placeholder="请输入手机号"
          allow-clear
        />
      </div>
    </Modal>
  </Page>
</template>
