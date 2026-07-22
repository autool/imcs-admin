<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AlertConfigApi } from '#/api/assets/alert-config';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createAlertConfig,
  getAvailableMetrics,
  getMonitoringResources,
  getNotificationChannels,
  getNotificationTemplates,
  updateAlertConfig,
} from '#/api/assets/alert-config';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const emits = defineEmits<{
  success: [];
}>();

const notificationChannels = ref<any[]>([]);
const notificationTemplates = ref<any[]>([]);
const userList = ref<any[]>([]);
const availableMetrics = ref<AlertConfigApi.MetricOption[]>([]);
const selectedMetric = ref<string>('');
const selectedCondition = ref<string>('gt');
const targetType = ref<string>('single_server');

const TARGET_TYPE_OPTIONS = [
  { label: '单个服务器', value: 'single_server' },
  { label: '区域', value: 'region' },
  { label: '优先级分组', value: 'priority_group' },
  { label: '全部服务器', value: 'all' },
];

// 是否显示区间输入
const showRangeInput = computed(() => {
  return (
    selectedCondition.value === 'between' ||
    selectedCondition.value === 'not_between'
  );
});

// 根据选中的指标动态生成阈值说明
const thresholdHelp = computed(() => {
  const metric = availableMetrics.value.find(
    (m) => m.value === selectedMetric.value,
  );
  if (metric) {
    if (showRangeInput.value) {
      return `${metric.description || `${metric.label}区间`}`;
    }
    return (
      metric.description ||
      `${metric.label}，建议阈值: ${metric.default_threshold}${metric.unit}`
    );
  }
  if (showRangeInput.value) {
    return '请输入告警阈值区间';
  }
  return '请输入告警阈值';
});

// 加载资源列表（根据目标类型）
async function loadResourcesByType(type: string) {
  try {
    const groups: any[] = (await getMonitoringResources(type)) || [];

    // 将分组格式转换为表单选项
    const options: any[] = [];
    for (const group of groups) {
      if (group.options) {
        options.push({
          label: group.label,
          options: group.options.map((item: any) => ({
            label: item.label,
            value: item.id || item.value,
          })),
        });
      }
    }

    formApi.updateSchema([
      {
        fieldName: 'resource_id',
        componentProps: { options },
      },
    ]);
  } catch {
    message.error('加载资源列表失败');
  }
}

