<script lang="ts" setup>
import type { AIModel } from '../data';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createAIModelApi,
  testAIModelApi,
  updateAIModelApi,
} from '#/api/system/ai';

import { useFormSchema } from '../data';

defineOptions({ name: 'SystemAIModelForm' });

const emits = defineEmits(['success']);

const formData = ref<AIModel>();
const testLoading = ref(false);

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const id = ref<string>();

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    drawerApi.lock();

    try {
      if (id.value) {
        await updateAIModelApi(id.value, values);
        message.success('更新成功');
      } else {
        await createAIModelApi(values);
        message.success('创建成功');
      }
      emits('success');
      drawerApi.close();
    } catch (error: any) {
      message.error(error.message || '操作失败');
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<AIModel>();
      formApi.resetForm();

      if (data && data.id) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
        formData.value = undefined;
      }

      // 等待DOM更新
      await nextTick();

      if (data && data.id) {
        // 编辑时设置表单值
        formApi.setValues({
          ...data,
          enabled: data.enabled ?? true,
          is_default: data.is_default ?? false,
        });
      }
    }
  },
});

const getDrawerTitle = computed(() => {
  return formData.value?.id ? '编辑AI模型' : '创建AI模型';
});

async function handleTest() {
  const { valid } = await formApi.validate();
  if (!valid) {
    message.warning('请先填写完整的模型信息');
    return;
  }

  testLoading.value = true;
  try {
    if (id.value) {
      // 编辑模式：测试已保存的模型
      await testAIModelApi(id.value);
      message.success('连接测试成功');
    } else {
      // 创建模式：提示需要先保存
      message.warning('请先保存模型后再测试');
    }
  } catch (error: any) {
    message.error(error.message || '连接测试失败');
  } finally {
    testLoading.value = false;
  }
}
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <Form />
    <template #footer>
      <div class="flex w-full items-center justify-between">
        <Button v-if="id" :loading="testLoading" @click="handleTest">
          测试连接
        </Button>
        <div v-else></div>
        <div class="flex gap-2">
          <Button @click="drawerApi.close()">取消</Button>
          <Button type="primary" @click="drawerApi.onConfirm()">确定</Button>
        </div>
      </div>
    </template>
  </Drawer>
</template>
