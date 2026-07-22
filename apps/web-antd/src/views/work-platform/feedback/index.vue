<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FeedbackApi } from '#/api/operation/feedback';

import { h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { SendOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMyFeedbackApi, submitFeedbackApi } from '#/api/operation/feedback';

defineOptions({ name: 'WorkPlatformFeedback' });

const router = useRouter();
const submitting = ref(false);
const submitModalVisible = ref(false);
const form = ref({
  category: 'system',
  content: '',
  priority: 'low',
  title: '',
});

const categoryOptions = [
  { label: '系统功能', value: 'system' },
  { label: '数据准确性', value: 'data' },
  { label: '流程体验', value: 'workflow' },
  { label: '权限账号', value: 'access' },
  { label: '其他', value: 'other' },
];

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
];

const statusText: Record<string, string> = {
  closed: '已关闭',
  in_progress: '处理中',
  open: '待处理',
  pending: '挂起',
  resolved: '已解决',
};

const statusColor: Record<string, string> = {
  closed: 'default',
  in_progress: 'processing',
  open: 'blue',
  pending: 'warning',
  resolved: 'success',
};

function resetForm() {
  form.value = {
    category: 'system',
    content: '',
    priority: 'low',
    title: '',
  };
}

async function handleSubmit() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    message.error('请填写标题和内容');
    return;
  }
  submitting.value = true;
  try {
    const created: any = await submitFeedbackApi({
      category: form.value.category,
      content: form.value.content.trim(),
      priority: form.value.priority,
      title: form.value.title.trim(),
    });
    message.success('反馈已提交并进入工单流程');
    resetForm();
    submitModalVisible.value = false;
    gridApi.query();
    if (created?.id) {
      router.push({
        path: '/work-platform/tickets',
        query: { ticketId: created.id },
      });
    }
  } catch (error: any) {
    message.error(error.message || '提交反馈失败');
  } finally {
    submitting.value = false;
  }
}

function useColumns(): VxeTableGridOptions<FeedbackApi.Feedback>['columns'] {
  return [
    {
      align: 'center',
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 70,
    },
    {
      field: 'title',
      minWidth: 220,
      showOverflow: 'tooltip',
      title: '反馈标题',
    },
    {
      align: 'center',
      field: 'status',
      slots: {
        default: ({ row }) =>
          h(
            Tag,
            { color: statusColor[row.status] || 'default' },
            () => statusText[row.status] || row.status,
          ),
      },
      title: '状态',
      width: 110,
    },
    {
      align: 'center',
      field: 'created_at',
      title: '提交时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 100,
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const result = await getMyFeedbackApi({
            page: page.currentPage,
            page_size: page.pageSize,
          });
          return {
            items: result.items || [],
            total: result.total || 0,
          };
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
      zoom: true,
    },
  } as VxeTableGridOptions<FeedbackApi.Feedback>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button
          v-access:code="['wp_feedback:create']"
          type="primary"
          @click="submitModalVisible = true"
        >
          <SendOutlined />
          提交反馈
        </Button>
      </template>
      <template #action="{ row }">
        <Button
          size="small"
          type="link"
          @click="
            router.push({
              path: '/work-platform/tickets',
              query: { ticketId: row.ticket_id || row.id },
            })
          "
        >
          详情
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="submitModalVisible"
      :confirm-loading="submitting"
      title="提交反馈"
      width="720px"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <Form.Item label="标题" required>
          <Input
            v-model:value="form.title"
            :maxlength="100"
            placeholder="请输入反馈标题"
            show-count
          />
        </Form.Item>
        <Form.Item label="分类">
          <Select v-model:value="form.category" :options="categoryOptions" />
        </Form.Item>
        <Form.Item label="优先级">
          <Select v-model:value="form.priority" :options="priorityOptions" />
        </Form.Item>
        <Form.Item label="内容" required>
          <Textarea
            v-model:value="form.content"
            :maxlength="1000"
            :rows="8"
            placeholder="请描述问题、建议或期望结果"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
