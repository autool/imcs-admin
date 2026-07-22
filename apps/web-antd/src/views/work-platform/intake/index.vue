<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Textarea,
} from 'ant-design-vue';

import { createTicketApi } from '#/api/operation/tickets';
import { loadSystemUserOptions } from '#/utils/system-user-options';

defineOptions({ name: 'WorkPlatformIntake' });

const router = useRouter();
const loading = ref(false);
const dueDate = ref<any>();
const userOptions = ref<any[]>([]);
const form = ref({
  assignee_id: '',
  category: '',
  department: '',
  description: '',
  priority: 'medium',
  source_type: 'manual',
  title: '',
  type: 'incident',
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

const sourceOptions = [
  { label: '手动', value: 'manual' },
  { label: '反馈', value: 'feedback' },
];

const typeOptions = [
  { label: '事件', value: 'incident' },
  { label: '请求', value: 'request' },
  { label: '问题', value: 'problem' },
  { label: '变更', value: 'change' },
];

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
];

const categoryOptions = [
  { label: '系统功能', value: 'system' },
  { label: '资产告警', value: 'asset_alarm' },
  { label: '自动化任务', value: 'automation' },
  { label: '网络资源', value: 'network' },
  { label: '权限账号', value: 'access' },
  { label: '其他', value: 'other' },
];

const scenePresets = [
  {
    key: 'incident',
    title: '故障事件',
    desc: '服务异常、资产告警、节点离线',
    value: {
      category: 'asset_alarm',
      priority: 'high',
      source_type: 'manual',
      type: 'incident',
    },
  },
  {
    key: 'task',
    title: '任务处理',
    desc: '采集失败、自动化结果异常',
    value: {
      category: 'automation',
      priority: 'medium',
      source_type: 'manual',
      type: 'problem',
    },
  },
  {
    key: 'request',
    title: '工作请求',
    desc: '权限、资源、配置类需求',
    value: {
      category: 'access',
      priority: 'medium',
      source_type: 'manual',
      type: 'request',
    },
  },
  {
    key: 'feedback',
    title: '用户反馈',
    desc: '体验问题、功能建议',
    value: {
      category: 'system',
      priority: 'low',
      source_type: 'feedback',
      type: 'request',
    },
  },
];

function applyPreset(preset: (typeof scenePresets)[number]) {
  form.value = {
    ...form.value,
    ...preset.value,
  };
}

function resetForm() {
  dueDate.value = undefined;
  form.value = {
    assignee_id: '',
    category: '',
    department: '',
    description: '',
    priority: 'medium',
    source_type: 'manual',
    title: '',
    type: 'incident',
  };
}

async function handleSubmit() {
  if (!form.value.title.trim() || !form.value.description.trim()) {
    message.error('请填写标题和描述');
    return;
  }
  loading.value = true;
  try {
    const created: any = await createTicketApi({
      assignee_id: form.value.assignee_id.trim() || undefined,
      category: form.value.category || undefined,
      department: form.value.department.trim() || undefined,
      description: form.value.description.trim(),
      due_date: dueDate.value
        ? dueDate.value.format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      priority: form.value.priority,
      source_data: {
        intake_channel: form.value.source_type,
      },
      source_type: form.value.source_type,
      title: form.value.title.trim(),
      type: form.value.type,
    });
    message.success('工单已创建');
    resetForm();
    router.push({
      path: '/work-platform/tickets',
      query: created?.id ? { ticketId: created.id } : {},
    });
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    loading.value = false;
  }
}

void ensureUserOptions();
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-lg font-semibold">工单入口</h2>
          <div class="mt-1 text-sm text-muted-foreground">
            手动工作、用户反馈和临时事件统一进入工单流程
          </div>
        </div>
        <Button @click="router.push('/work-platform/tickets')">
          <ArrowLeftOutlined />
          工单处理
        </Button>
      </div>

      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]"
      >
        <div class="rounded-lg border border-border bg-background p-5">
          <Form layout="vertical">
            <Form.Item label="快速场景">
              <div class="grid grid-cols-1 gap-2 md:grid-cols-4">
                <button
                  v-for="preset in scenePresets"
                  :key="preset.key"
                  class="rounded-md border border-border bg-background p-3 text-left transition hover:border-primary hover:bg-muted/40"
                  type="button"
                  @click="applyPreset(preset)"
                >
                  <div class="text-sm font-medium">{{ preset.title }}</div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ preset.desc }}
                  </div>
                </button>
              </div>
            </Form.Item>

            <div class="grid grid-cols-1 gap-x-4 lg:grid-cols-3">
              <Form.Item class="lg:col-span-3" label="标题" required>
                <Input
                  v-model:value="form.title"
                  :maxlength="100"
                  placeholder="请输入工单标题"
                  show-count
                />
              </Form.Item>

              <Form.Item label="来源">
                <Radio.Group
                  v-model:value="form.source_type"
                  option-type="button"
                  button-style="solid"
                >
                  <Radio.Button
                    v-for="item in sourceOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="类型">
                <Select v-model:value="form.type" :options="typeOptions" />
              </Form.Item>

              <Form.Item label="优先级">
                <Radio.Group v-model:value="form.priority" option-type="button">
                  <Radio.Button
                    v-for="item in priorityOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="分类">
                <Select
                  v-model:value="form.category"
                  :options="categoryOptions"
                  allow-clear
                  placeholder="选择分类"
                />
              </Form.Item>

              <Form.Item label="部门">
                <Input v-model:value="form.department" placeholder="可留空" />
              </Form.Item>

              <Form.Item label="处理人">
                <Select
                  v-model:value="form.assignee_id"
                  :allow-clear="true"
                  :options="userOptions"
                  :show-search="true"
                  placeholder="不填则进入工单池"
                />
              </Form.Item>

              <Form.Item label="截止时间">
                <DatePicker
                  v-model:value="dueDate"
                  class="w-full"
                  format="YYYY-MM-DD HH:mm:ss"
                  show-time
                />
              </Form.Item>

              <Form.Item class="lg:col-span-3" label="描述" required>
                <Textarea
                  v-model:value="form.description"
                  :maxlength="4000"
                  :rows="8"
                  placeholder="请输入现象、影响范围、期望结果或处置背景"
                  show-count
                />
              </Form.Item>
            </div>

            <div class="flex justify-end border-t border-border pt-4">
              <Space>
                <Button @click="resetForm">重置</Button>
                <Button
                  v-access:code="['wp_intake:create']"
                  :loading="loading"
                  type="primary"
                  @click="handleSubmit"
                >
                  <SaveOutlined />
                  创建工单
                </Button>
              </Space>
            </div>
          </Form>
        </div>

        <div class="flex flex-col gap-3">
          <div class="rounded-lg border border-border bg-background p-4">
            <div class="text-sm font-medium">自动入口</div>
            <div class="mt-3 space-y-2 text-sm text-muted-foreground">
              <div>告警由告警管理转入</div>
              <div>任务失败由执行记录转入</div>
              <div>节点超时由工作中心扫描转入</div>
            </div>
          </div>
          <div class="rounded-lg border border-border bg-background p-4">
            <div class="text-sm font-medium">创建后</div>
            <div class="mt-3 space-y-2 text-sm text-muted-foreground">
              <div>来源匹配流程模板</div>
              <div>处理人为空进入工单池</div>
              <div>完成节点后自动推进</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
