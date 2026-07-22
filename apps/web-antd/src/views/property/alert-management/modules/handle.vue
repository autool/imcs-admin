<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AlertManagementApi } from '#/api/assets/alert-management';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { RobotOutlined } from '@ant-design/icons-vue';
import { Button, Input, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { handleAlert } from '#/api/assets/alert-management';
import { chatWithAIApi } from '#/api/system/ai';

const emits = defineEmits<{
  success: [];
}>();

const { hasAccessByCodes } = useAccess();
const canUseAi = computed(() => hasAccessByCodes(['system_ai:test']));
const isGenerating = ref(false);
const aiBuffer = ref('');

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
        disabled: true,
      },
      fieldName: 'alert_name',
      label: '告警名称',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '继续处理', value: 'processing' },
          { label: '已解决', value: 'resolved' },
        ],
        placeholder: '请选择处理结果',
      },
      fieldName: 'result',
      label: '处理结果',
      rules: 'required',
    },
    {
      component: 'Textarea',
      fieldName: 'handle_note',
      label: '处理说明',
      rules: 'required',
    },
  ] as VbenFormSchema[],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const alertData = ref<AlertManagementApi.Alert>();

async function handleAiGenerate() {
  if (!canUseAi.value) {
    message.warning('无权限使用 AI 生成');
    return;
  }
  const values = await formApi.getValues();
  const data = alertData.value;

  const prompt = `你是一名运维工程师，正在处理一条告警，请帮我生成一段专业的处理说明。
告警名称：${values.alert_name || '未知'}
告警详情：
- 告警源：${data?.source || '-'}
- 告警IP：${data?.device_ip || '-'}
- 严重程度：${data?.severity || '-'}
- 告警类型：${data?.alert_type || '-'}
- 告警描述：${data?.description || '-'}
- 告警时间：${data?.alert_time || '-'}

要求：
1. 语气专业、客观，符合运维操作规范。
2. 描述可能的处理思路，如：排查方向、可能原因、建议操作。
3. 不超过 80 字。
4. 直接输出内容，不要包含"好的"、"以下是..."等废话。`;

  isGenerating.value = true;
  aiBuffer.value = '';
  await formApi.setFieldValue('handle_note', '');

  try {
    await chatWithAIApi(prompt, (content) => {
      aiBuffer.value += (content || '').trimEnd();
      formApi.setFieldValue('handle_note', aiBuffer.value.trim());
    });
  } catch {
    message.error('AI 生成失败，请手动输入');
  } finally {
    isGenerating.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    const currentAlert = alertData.value;
    if (!currentAlert) return;
    modalApi.lock();

    try {
      await handleAlert(currentAlert.alert_id, values);
      emits('success');
      modalApi.close();
    } catch {
      modalApi.unlock();
    }
  },

  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<AlertManagementApi.Alert>();

      formApi.resetForm();
      isGenerating.value = false;
      aiBuffer.value = '';

      if (data) {
        alertData.value = data;
        formApi.setValues({
          alert_name: data.alert_name,
        });
      }
    }
  },
});
</script>

<template>
  <Modal title="处理告警">
    <Form>
      <template #handle_note="slotProps">
        <div class="relative w-full pt-7">
          <div class="absolute right-0 top-0">
            <Button
              v-if="canUseAi"
              type="link"
              size="small"
              class="flex !h-auto items-center !p-0"
              :disabled="isGenerating"
              @click="handleAiGenerate"
            >
              <template v-if="!isGenerating">
                <RobotOutlined /> AI 自动生成
              </template>
              <template v-else>
                <RobotOutlined spin class="text-blue-500" />
                <span class="text-gray-400">生成中...</span>
              </template>
            </Button>
          </div>
          <Input.TextArea
            v-bind="slotProps"
            :rows="3"
            placeholder="请输入处理说明"
            class="!w-full !max-w-none"
            style="width: 100%; max-width: none; height: 120px"
          />
        </div>
      </template>
    </Form>
  </Modal>
</template>
