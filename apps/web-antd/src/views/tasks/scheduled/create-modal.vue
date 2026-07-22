<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { ScheduledTasksApi } from '#/api/tasks/scheduled';

import { computed, ref, watch } from 'vue';

import {
  Form,
  Input,
  message,
  Modal,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

import { getNodesApi } from '#/api/system/nodes';
import { createScheduledTaskApi, getTaskTypesApi } from '#/api/tasks/scheduled';

import { parseCronExpression } from '../scheduled/data';

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
  'update:visible': [value: boolean];
}>();

const PLATFORM_SCHEDULER_NODE_ID = '__platform_scheduler__';

interface Props {
  visible: boolean;
}

const formRef = ref();
const saving = ref(false);
const taskTypesLoading = ref(false);
const allTaskTypes = ref<ScheduledTasksApi.TaskType[]>([]);
const nodes = ref<
  Array<{ id: string; name: string; node_type?: string; status?: string }>
>([]);

const formData = ref({
  task_name: '',
  task_type: '',
  node_id: '',
  cron: '',
  description: '',
  enabled: true,
  device_ids: [] as string[],
  alarm_ids: [] as string[],
  task_name_param: '',
});

const rules: Record<string, Rule[]> = {
  node_id: [
    {
      required: true,
      message: '请先选择执行节点',
      trigger: 'change',
      type: 'string',
    },
  ],
  task_name: [
    {
      required: true,
      message: '请输入任务名称',
      trigger: 'blur',
      type: 'string',
    },
  ],
  task_type: [
    {
      required: true,
      message: '请选择任务类型',
      trigger: 'change',
      type: 'string',
    },
  ],
  cron: [
    {
      required: true,
      message: '请输入 Cron 表达式',
      trigger: 'blur',
      type: 'string',
    },
  ],
};

const cronDescription = computed(() =>
  parseCronExpression(formData.value.cron),
);

const selectedTaskType = computed(() =>
  allTaskTypes.value.find((t) => t.value === formData.value.task_type),
);

const hasDeviceIds = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema && 'device_ids' in schema;
});

const hasAlarmIds = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema && 'alarm_ids' in schema;
});

const deviceIdsRequired = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema?.device_ids?.required === true;
});

const alarmIdsRequired = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema?.alarm_ids?.required === true;
});

const hasTaskNameParam = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema && 'task_name' in schema;
});

const nodeOptions = computed(() => [
  {
    id: PLATFORM_SCHEDULER_NODE_ID,
    name: '平台调度器（admin-api / Celery）',
    node_type: 'admin',
    status: 'active',
  },
  ...nodes.value,
]);

const selectedNode = computed(() =>
  nodeOptions.value.find((node) => node.id === formData.value.node_id),
);

function resetForm() {
  formData.value = {
    task_name: '',
    task_type: '',
    node_id: '',
    cron: '',
    description: '',
    enabled: true,
    device_ids: [],
    alarm_ids: [],
    task_name_param: '',
  };
  allTaskTypes.value = [];
}

async function loadOptions() {
  try {
    const result = await getNodesApi();
    nodes.value = result;
  } catch {
    // 忽略
  }
}

const availableTaskTypes = computed(() => allTaskTypes.value);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm();
      loadOptions();
    }
  },
);

async function loadTaskTypesByNode(nodeId: string) {
  allTaskTypes.value = [];
  if (!nodeId) return;
  taskTypesLoading.value = true;
  try {
    allTaskTypes.value = await getTaskTypesApi({ node_id: nodeId });
  } catch {
    allTaskTypes.value = [];
  } finally {
    taskTypesLoading.value = false;
  }
}

function onNodeChange(value: unknown) {
  const nodeId = value ? String(value) : '';
  formData.value.task_type = '';
  formData.value.cron = '';
  formData.value.device_ids = [];
  formData.value.alarm_ids = [];
  formData.value.task_name_param = '';
  loadTaskTypesByNode(nodeId);
}

function onTaskTypeChange(value: unknown) {
  const taskType = value ? String(value) : '';
  const found = allTaskTypes.value.find((t) => t.value === taskType);
  if (found) {
    formData.value.cron = found.default_cron || '0 16 * * *';
  }
}

function handleClose() {
  emit('update:visible', false);
}

