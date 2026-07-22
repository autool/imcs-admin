<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  Select,
  Textarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWorkTaskApi,
  deleteWorkTaskApi,
  getWorkTaskListApi,
  updateWorkTaskApi,
} from '#/api/tasks/work';
import { loadSystemUserOptions } from '#/utils/system-user-options';

import { useColumns, useFormSchema } from './data';

defineOptions({
  name: 'WorkTasks',
});

const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const loading = ref(false);
const userOptions = ref<any[]>([]);
const createForm = ref({
  title: '',
  description: '',
  task_type: '',
  priority: 0,
  assigned_user_id: undefined as string | undefined,
  due_date: null as any,
});
const editForm = ref({
  id: 0,
  title: '',
  description: '',
  task_type: '',
  priority: 0,
  status: '',
  assigned_user_id: undefined as string | undefined,
  due_date: null as any,
});

const priorityOptions = [
  { label: '低', value: 0 },
  { label: '中', value: 1 },
  { label: '高', value: 2 },
];

const statusOptions = [
  { label: '待办', value: 'pending' },
  { label: '已办', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

async function ensureUserOptions() {
  if (userOptions.value.length > 0) {
    return;
  }
  try {
    const { options } = await loadSystemUserOptions({
      include_disabled: true,
    });
    userOptions.value = options;
  } catch (error) {
    console.error('加载用户列表失败:', error);
    message.error('加载用户列表失败');
  }
}

function onActionClick(e: OnActionClickParams<any>) {
  switch (e.code) {
    case 'complete': {
      handleComplete(e.row);
      break;
    }
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      handleEdit(e.row);
      break;
    }
  }
}

function onDelete(row: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除任务"${row.title}"吗？`,
    async onOk() {
      try {
        await deleteWorkTaskApi(row.id);
        message.success('删除成功');
        gridApi.reload();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}

// 打开创建对话框
async function handleCreate() {
  await ensureUserOptions();
  createForm.value = {
    title: '',
    description: '',
    task_type: '',
    priority: 0,
    assigned_user_id: undefined,
    due_date: null,
  };
  createDialogVisible.value = true;
}

// 确认创建
async function handleCreateConfirm() {
  if (!createForm.value.title) {
    message.error('请输入任务标题');
    return;
  }

  try {
    loading.value = true;
    const data: any = {
      title: createForm.value.title,
      description: createForm.value.description,
      task_type: createForm.value.task_type,
      priority: createForm.value.priority,
      assigned_user_id: createForm.value.assigned_user_id,
    };

    if (createForm.value.due_date) {
      data.due_date = createForm.value.due_date.format('YYYY-MM-DD HH:mm:ss');
    }

    await createWorkTaskApi(data);
    message.success('创建成功');
    createDialogVisible.value = false;
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

// 打开编辑对话框
async function handleEdit(row: any) {
  await ensureUserOptions();
  editForm.value = {
    id: row.id,
    title: row.title,
    description: row.description || '',
    task_type: row.task_type || '',
    priority: row.priority,
    status: row.status,
    assigned_user_id: row.assigned_user_id || undefined,
    due_date: row.due_date ? dayjs(row.due_date) : null,
  };
  editDialogVisible.value = true;
}

// 确认编辑
async function handleEditConfirm() {
  if (!editForm.value.title) {
    message.error('请输入任务标题');
    return;
  }

  try {
    loading.value = true;
    const data: any = {
      title: editForm.value.title,
      description: editForm.value.description,
      task_type: editForm.value.task_type,
      priority: editForm.value.priority,
      status: editForm.value.status,
      assigned_user_id: editForm.value.assigned_user_id,
    };

    if (editForm.value.due_date) {
      data.due_date = editForm.value.due_date.format('YYYY-MM-DD HH:mm:ss');
    }

    await updateWorkTaskApi(editForm.value.id, data);
    message.success('更新成功');
    editDialogVisible.value = false;
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '更新失败');
  } finally {
    loading.value = false;
  }
}

// 完成任务
async function handleComplete(row: any) {
  try {
    await updateWorkTaskApi(row.id, { status: 'completed' });
    message.success('任务已完成');
    gridApi.reload();
  } catch (error: any) {
    message.error(error.message || '操作失败');
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
          if (formValues.priority !== undefined && formValues.priority !== null)
            params.priority = formValues.priority;
          if (formValues.search) params.search = formValues.search;

          return await getWorkTaskListApi(params);
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
        <Button
          v-access:code="['tasks_work:add']"
          type="primary"
          @click="handleCreate"
        >
          新建任务
        </Button>
      </template>
    </Grid>

    <!-- 创建任务对话框 -->
    <Modal
      v-model:open="createDialogVisible"
      title="新建任务"
      :confirm-loading="loading"
      @ok="handleCreateConfirm"
    >
      <div style="padding: 16px 0">
        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            任务标题 <span style="color: #ff4d4f">*</span>
          </label>
          <Input
            v-model:value="createForm.title"
            placeholder="请输入任务标题"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            任务描述
          </label>
          <Textarea
            v-model:value="createForm.description"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            任务类型
          </label>
          <Input
            v-model:value="createForm.task_type"
            placeholder="请输入任务类型"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            优先级
          </label>
          <Select
            v-model:value="createForm.priority"
            :options="priorityOptions"
            style="width: 100%"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            分配给
          </label>
          <Select
            v-model:value="createForm.assigned_user_id"
            :allow-clear="true"
            :options="userOptions"
            :show-search="true"
            placeholder="请选择负责人"
            style="width: 100%"
          />
        </div>

        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            截止日期
          </label>
          <DatePicker
            v-model:value="createForm.due_date"
            :show-time="true"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </div>
      </div>
    </Modal>

    <!-- 编辑任务对话框 -->
    <Modal
      v-model:open="editDialogVisible"
      title="编辑任务"
      :confirm-loading="loading"
      @ok="handleEditConfirm"
    >
      <div style="padding: 16px 0">
        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            任务标题 <span style="color: #ff4d4f">*</span>
          </label>
          <Input v-model:value="editForm.title" placeholder="请输入任务标题" />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            任务描述
          </label>
          <Textarea
            v-model:value="editForm.description"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            任务类型
          </label>
          <Input
            v-model:value="editForm.task_type"
            placeholder="请输入任务类型"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            优先级
          </label>
          <Select
            v-model:value="editForm.priority"
            :options="priorityOptions"
            style="width: 100%"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            状态
          </label>
          <Select
            v-model:value="editForm.status"
            :options="statusOptions"
            style="width: 100%"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            分配给
          </label>
          <Select
            v-model:value="editForm.assigned_user_id"
            :allow-clear="true"
            :options="userOptions"
            :show-search="true"
            placeholder="请选择负责人"
            style="width: 100%"
          />
        </div>

        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500">
            截止日期
          </label>
          <DatePicker
            v-model:value="editForm.due_date"
            :show-time="true"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>
