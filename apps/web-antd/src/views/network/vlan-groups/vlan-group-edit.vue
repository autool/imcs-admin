<script lang="ts" setup>
import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { createVLANGroup, updateVLANGroup } from '#/api/network/vlan-groups';

const data = ref<Record<string, any>>({});
const isEdit = ref(false);

const [BaseForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-9/12',
    },
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'group_name',
      label: '分组名称',
      rules: z.string().min(1, '分组名称不能为空'),
      componentProps: {
        placeholder: '请输入分组名称',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        placeholder: '请选择状态',
        options: [
          { label: '启用', value: 'active' },
          { label: '停用', value: 'inactive' },
        ],
      },
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: '描述',
      componentProps: {
        placeholder: '请输入描述',
        rows: 3,
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  closeOnClickModal: false,
  confirmLoading: false,
  cancelText: '取消',
  confirmText: '保存',
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      modalApi.setState({ confirmLoading: true });
      const valid = await formApi.validate();

      if (valid) {
        const values = await Promise.resolve(formApi.getValues());

        if (isEdit.value && data.value.id) {
          // 编辑
          await updateVLANGroup(data.value.id, values as any);
          message.success('更新成功');
          modalApi.close();
        } else {
          // 新增
          await createVLANGroup(values as any);
          message.success('创建成功');
          modalApi.close();
        }
      }
    } catch (error: any) {
      console.error('Save failed:', error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const modalData = modalApi.getData<Record<string, any>>();
      data.value = modalData?.values || {};
      isEdit.value = !!data.value.id;

      // 等待表单组件渲染完成
      await nextTick();

      // 设置表单值
      await (isEdit.value
        ? formApi.setValues(data.value)
        : formApi.setValues({
            status: 'active',
          }));
    }
  },
  title: 'VLAN分组',
});
</script>

<template>
  <Modal>
    <BaseForm />
  </Modal>
</template>
