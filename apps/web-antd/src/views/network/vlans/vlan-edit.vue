<script lang="ts" setup>
import type { VLANGroupApi } from '#/api/network/vlan-groups/index';
import type { RegionApi } from '#/api/system/regions/index';

import { nextTick, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { getAllVLANGroups } from '#/api/network/vlan-groups/index';
import { createVLAN, updateVLAN } from '#/api/network/vlans';
import { getAllRegions } from '#/api/system/regions/index';

const data = ref<Record<string, any>>({});
const isEdit = ref(false);
const regions = ref<RegionApi.Region[]>([]);
const vlanGroups = ref<VLANGroupApi.VLANGroup[]>([]);

const defaultFormValues = {
  description: undefined,
  gateway: undefined,
  group_id: undefined,
  network_segment: undefined,
  region_id: undefined,
  status: 'active',
  subnet_mask: undefined,
  vlan_id: undefined,
  vlan_name: undefined,
};

// 加载区域和分组数据
const loadOptions = async () => {
  try {
    // 加载区域
    const regionResponse = await getAllRegions();
    regions.value = regionResponse.list || [];

    // 加载分组
    const groupResponse = await getAllVLANGroups();
    vlanGroups.value = groupResponse || [];
  } catch (error) {
    console.error('加载选项失败:', error);
  }
};

onMounted(() => {
  loadOptions();
});

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
      fieldName: 'vlan_id',
      label: 'VLAN ID',
      rules: z.string().min(1, 'VLAN ID不能为空'),
      componentProps: {
        placeholder: '请输入VLAN ID',
      },
    },
    {
      component: 'Input',
      fieldName: 'vlan_name',
      label: 'VLAN名称',
      rules: z.string().min(1, 'VLAN名称不能为空'),
      componentProps: {
        placeholder: '请输入VLAN名称',
      },
    },
    {
      component: 'Input',
      fieldName: 'network_segment',
      label: '网段',
      componentProps: {
        placeholder: '请输入网段，如：192.0.2.0/24',
      },
    },
    {
      component: 'Input',
      fieldName: 'gateway',
      label: '网关',
      componentProps: {
        placeholder: '请输入网关地址',
      },
    },
    {
      component: 'Input',
      fieldName: 'subnet_mask',
      label: '子网掩码',
      componentProps: {
        placeholder: '请输入子网掩码，如：255.255.255.0',
      },
    },
    {
      component: 'Select',
      fieldName: 'region_id',
      label: '区域',
      componentProps: {
        placeholder: '请选择区域',
        allowClear: true,
        options: [],
        fieldNames: {
          label: 'region_name',
          value: 'region_id',
        },
      },
    },
    {
      component: 'Select',
      fieldName: 'group_id',
      label: '分组',
      componentProps: {
        placeholder: '请选择分组',
        allowClear: true,
        options: [],
        fieldNames: {
          label: 'group_name',
          value: 'id',
        },
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
          await updateVLAN(data.value.id, values as any);
          message.success('更新成功');
          modalApi.close();
        } else {
          // 新增
          await createVLAN(values as any);
          message.success('创建成功');
          modalApi.close();
        }
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      // 错误会被 errorMessageResponseInterceptor 自动处理并显示
      // 这里只需要记录日志
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

      // 更新区域和分组选项
      formApi.updateSchema([
        {
          fieldName: 'region_id',
          componentProps: {
            options: regions.value,
          },
        },
        {
          fieldName: 'group_id',
          componentProps: {
            options: vlanGroups.value,
          },
        },
      ]);

      // 设置表单值
      await formApi.setValues(isEdit.value ? data.value : defaultFormValues);
    } else {
      data.value = {};
      isEdit.value = false;
      await formApi.setValues(defaultFormValues);
    }
  },
  title: 'VLAN',
});
</script>

<template>
  <Modal>
    <BaseForm />
  </Modal>
</template>
