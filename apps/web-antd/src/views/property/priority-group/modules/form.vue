<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { PriorityGroupApi } from '#/api/assets/priority-group';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createPriorityGroup,
  updatePriorityGroup,
} from '#/api/assets/priority-group';

const emits = defineEmits<{
  success: [];
}>();

const priorityOptions = [
  { label: '重大业务', value: 10 },
  { label: '重要业务', value: 30 },
  { label: '普通业务', value: 50 },
  { label: '测试备用', value: 80 },
];

type PriorityGroupFormValues = {
  description?: string;
  name: string;
  priority_level: number;
  sort_order?: number;
};

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入分组名称',
      },
      fieldName: 'name',
      label: '分组名称',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: priorityOptions,
        placeholder: '请选择优先级',
      },
      fieldName: 'priority_level',
      label: '优先级',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 999,
        placeholder: '请输入排序序号',
      },
      defaultValue: 0,
      fieldName: 'sort_order',
      label: '排序序号',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入分组描述（可选）',
        rows: 3,
      },
      fieldName: 'description',
      label: '分组描述',
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

    const rawValues = await formApi.getValues();
    const values: PriorityGroupFormValues = {
      description: rawValues.description
        ? String(rawValues.description)
        : undefined,
      name: String(rawValues.name || ''),
      priority_level: Number(rawValues.priority_level),
      sort_order:
        rawValues.sort_order === undefined || rawValues.sort_order === null
          ? undefined
          : Number(rawValues.sort_order),
    };
    modalApi.lock();

    try {
      await (id.value
        ? updatePriorityGroup(id.value, values)
        : createPriorityGroup(values));
      message.success(id.value ? '更新成功' : '创建成功');
      emits('success');
      modalApi.close();
    } catch {
      modalApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<PriorityGroupApi.PriorityGroup>();

      formApi.resetForm();

      if (data?.id) {
        id.value = data.id;
        formApi.setValues({
          name: data.name,
          description: data.description || '',
          priority_level: data.priority_level,
          sort_order: data.sort_order,
        });
      } else {
        id.value = undefined;
        formApi.setValues({
          priority_level: 50,
          sort_order: 0,
        });
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