async function handleSave() {
  try {
    await formRef.value.validateFields();
    saving.value = true;

    const scheduleRule: Record<string, any> = { cron: formData.value.cron };

    if (hasDeviceIds.value && formData.value.device_ids.length > 0) {
      scheduleRule.device_ids = formData.value.device_ids;
    }
    if (hasAlarmIds.value && formData.value.alarm_ids.length > 0) {
      scheduleRule.alarm_ids = formData.value.alarm_ids;
    }
    if (hasTaskNameParam.value && formData.value.task_name_param) {
      scheduleRule.task_name = formData.value.task_name_param;
    }

    const payload: Record<string, any> = {
      task_name: formData.value.task_name,
      task_type: formData.value.task_type,
      schedule_rule: scheduleRule,
      description: formData.value.description,
      enabled: formData.value.enabled,
    };

    if (
      formData.value.node_id &&
      formData.value.node_id !== PLATFORM_SCHEDULER_NODE_ID
    ) {
      payload.node_id = formData.value.node_id;
    }

    await createScheduledTaskApi(payload as any);
    message.success('创建成功');
    emit('refresh');
    emit('update:visible', false);
  } catch (error: any) {
    if (error?.errorFields) return; // 表单校验错误
    message.error(error?.message || '创建失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :open="visible"
    title="创建定时任务"
    width="600px"
    @cancel="handleClose"
    @ok="handleSave"
    :confirm-loading="saving"
    ok-text="创建"
    cancel-text="取消"
  >
    <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <Form.Item label="任务名称" name="task_name">
        <Input
          v-model:value="formData.task_name"
          placeholder="请输入任务名称"
        />
      </Form.Item>

      <Form.Item label="执行节点" name="node_id">
        <Select
          v-model:value="formData.node_id"
          placeholder="请先选择执行节点或平台调度器"
          @change="onNodeChange"
        >
          <Select.Option
            v-for="node in nodeOptions"
            :key="node.id"
            :value="node.id"
          >
            {{ node.name }}
            <Tag class="ml-2">
              {{ node.node_type || 'unknown' }}
            </Tag>
            <Tag :color="node.status === 'active' ? 'success' : 'warning'">
              {{ node.status || '-' }}
            </Tag>
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item v-if="selectedNode" label="节点能力">
        <Tag color="blue">{{ selectedNode.name }}</Tag>
        <span class="hint-text ml-2 text-xs text-gray-400">
          {{
            availableTaskTypes.length > 0
              ? `当前节点可创建 ${availableTaskTypes.length} 类任务`
              : taskTypesLoading
                ? '正在读取节点可用任务...'
                : '当前节点暂无可创建的任务类型'
          }}
        </span>
      </Form.Item>

      <Form.Item label="任务类型" name="task_type">
        <Select
          v-model:value="formData.task_type"
          :disabled="!formData.node_id || availableTaskTypes.length === 0"
          :loading="taskTypesLoading"
          :placeholder="
            formData.node_id
              ? '请选择该节点可执行的任务类型'
              : '请先选择执行节点'
          "
          @change="onTaskTypeChange"
        >
          <Select.Option
            v-for="t in availableTaskTypes"
            :key="t.value"
            :value="t.value"
          >
            {{ t.label }}
            <span style="margin-left: 4px; font-size: 12px; color: #999">
              {{ t.cron_description }}
            </span>
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item v-if="selectedTaskType" label="任务描述">
        <Tag color="blue">{{ selectedTaskType.label }}</Tag>
        <Tag
          :color="selectedTaskType.requires_node ? 'purple' : 'cyan'"
          class="ml-2"
        >
          {{
            selectedTaskType.dispatch_mode === 'agent'
              ? 'Agent 拉取执行'
              : '平台 Celery 执行'
          }}
        </Tag>
        <span class="hint-text ml-2 text-xs text-gray-400">
          {{ selectedTaskType.description }}
        </span>
      </Form.Item>

      <Form.Item label="Cron 表达式" name="cron">
        <Input v-model:value="formData.cron" placeholder="0 * * * *">
          <template #suffix>
            <span v-if="cronDescription" class="text-xs text-gray-400">
              {{ cronDescription }}
            </span>
          </template>
        </Input>
      </Form.Item>

      <!-- 动态参数：设备列表 -->
      <Form.Item
        v-if="hasDeviceIds"
        label="设备 ID 列表"
        name="device_ids"
        :rules="
          deviceIdsRequired
            ? [{ required: true, message: '请输入设备 ID', trigger: 'blur' }]
            : []
        "
      >
        <Select
          v-model:value="formData.device_ids"
          mode="tags"
          :placeholder="`输入设备 ID，回车添加（${deviceIdsRequired ? '必填' : '可选'}）`"
          allow-clear
        />
      </Form.Item>

      <!-- 动态参数：告警列表 -->
      <Form.Item
        v-if="hasAlarmIds"
        label="告警 ID 列表"
        name="alarm_ids"
        :rules="
          alarmIdsRequired
            ? [{ required: true, message: '请输入告警 ID', trigger: 'blur' }]
            : []
        "
      >
        <Select
          v-model:value="formData.alarm_ids"
          mode="tags"
          :placeholder="`输入告警 ID，回车添加（${alarmIdsRequired ? '必填' : '可选'}）`"
          allow-clear
        />
      </Form.Item>

      <!-- 动态参数：维护任务名称 -->
      <Form.Item
        v-if="hasTaskNameParam"
        label="维护任务名称"
        name="task_name_param"
      >
        <Select
          v-model:value="formData.task_name_param"
          placeholder="请选择维护任务"
        >
          <Select.Option value="backup_database">备份数据库</Select.Option>
          <Select.Option value="cleanup_expired_data">
            清理过期数据
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="任务描述" name="description">
        <Input.TextArea
          v-model:value="formData.description"
          placeholder="请输入任务描述"
          :rows="2"
        />
      </Form.Item>

      <Form.Item label="是否启用" name="enabled">
        <Switch v-model:checked="formData.enabled" />
        <span class="hint-text ml-2 text-xs text-gray-400">
          {{ formData.enabled ? '创建后立即启用' : '创建后不启用' }}
        </span>
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.hint-text {
  font-size: 12px;
  color: var(--ant-color-text-quaternary);
}
</style>
