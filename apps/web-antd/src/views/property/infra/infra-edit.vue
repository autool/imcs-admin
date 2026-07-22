<script lang="ts" setup>
import type { InfraOptionItem } from '#/api/infra';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getCabinets,
  getLocations,
  getRegions,
  updateAssetLocation,
} from '#/api/infra';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const emit = defineEmits<{ success: [] }>();

const data = ref<Record<string, any>>({});
const regionOptions = ref<InfraOptionItem[]>([]);
const locationOptions = ref<InfraOptionItem[]>([]);
const cabinetOptions = ref<InfraOptionItem[]>([]);
const userOptions = ref<Array<{ label: string; value: string }>>([]);

// 加载区域列表
async function loadRegions() {
  try {
    const res = await getRegions();
    regionOptions.value = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('Failed to load regions:', error);
    message.error('加载区域列表失败');
  }
}

// 加载位置列表（根据区域）
async function loadLocations(regionId?: string) {
  try {
    const res = await getLocations(regionId);
    locationOptions.value = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('Failed to load locations:', error);
    message.error('加载位置列表失败');
  }
}

// 加载机柜列表（根据位置）
async function loadCabinets(locationId?: string) {
  try {
    const res = await getCabinets(locationId);
    cabinetOptions.value = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('Failed to load cabinets:', error);
    message.error('加载机柜列表失败');
  }
}

async function loadUsers() {
  try {
    const response = await loadSystemUserOptions({ include_disabled: true });
    userOptions.value = response.options;
    formApi.updateSchema([
      {
        componentProps: {
          options: userOptions.value,
        },
        fieldName: 'asset_user_id',
      },
    ]);
  } catch (error) {
    console.error('Failed to load users:', error);
    message.error('加载用户列表失败');
  }
}

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
      fieldName: 'tag_number',
      label: '资产号',
      rules: z.string().min(1, '资产号不能为空'),
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'region_id',
      label: '区域',
      componentProps: {
        placeholder: '请选择区域',
        allowClear: true,
        showSearch: true,
        options: regionOptions,
        filterOption: (input: string, option: any) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },
        onChange: async (value: string) => {
          // 清空下级选项
          formApi.setFieldValue('location_id', undefined);
          formApi.setFieldValue('cabinet_id', undefined);
          locationOptions.value = [];
          cabinetOptions.value = [];

          // 加载位置选项
          if (value) {
            await loadLocations(value);
          }
        },
      },
    },
    {
      component: 'Select',
      fieldName: 'location_id',
      label: '位置',
      componentProps: {
        placeholder: '请选择位置',
        allowClear: true,
        showSearch: true,
        options: locationOptions,
        filterOption: (input: string, option: any) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },
        onChange: async (value: string) => {
          // 清空下级选项
          formApi.setFieldValue('cabinet_id', undefined);
          cabinetOptions.value = [];

          // 加载机柜选项
          if (value) {
            await loadCabinets(value);
          }
        },
      },
      dependencies: {
        triggerFields: ['region_id'],
        disabled: (values) => !values.region_id,
      },
    },
    {
      component: 'Select',
      fieldName: 'cabinet_id',
      label: '机柜',
      componentProps: {
        placeholder: '请选择机柜',
        allowClear: true,
        showSearch: true,
        options: cabinetOptions,
        filterOption: (input: string, option: any) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },
      },
      dependencies: {
        triggerFields: ['location_id'],
        disabled: (values) => !values.location_id,
      },
    },
    {
      component: 'Input',
      fieldName: 'uPosition',
      label: 'U位',
      componentProps: {
        placeholder: '例如: 1-4 (表示占用1到4号U位)',
      },
    },
    {
      component: 'Select',
      fieldName: 'asset_user_id',
      label: '责任人',
      componentProps: {
        placeholder: '请选择责任人',
        allowClear: true,
        showSearch: true,
        options: userOptions,
        filterOption: (input: string, option: any) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'purchase_date',
      label: '采购日期',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        disabled: true,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'notes',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注信息',
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
        // getValues可能返回Promise，需要await
        const values = await Promise.resolve(formApi.getValues());

        const assetId =
          data.value.id || data.value.server_id || data.value.product_id;

        if (!assetId) {
          message.error('资产ID不存在');
          return;
        }

        const updateData = {
          region_id: values.region_id,
          location_id: values.location_id,
          cabinet_id: values.cabinet_id,
          uPosition: values.uPosition,
          asset_user_id: values.asset_user_id,
          notes: values.notes,
        };

        await updateAssetLocation(assetId, updateData);

        message.success('保存成功');
        emit('success');
        modalApi.close();
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      message.error(`保存失败: ${error.message || '未知错误'}`);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const modalData = modalApi.getData<Record<string, any>>();
      data.value = modalData?.values || {};
      // 先加载区域
      await loadRegions();
      await loadUsers();

      // 如果有已选的区域，加载位置
      if (data.value.region_id) {
        await loadLocations(data.value.region_id);
      }

      // 如果有已选的位置，加载机柜
      if (data.value.location_id) {
        await loadCabinets(data.value.location_id);
      }

      // 等待表单组件渲染完成，确保options已更新到DOM
      await nextTick();

      // 设置表单值
      await formApi.setValues({
        tag_number: data.value.tag_number,
        region_id: data.value.region_id,
        location_id: data.value.location_id,
        cabinet_id: data.value.cabinet_id,
        uPosition: data.value.uPosition,
        asset_user_id: data.value.asset_user_id,
        purchase_date: data.value.purchase_date,
        notes: data.value.notes,
      });
    }
  },
  title: '编辑资产位置',
});
</script>

<template>
  <Modal>
    <BaseForm />
  </Modal>
</template>