// 加载指标列表
async function loadMetrics(resourceType: string) {
  try {
    const metrics: any[] = (await getAvailableMetrics(resourceType)) || [];
    availableMetrics.value = metrics;

    formApi.updateSchema([
      {
        fieldName: 'metric_name',
        componentProps: {
          options: metrics.map((m: any) => ({
            label: m.label,
            value: m.value,
          })),
        },
      },
    ]);
  } catch {
    message.error('加载指标列表失败');
  }
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Select',
      componentProps: {
        options: TARGET_TYPE_OPTIONS,
        placeholder: '请选择目标类型',
        onChange: async (value: string) => {
          targetType.value = value;
          // 清空资源选择
          formApi.setFieldValue('resource_id', undefined);
          // 根据目标类型加载资源
          if (value !== 'all') {
            await loadResourcesByType(value);
            // 全部服务器类型不加载指标（指标在切换时保留）
            await loadMetrics('server');
          }
          // 更新资源字段的必填状态
          formApi.updateSchema([
            {
              fieldName: 'resource_id',
              rules: value === 'all' ? '' : 'required',
            },
          ]);
        },
      },
      fieldName: 'target_type',
      label: '目标类型',
      rules: 'required',
      help: '选择告警规则应用的目标范围',
    },
    {
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请选择目标',
        showSearch: true,
        filterOption: (input: string, option: any) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },
      },
      fieldName: 'resource_id',
      label: '监控目标',
      rules: 'required',
      help: '选择要监控的目标',
    },
    {
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请选择监控指标',
        onChange: (value: string) => {
          selectedMetric.value = value;
          const metric = availableMetrics.value.find((m) => m.value === value);
          if (metric) {
            formApi.setFieldValue('threshold', metric.default_threshold);

            const allConditions = [
              { label: '大于 (>)', value: 'gt' },
              { label: '大于等于 (>=)', value: 'gte' },
              { label: '小于 (<)', value: 'lt' },
              { label: '小于等于 (<=)', value: 'lte' },
              { label: '等于 (=)', value: 'eq' },
              { label: '不等于 (!=)', value: 'ne' },
              { label: '在区间内', value: 'between' },
              { label: '不在区间内', value: 'not_between' },
            ];

            let filteredConditions = allConditions;
            if (!metric.supports_range) {
              filteredConditions = allConditions.filter(
                (c) => c.value !== 'between' && c.value !== 'not_between',
              );
            }
            if (
              metric.recommended_conditions &&
              metric.recommended_conditions.length > 0
            ) {
              filteredConditions = allConditions.filter((c) =>
                (metric.recommended_conditions || []).includes(c.value),
              );
            }

            formApi.updateSchema([
              {
                fieldName: 'condition',
                componentProps: { options: filteredConditions },
              },
            ]);
          }

          if (
            !metric?.supports_range &&
            (selectedCondition.value === 'between' ||
              selectedCondition.value === 'not_between')
          ) {
            formApi.setFieldValue('condition', 'gt');
            selectedCondition.value = 'gt';
          }
        },
      },
      fieldName: 'metric_name',
      label: '监控指标',
      rules: 'required',
      help: '选择要监控的指标项',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '大于 (>)', value: 'gt' },
          { label: '大于等于 (>=)', value: 'gte' },
          { label: '小于 (<)', value: 'lt' },
          { label: '小于等于 (<=)', value: 'lte' },
          { label: '等于 (=)', value: 'eq' },
          { label: '不等于 (!=)', value: 'ne' },
          { label: '在区间内', value: 'between' },
          { label: '不在区间内', value: 'not_between' },
        ],
        placeholder: '请选择条件',
        onChange: (value: string) => {
          selectedCondition.value = value;
          if (value === 'between' || value === 'not_between') {
            formApi.setFieldValue('threshold_max', undefined);
          }
        },
      },
      fieldName: 'condition',
      label: '告警条件',
      rules: 'required',
      help: '指标值与阈值的比较条件',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: showRangeInput.value ? '请输入最小值' : '请输入告警阈值',
        style: { width: '100%' },
      },
      fieldName: 'threshold',
      label: showRangeInput.value ? '阈值下限' : '告警阈值',
      rules: 'required',
      help: thresholdHelp,
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入最大值',
        style: { width: '100%' },
      },
      fieldName: 'threshold_max',
      label: '阈值上限',
      rules: 'required',
      help: '区间判断的上限值',
      dependencies: {
        triggerFields: ['condition'],
        if(values) {
          return (
            values.condition === 'between' || values.condition === 'not_between'
          );
        },
      },
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '严重 - 需要立即处理', value: 'critical' },
          { label: '重要 - 需要尽快处理', value: 'major' },
          { label: '次要 - 可以稍后处理', value: 'minor' },
          { label: '警告 - 需要关注', value: 'warning' },
          { label: '信息 - 仅供参考', value: 'info' },
        ],
        placeholder: '请选择严重程度',
      },
      fieldName: 'severity',
      label: '严重程度',
      rules: 'required',
      help: '告警触发时的严重程度级别',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: [
          { label: '邮件通知', value: 'email' },
          { label: '短信通知', value: 'sms' },
          { label: '企业微信', value: 'wechat' },
          { label: 'Webhook', value: 'webhook' },
        ],
        placeholder: '请选择通知渠道（可选）',
      },
      fieldName: 'notification_channels',
      label: '通知渠道',
      help: '可以选择多个通知渠道（可选）',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: [],
        placeholder: '请选择接收人（可选）',
        showSearch: true,
        filterOption: (input: string, option: any) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },
      },
      fieldName: 'recipients',
      label: '接收人',
      help: '选择告警通知的接收人（可选，可多选）',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
        style: { width: 'auto' },
      },
      defaultValue: true,
      fieldName: 'enabled',
      label: '启用状态',
      help: '是否立即启用此告警配置',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 60,
        max: 86_400,
        step: 60,
        placeholder: '请输入静默时间',
        style: { width: '100%' },
        addonAfter: '秒',
      },
      defaultValue: 3600,
      fieldName: 'cooldown_time',
      label: '静默时间',
      help: '同一告警在此时间内不会重复发送，默认3600秒(1小时)',
    },
    {
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请选择通知模板(可选)',
        allowClear: true,
      },
      fieldName: 'notification_template_id',
      label: '通知模板',
      help: '选择自定义通知模板,不选则使用默认模板',
    },
    {
      component: 'Textarea',
      componentProps: { placeholder: '请输入描述信息', rows: 3 },
      fieldName: 'description',
      label: '描述',
      help: '详细描述此告警配置的用途（可选）',
    },
  ] as VbenFormSchema[],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const id = ref<string>();

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    modalApi.lock();

    // 目标类型为 'all' 时不需要 resource_id
    const submitData = {
      ...values,
      target_type: values.target_type,
      resource_id:
        values.target_type === 'all' ? undefined : values.resource_id,
      notification_channels: Array.isArray(values.notification_channels)
        ? values.notification_channels.join(',')
        : values.notification_channels || '',
      recipients: Array.isArray(values.recipients)
        ? values.recipients.join(',')
        : values.recipients || '',
    };

    try {
      await (id.value
        ? updateAlertConfig(id.value, submitData)
        : createAlertConfig(submitData));
      message.success(id.value ? '更新成功' : '创建成功');
      emits('success');
      modalApi.close();
    } catch (error: any) {
      message.error(error.message || '操作失败');
      modalApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      // 加载通知渠道
      if (notificationChannels.value.length === 0) {
        try {
          const response = await getNotificationChannels();
          notificationChannels.value = response || [];
        } catch {
          // 忽略
        }
      }

      // 加载通知模板
      if (notificationTemplates.value.length === 0) {
        try {
          const response = await getNotificationTemplates();
          notificationTemplates.value = response || [];
        } catch {
          // 忽略
        }
      }

      if (notificationTemplates.value.length > 0) {
        formApi.updateSchema([
          {
            fieldName: 'notification_template_id',
            componentProps: {
              options: notificationTemplates.value.map((t: any) => ({
                label: t.name,
                value: t.id,
              })),
            },
          },
        ]);
      }

      // 加载用户列表
      if (userList.value.length === 0) {
        try {
          const { options } = await loadSystemUserOptions({
            include_disabled: true,
          });
          userList.value = options;
        } catch {
          // 忽略
        }
      }

      if (userList.value.length > 0) {
        formApi.updateSchema([
          {
            fieldName: 'recipients',
            componentProps: {
              options: userList.value,
            },
          },
        ]);
      }

      const data = modalApi.getData<AlertConfigApi.AlertConfig>();

      formApi.resetForm();

      if (data?.id) {
        // 编辑模式
        id.value = data.id;
        targetType.value = data.target_type || 'single_server';
        selectedMetric.value = data.metric_name || '';

        // 加载资源和指标
        if (targetType.value !== 'all') {
          await loadResourcesByType(targetType.value);
        }
        await loadMetrics('server');

        const recipientsArray =
          data.recipients?.split(',').filter(Boolean) || [];

        formApi.setValues({
          target_type: data.target_type || 'single_server',
          resource_id: data.resource_id || undefined,
          metric_name: data.metric_name,
          condition: data.condition,
          threshold: data.threshold,
          threshold_max: data.threshold_max,
          severity: data.severity,
          enabled: data.enabled,
          notification_channels:
            data.notification_channels?.split(',').filter(Boolean) || [],
          recipients: recipientsArray,
          description: data.description || '',
          cooldown_time: data.cooldown_time || 3600,
          notification_template_id: data.notification_template_id || '',
        });

        selectedCondition.value = data.condition || 'gt';
      } else {
        // 新增模式
        id.value = undefined;
        targetType.value = 'single_server';
        selectedMetric.value = '';

        formApi.setFieldValue('target_type', 'single_server');
        formApi.setFieldValue('condition', 'gt');
        formApi.setFieldValue('severity', 'warning');
        selectedCondition.value = 'gt';

        await loadResourcesByType('single_server');
        await loadMetrics('server');
      }
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
