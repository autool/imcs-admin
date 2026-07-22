<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AlertConfigApi } from '#/api/assets/alert-config';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getServerAlarmTicketPolicy,
  updateServerAlarmTicketPolicy,
} from '#/api/assets/alert-config';

const emits = defineEmits<{
  success: [];
}>();

const SEVERITY_OPTIONS = [
  { label: '严重', value: 'critical' },
  { label: '重大', value: 'major' },
  { label: '次要', value: 'minor' },
  { label: '警告', value: 'warning' },
  { label: '信息', value: 'info' },
];

const GROUP_OPTIONS = [
  { label: '重大业务(10)', value: 10 },
  { label: '重要业务(30)', value: 30 },
  { label: '普通业务(50)', value: 50 },
  { label: '测试备用(80)', value: 80 },
  { label: '旧重大(1)', value: 1 },
  { label: '旧重要(2)', value: 2 },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'enabled',
      label: '启用建单策略',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: GROUP_OPTIONS,
      },
      fieldName: 'key_group_priorities',
      help: '命中这些优先级分组时，不论告警级别都进入运维工单闭环。',
      label: '重点分组',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: SEVERITY_OPTIONS,
      },
      fieldName: 'high_severities',
      help: '非重点分组命中这些级别时自动建单。',
      label: '高等级告警',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: SEVERITY_OPTIONS,
      },
      fieldName: 'escalation_severities',
      help: '这些级别按重复次数升级为工单。',
      label: '重复升级级别',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        max: 20,
        min: 1,
        precision: 0,
      },
      fieldName: 'repeat_threshold',
      help: '同设备同组件同代码 24 小时内达到次数后自动建单。',
      label: '重复阈值',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        max: 1000,
        min: 1,
        precision: 0,
      },
      fieldName: 'scan_limit',
      help: '每次策略扫描最多处理的未关闭告警数量。',
      label: '扫描上限',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: SEVERITY_OPTIONS,
      },
      fieldName: 'ignored_severities',
      help: '这些级别只记录，不自动建单。',
      label: '忽略级别',
    },
  ] as VbenFormSchema[],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    modalApi.lock();
    try {
      await updateServerAlarmTicketPolicy(
        values as Partial<AlertConfigApi.TicketPolicy>,
      );
      message.success('策略已保存');
      emits('success');
      modalApi.close();
    } catch (error: any) {
      message.error(error.message || '保存失败');
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    modalApi.lock();
    try {
      const policy = await getServerAlarmTicketPolicy();
      formApi.setValues(policy);
    } catch (error: any) {
      message.error(error.message || '加载策略失败');
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[720px]">
    <Form />
  </Modal>
</template>
