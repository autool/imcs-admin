<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AlertManagementApi } from '#/api/assets/alert-management';
import type { SystemUserOption } from '#/utils/system-user-options';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { assignAlert } from '#/api/assets/alert-management';
import { loadSystemUserOptions } from '#/utils/system-user-options';

const emits = defineEmits<{
  success: [];
}>();

const users = ref<SystemUserOption[]>([]);

const formSchema = computed<VbenFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: {
      disabled: true,
    },
    fieldName: 'alert_name',
    label: '告警名称',
  },
  {
    component: 'Select',
    componentProps: {
      options: users.value,
      placeholder: '请选择处理人员',
      showSearch: true,
      filterOption: (input: string, option: any) => {
        return option.label.toLowerCase().includes(input.toLowerCase());
      },
    },
    fieldName: 'assignee_user_id',
    label: '处理人员',
    rules: 'required',
  },
]);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: formSchema.value,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const alertId = ref<string>();

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    const currentAlertId = alertId.value;
    if (!currentAlertId) return;
    modalApi.lock();

    try {
      await assignAlert(currentAlertId, {
        assignee_user_id: values.assignee_user_id,
      });
      emits('success');
      modalApi.close();
    } catch {
      modalApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      // 加载用户列表
      if (users.value.length === 0) {
        try {
          const { options } = await loadSystemUserOptions({
            include_disabled: true,
          });
          users.value = options;
        } catch (error) {
          console.error('加载用户列表失败:', error);
        }
      }

      const data = modalApi.getData<AlertManagementApi.Alert>();

      formApi.resetForm();

      if (data) {
        alertId.value = data.alert_id;
        formApi.setValues({
          alert_name: data.alert_name,
          assignee_user_id: data.handler_user_id || undefined,
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
