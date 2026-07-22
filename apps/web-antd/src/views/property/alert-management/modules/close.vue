<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AlertManagementApi } from '#/api/assets/alert-management';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { RobotOutlined } from '@ant-design/icons-vue';
import { Button, Input, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { closeAlert } from '#/api/assets/alert-management';
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
  layout: 'vertical',
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
          { label: '误报', value: 'false_positive' },
          { label: '测试告警', value: 'test' },
          { label: '已知问题', value: 'known_issue' },
          { label: '无需处理', value: 'wont_fix' },
          { label: '重复告警', value: 'duplicate' },
          { label: '其他', value: 'other' },
        ],
        placeholder: '请选择关闭原因',
      },
      fieldName: 'reason_type',
      label: '关闭原因',
      rules: 'required',
    },
    {
      component: 'Textarea',
      fieldName: 'reason_note',
      label: '详细说明',
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
  if (!values.reason_type) {
    formApi.form.setFieldError('reason_type', '请先选择关闭原因');
    return;
  }

  const alertName = values.alert_name;
  const reasonType = values.reason_type;
  const reasonLabel = getReasonLabel(reasonType);
  const data = alertData.value;

  let prompt = `我正在关闭一个运维告警，请帮我生成一段详细说明。
告警名称：${alertName}
关闭原因：${reasonLabel}`;

  if (data) {
    prompt += `
告警详情：
- 告警源：${data.source}
- 告警IP：${data.device_ip}
- 告警描述：${data.description}
- 告警时间：${data.alert_time}
`;
  }

  prompt += `
要求：
1. 语气专业、客观。
2. 结合告警详情，解释为什么基于该原因关闭告警。
   - 如果是误报，说明可能是监测阈值或规则配置问题。
   - 如果是测试告警，说明是测试数据可安全关闭。
   - 如果是已知问题，说明已纳入跟进计划。
   - 如果是重复告警，说明已合并处理。
3. 不超过 80 字。
4. 直接输出内容，不要包含"好的"、"以下是..."等废话。`;

  isGenerating.value = true;
  aiBuffer.value = '';
  await formApi.setFieldValue('reason_note', '');

  try {
    await chatWithAIApi(prompt, (content) => {
      aiBuffer.value += (content || '').trimEnd();
      formApi.setFieldValue('reason_note', aiBuffer.value.trim());
    });
  } catch {
    message.error('AI 生成失败，请手动输入');
  } finally {
    isGenerating.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  title: '关闭告警',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    const currentAlert = alertData.value;
    if (!currentAlert) return;
    modalApi.lock();

    try {
      const reason = `[${getReasonLabel(values.reason_type)}] ${values.reason_note || ''}`;
      await closeAlert(currentAlert.alert_id, {
        reason_type: values.reason_type,
        reason_note: values.reason_note || '',
        reason,
      });
      emits('success');
      modalApi.close();
    } catch (error: any) {
      message.error(error?.message || '关闭失败');
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

function getReasonLabel(value: string) {
  const map: Record<string, string> = {
    false_positive: '误报',
    test: '测试告警',
    known_issue: '已知问题',
    wont_fix: '无需处理',
    duplicate: '重复告警',
    other: '其他',
  };
  return map[value] || value;
}
</script>

<template>
  <Modal>
    <Form>
      <template #reason_note="slotProps">
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
            placeholder="请输入详细说明"
            class="!w-full !max-w-none"
            style="width: 100%; max-width: none; height: 120px"
          />
        </div>
      </template>
    </Form>
  </Modal>
</template>
