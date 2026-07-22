<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { RegionManagementApi } from '#/api/assets/region-management';
import type { SystemUserOption } from '#/utils/system-user-options';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createRegion,
  getAllRegions,
  updateRegion,
} from '#/api/assets/region-management';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const emits = defineEmits<{
  success: [];
}>();

const parentRegions = ref<any[]>([]);
const users = ref<SystemUserOption[]>([]);

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
        placeholder: '请输入区域名称',
      },
      fieldName: 'region_name',
      label: '区域名称',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '办公场所', value: 'office' },
          { label: '机房', value: 'datacenter' },
          { label: '其他', value: 'other' },
        ],
        placeholder: '请选择区域类型',
      },
      fieldName: 'region_type',
      label: '区域类型',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入位置',
      },
      fieldName: 'location',
      label: '位置',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: parentRegions,
        placeholder: '请选择上级区域',
      },
      fieldName: 'parent_region_id',
      label: '上级区域',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: users,
        placeholder: '请选择负责人',
        showSearch: true,
        filterOption: (input: string, option: any) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },
      },
      fieldName: 'responsible_user_id',
      label: '负责人',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系方式',
      },
      fieldName: 'contact',
      label: '联系方式',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '正常', value: 'normal' },
          { label: '锁定', value: 'locked' },
        ],
        placeholder: '请选择状态',
      },
      defaultValue: 'normal',
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入描述',
        rows: 3,
      },
      fieldName: 'description',
      label: '描述',
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

    try {
      await (id.value ? updateRegion(id.value, values) : createRegion(values));
      emits('success');
      modalApi.close();
    } catch {
      modalApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<RegionManagementApi.Region>();
      try {
        const regions = await getAllRegions();
        parentRegions.value = (regions || [])
          .filter((r: any) => !data || r.region_id !== data.region_id)
          .map((r: any) => ({
            label: r.region_name,
            value: r.region_id,
          }));
      } catch (error) {
        console.error('加载父区域失败:', error);
      }

      if (users.value.length === 0) {
        try {
          const { options } = await loadSystemUserOptions({
            include_disabled: true,
          });
          users.value = options;
        } catch (error) {
          console.error('加载负责人失败:', error);
        }
      }

      formApi.resetForm();

      if (data?.region_id) {
        id.value = data.region_id;
        formApi.setValues({
          ...data,
          responsible_user_id: data.responsible_user_id || undefined,
        });
      } else {
        id.value = undefined;
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
