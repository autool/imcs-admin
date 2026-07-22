<script lang="ts" setup>
import { computed } from 'vue';

import { Descriptions, Modal, Tag } from 'ant-design-vue';

import { parseCronExpression } from './data';

interface Props {
  visible: boolean;
  taskData: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
}>();

const scheduleRule = computed(() => {
  const rule = props.taskData?.schedule_rule;
  return typeof rule === 'object' ? rule?.cron || '' : rule || '';
});

const params = computed(() => {
  const value = props.taskData?.params || props.taskData?.task_params || {};
  return JSON.stringify(value, null, 2);
});
</script>

<template>
  <Modal
    :footer="null"
    :open="visible"
    title="计划任务详情"
    width="720px"
    @cancel="emit('update:visible', false)"
  >
    <Descriptions bordered :column="1" size="small">
      <Descriptions.Item label="任务名称">
        {{ taskData?.task_name || taskData?.name || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="任务类型">
        <Tag color="blue">{{ taskData?.task_type || '-' }}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="调度规则">
        {{ scheduleRule ? parseCronExpression(scheduleRule) : '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="状态">
        {{ taskData?.enabled === false ? '已停用' : '已启用' }}
      </Descriptions.Item>
      <Descriptions.Item label="参数">
        <pre class="m-0 whitespace-pre-wrap break-all">{{ params }}</pre>
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
