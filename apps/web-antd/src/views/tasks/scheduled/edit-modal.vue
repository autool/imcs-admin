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
import { getTaskTypesApi, updateScheduledTaskApi } from '#/api/tasks/scheduled';

import { parseCronExpression } from './data';

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
  'update:visible': [value: boolean];
}>();

const PLATFORM_SCHEDULER_NODE_ID = '__platform_scheduler__';

interface Props {
  visible: boolean;
  taskData: any;
}

const formRef = ref();
const saving = ref(false);
const taskTypes = ref<ScheduledTasksApi.TaskType[]>([]);
const nodes = ref<
  Array<{ id: string; name: string; node_type?: string; status?: string }>
>([]);

const formData = ref({
  task_name: '',
  task_type: '',
  node_id: '',
  cron: '',
  description: '',
  enabled: false,
  device_ids: [] as string[],
  alarm_ids: [] as string[],
  task_name_param: '',
});

const rules: Record<string, Rule[]> = {
  task_name: [
    {
      required: true,
      message: '请输入任务名称',
      trigger: 'blur',
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
  taskTypes.value.find((t) => t.value === formData.value.task_type),
);

const nodeRequired = computed(() =>
  Boolean(selectedTaskType.value?.requires_node),
);

const nodeOptions = computed(() => {
  if (!selectedTaskType.value) return [];
  if (!selectedTaskType.value.requires_node) {
    return [
      {
        id: PLATFORM_SCHEDULER_NODE_ID,
        name: '平台调度器（admin-api / Celery）',
        node_type: 'admin',
        status: 'active',
      },
    ];
  }
  return nodes.value.filter(
    (node) => node.node_type === selectedTaskType.value?.node_type,
  );
});

const hasDeviceIds = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema && 'device_ids' in schema;
});

const hasAlarmIds = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema && 'alarm_ids' in schema;
});

const hasTaskNameParam = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema && 'task_name' in schema;
});

const deviceIdsRequired = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema?.device_ids?.required === true;
});

const alarmIdsRequired = computed(() => {
  const schema = selectedTaskType.value?.params_schema;
  return schema?.alarm_ids?.required === true;
});

async function loadOptions() {
  try {
    const result = await getTaskTypesApi();
    taskTypes.value = result;
  } catch {
    // 忽略
  }
  try {
    const result = await getNodesApi();
    nodes.value = result;
  } catch {
    // 忽略
  }
}

function openModal() {
  const task = props.taskData;
  if (!task) return;

  const rule = task.schedule_rule;
  let cron = '';
  if (typeof rule === 'string') {
    cron = rule;
  } else if (rule && typeof rule === 'object') {
    cron = rule.cron || '';
  }

  formData.value = {
    task_name: task.task_name || '',
    node_id:
      task.node_id || (task.requires_node ? '' : PLATFORM_SCHEDULER_NODE_ID),
    cron,
    description: task.description || '',
    enabled: task.enabled ?? false,
    device_ids: (rule?.device_ids as string[]) || [],
    alarm_ids: (rule?.alarm_ids as string[]) || [],
    task_name_param: rule?.task_name || '',
    task_type: task.task_type || '',
  };
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadOptions();
      openModal();
    }
  },
);

function handleClose() {
  emit('update:visible', false);
}

async function handleSave() {
  try {
    await formRef.value.validateFields();
    saving.value = true;

    const scheduleRule: Record<string, any> = { cron: formData.value.cron };

    if (hasDeviceIds.value) {
      scheduleRule.device_ids = formData.value.device_ids;
    }
    if (hasAlarmIds.value) {
      scheduleRule.alarm_ids = formData.value.alarm_ids;
    }
    if (hasTaskNameParam.value) {
      scheduleRule.task_name = formData.value.task_name_param;
    }

    const payload: Record<string, any> = {
      task_name: formData.value.task_name,
      schedule_rule: scheduleRule,
      description: formData.value.description,
      enabled: formData.value.enabled,
    };

    if (
      formData.value.node_id &&
      formData.value.node_id !== PLATFORM_SCHEDULER_NODE_ID
    ) {
      payload.node_id = formData.value.node_id;
    } else if (formData.value.node_id === PLATFORM_SCHEDULER_NODE_ID) {
      payload.node_id = PLATFORM_SCHEDULER_NODE_ID;
    }

    await updateScheduledTaskApi(props.taskData.id, payload);
    message.success('更新成功');
    emit('refresh');
    emit('update:visible', false);
  } catch (error: any) {
    if (error?.errorFields) return; // 表单校验错误
    message.error(error?.message || '更新失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :open="visible"
    title="编辑定时任务"
    width="600px"
    @cancel="handleClose"
    @ok="handleSave"
    :confirm-loading="saving"
  >
    <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <Form.Item label="任务名称" name="task_name">
        <Input
          v-model:value="formData.task_name"
          placeholder="请输入任务名称"
        />
      </Form.Item>

      <Form.Item v-if="selectedTaskType" label="任务类型">
        <Tag color="blue">{{ selectedTaskType.label }}</Tag>
        <span class="hint-text ml-2 text-xs text-gray-400">
          任务类型不可修改
        </span>
      </Form.Item>

      <Form.Item
        label="执行节点"
        name="node_id"
        :rules="
          selectedTaskType
            ? [
                {
                  required: true,
                  message: '请选择执行节点',
                  trigger: 'change',
                },
              ]
            : []
        "
      >
        <Select
          v-model:value="formData.node_id"
          :placeholder="
            nodeRequired
              ? '请选择具备该任务能力的 Agent 节点'
              : '平台任务由平台调度器执行'
          "
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
          {{ formData.enabled ? '已启用' : '已禁用' }}
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
