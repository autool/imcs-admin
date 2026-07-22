<script lang="ts" setup>
import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { createBusinessIP, updateBusinessIP } from '#/api/network/business-ips';
import { matchVLANByIP } from '#/api/network/vlans';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const data = ref<Record<string, any>>({});
const isEdit = ref(false);
const userOptions = ref<Array<{ label: string; value: string }>>([]);
let matchTimer: ReturnType<typeof setTimeout> | undefined;
let matchRequestNo = 0;

const defaultFormValues = {
  gateway: undefined,
  ip_address: undefined,
  ip_person: undefined,
  ip_user_id: undefined,
  ip_type: 'business',
  mac_address: undefined,
  network_segment: undefined,
  notes: undefined,
  server_id: undefined,
  status: 'active',
  subnet_mask: undefined,
  usage_purpose: undefined,
  vlan_id: undefined,
  vlan_group_id: undefined,
  vlan_group_name: undefined,
};

function isIPv4Address(value?: string) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test((value || '').trim());
}

async function clearVLANFields() {
  await formApi.setValues({
    gateway: undefined,
    network_segment: undefined,
    subnet_mask: undefined,
    vlan_id: undefined,
    vlan_group_id: undefined,
    vlan_group_name: undefined,
  });
}

function buildSubmitValues(values: Record<string, any>) {
  const {
    ip_person: _ipPerson,
    vlan_group_id: _vlanGroupId,
    vlan_group_name: _vlanGroupName,
    ...submitValues
  } = values;
  return submitValues;
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
        fieldName: 'ip_user_id',
      },
    ]);
  } catch (error) {
    console.error('加载用户失败:', error);
    userOptions.value = [];
  }
}

function handleIPAddressChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const ipAddress = target.value?.trim();

  if (matchTimer) {
    clearTimeout(matchTimer);
  }

  matchTimer = setTimeout(async () => {
    const currentRequestNo = ++matchRequestNo;
    if (!isIPv4Address(ipAddress)) {
      await clearVLANFields();
      return;
    }

    try {
      const vlan = await matchVLANByIP(ipAddress);
      if (currentRequestNo !== matchRequestNo) {
        return;
      }
      if (!vlan) {
        await clearVLANFields();
        return;
      }

      await formApi.setValues({
        gateway: vlan.gateway,
        network_segment: vlan.network_segment,
        subnet_mask: vlan.subnet_mask,
        vlan_id: vlan.vlan_id,
        vlan_group_id: vlan.group_id,
        vlan_group_name: vlan.group_name,
      });
      const groupText = vlan.group_name ? ` / ${vlan.group_name}` : '';
      message.success(
        `已自动匹配 VLAN：${vlan.vlan_id} ${vlan.vlan_name}${groupText}`,
      );
    } catch (error) {
      console.error('VLAN 自动匹配失败:', error);
    }
  }, 500);
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
      fieldName: 'ip_address',
      label: 'IP地址',
      rules: z.string().min(1, 'IP地址不能为空'),
      componentProps: {
        onChange: handleIPAddressChange,
        placeholder: '请输入IP地址',
      },
    },
    {
      component: 'Input',
      fieldName: 'vlan_id',
      label: '所属VLAN',
      componentProps: {
        placeholder: '输入IP后自动判断所属VLAN',
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'network_segment',
      label: '网段',
      componentProps: {
        placeholder: '自动匹配VLAN网段',
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'vlan_group_name',
      label: 'VLAN分组',
      componentProps: {
        placeholder: '输入IP后自动判断VLAN分组',
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'gateway',
      label: '网关',
      componentProps: {
        placeholder: '自动匹配VLAN网关',
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'subnet_mask',
      label: '子网掩码',
      componentProps: {
        placeholder: '自动匹配VLAN子网掩码',
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'mac_address',
      label: 'MAC地址',
      componentProps: {
        placeholder: '请输入MAC地址',
      },
    },
    {
      component: 'Select',
      fieldName: 'ip_type',
      label: 'IP类型',
      componentProps: {
        placeholder: '请选择IP类型',
        options: [
          { label: '业务IP', value: 'business' },
          { label: '管理IP', value: 'management' },
          { label: '服务地址', value: 'service' },
          { label: '存储IP', value: 'storage' },
          { label: '交换机', value: 'switch' },
          { label: '防火墙', value: 'firewall' },
          { label: '安全设备', value: 'security' },
          { label: '终端', value: 'terminal' },
          { label: '资产地址', value: 'asset' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        placeholder: '请选择状态',
        options: [
          { label: '使用中', value: 'active' },
          { label: '未使用', value: 'inactive' },
          { label: '预留', value: 'reserved' },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'server_id',
      label: '服务器ID',
      componentProps: {
        placeholder: '请输入服务器ID（可选）',
      },
    },
    {
      component: 'Select',
      fieldName: 'ip_user_id',
      label: 'IP地址负责人',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: userOptions.value,
        placeholder: '请选择IP地址负责人',
        showSearch: true,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'usage_purpose',
      label: '用途说明',
      componentProps: {
        placeholder: '请输入用途说明',
        rows: 3,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'notes',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注',
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
        const submitValues = buildSubmitValues(values as Record<string, any>);

        if (isEdit.value && data.value.id) {
          // 编辑
          await updateBusinessIP(data.value.id, submitValues as any);
          message.success('更新成功');
          modalApi.close();
        } else {
          // 新增
          await createBusinessIP(submitValues as any);
          message.success('创建成功');
          modalApi.close();
        }
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      // 错误会被 errorMessageResponseInterceptor 自动处理并显示
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      await loadUsers();
      const modalData = modalApi.getData<Record<string, any>>();
      data.value = modalData?.values || {};
      isEdit.value = !!data.value.id;

      // 等待表单组件渲染完成
      await nextTick();

      // 设置表单值
      await formApi.setValues(isEdit.value ? data.value : defaultFormValues);
    } else {
      if (matchTimer) {
        clearTimeout(matchTimer);
        matchTimer = undefined;
      }
      matchRequestNo++;
      data.value = {};
      isEdit.value = false;
      await formApi.setValues(defaultFormValues);
    }
  },
  title: '业务地址',
});
</script>

<template>
  <Modal>
    <BaseForm />
  </Modal>
</template>
