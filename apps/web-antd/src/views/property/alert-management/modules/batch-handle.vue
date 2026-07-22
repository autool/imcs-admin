<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { RobotOutlined } from '@ant-design/icons-vue';
import { Button, Input, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { batchHandleAlerts } from '#/api/assets/alert-management';
import { chatWithAIApi } from '#/api/system/ai';

const emits = defineEmits<{
  success: [];
}>();

const { hasAccessByCodes } = useAccess();
const canUseAi = computed(() => hasAccessByCodes(['system_ai:test']));
const isGenerating = ref(false);
const aiBuffer = ref('');
const selectedCount = ref(0);
const selectedIds = ref<string[]>([]);

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
        placeholder: '批量处理选中的告警',
      },
      fieldName: 'alert_name',
      label: '告警数量',
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

async function handleAiGenerate() {
  if (!canUseAi.value) {
    message.warning('无权限使用 AI 生成');
    return;
  }
  const values = await formApi.getValues();

  const prompt = `你是一名运维工程师，正在批量处理一批告警，请帮我生成一段专业的批量处理说明。

处理结果：${values.result === 'processing' ? '继续处理' : '已解决'}
告警数量：${selectedCount.value} 条

要求：
1. 语气专业、客观，符合运维操作规范。
2. 说明批量处理的统一措施。
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

    if (selectedIds.value.length === 0) {
      message.warning('没有选中的告警');
      return;
    }

    const values = await formApi.getValues();
    modalApi.lock();

    try {
      await batchHandleAlerts({
        alert_ids: selectedIds.value,
        action: 'handle',
        result: values.result,
        handle_note: values.handle_note,
      });
      message.success(`成功处理 ${selectedIds.value.length} 条告警`);
      emits('success');
      modalApi.close();
    } catch (error: any) {
      message.error(error?.message || '批量处理失败');
      modalApi.unlock();
    }
  },

  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{ alert_ids: string[]; count: number }>();

      formApi.resetForm();
      isGenerating.value = false;
      aiBuffer.value = '';

      if (data) {
        selectedIds.value = data.alert_ids;
        selectedCount.value = data.count;
        formApi.setValues({
          alert_name: `共 ${data.count} 条告警`,
        });
      }
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="批量处理告警">
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
            placeholder="请输入批量处理说明"
            class="!w-full !max-w-none"
            style="width: 100%; max-width: none; height: 120px"
          />
        </div>
      </template>
    </Form>
  </Modal>
</template>
